import { validateAiExperienceResponse, ValidatedAiExperience } from './aiSchema';
import { calculateBlendDominantLight } from '../hardware/lightEngine';

export interface GenerateAromaResult {
  success: boolean;
  blend?: ValidatedAiExperience;
  error?: string;
}

export async function generateAromaExperience(userPrompt: string): Promise<GenerateAromaResult> {
  const trimmed = userPrompt.trim();
  if (!trimmed) {
    return { success: false, error: 'Please enter a description of what you would like to smell.' };
  }

  try {
    const res = await fetch('/api/ai/generate-aroma', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: trimmed })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `AI server returned ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();

    // Strict schema validation using Zod
    const validation = validateAiExperienceResponse(json);
    if (!validation.success || !validation.data) {
      return {
        success: false,
        error: validation.error || 'AI returned an invalid formula configuration.'
      };
    }

    // Ensure balanced dominant light is present
    if (!validation.data.light || (validation.data.light.r === 0 && validation.data.light.g === 0 && validation.data.light.b === 0)) {
      validation.data.light = calculateBlendDominantLight(validation.data.channels);
    }

    return {
      success: true,
      blend: validation.data
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Failed to synthesize aroma: ${message}`
    };
  }
}
