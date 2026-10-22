import { z } from 'zod';
import { WORKING_AROMA_CHANNELS, CHANNEL_MAP } from '../../data/aromas';

// Set of strictly allowed channel IDs for AI generation
// Broken channels H14 (Cinnamon) and H27 (Ester Fruit) and non-scent channels (H02, H03, H13, H30, H01, H12, H17, H26) are excluded.
export const VALID_AI_CHANNEL_IDS = new Set(
  WORKING_AROMA_CHANNELS.map((c) => c.id)
);

export const AiChannelItemSchema = z.object({
  channelId: z.string().refine((id) => VALID_AI_CHANNEL_IDS.has(id.toUpperCase()), {
    message: 'Invalid aroma channel selected by AI. Must be an active working aroma channel.'
  }),
  intensity: z.number().min(0.01, 'Intensity must be greater than 0').max(1.0, 'Intensity cannot exceed 1.0'),
  reason: z.string().optional()
});

export const AiExperienceSchema = z.object({
  title: z.string().min(1).default('Custom Olfactory Blend'),
  description: z.string().min(1),
  channels: z
    .array(AiChannelItemSchema)
    .min(1, 'At least 1 aroma channel must be provided')
    .max(3, 'A maximum of 3 aroma channels are permitted for balanced dispersion'),
  light: z.object({
    r: z.number().int().min(0).max(255),
    g: z.number().int().min(0).max(255),
    b: z.number().int().min(0).max(255)
  }),
  durationSeconds: z.number().int().min(10).max(1800).default(60),
  batchId: z.string().optional(),
  formulaCode: z.string().optional()
});

export type ValidatedAiExperience = z.infer<typeof AiExperienceSchema>;

/**
 * Validates raw AI JSON output with Zod
 */
export function validateAiExperienceResponse(rawData: unknown): {
  success: boolean;
  data?: ValidatedAiExperience;
  error?: string;
} {
  const result = AiExperienceSchema.safeParse(rawData);
  if (!result.success) {
    const errorDetails = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return {
      success: false,
      error: `AI Response Validation Error: ${errorDetails}`
    };
  }

  // Double check that defective channels are not present
  for (const ch of result.data.channels) {
    const upperId = ch.channelId.toUpperCase();
    if (upperId === 'H14' || upperId === 'H27') {
      return {
        success: false,
        error: `Validation rejected defective hardware channel ${upperId}`
      };
    }
    if (!CHANNEL_MAP[upperId] || CHANNEL_MAP[upperId].status !== 'working') {
      return {
        success: false,
        error: `Validation rejected non-working channel ${upperId}`
      };
    }
  }

  return {
    success: true,
    data: result.data
  };
}
