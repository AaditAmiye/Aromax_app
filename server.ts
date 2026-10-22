import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// List of strictly working aroma channels for prompt injection
const WORKING_CHANNELS_PROMPT = `
WORKING AROMA CHANNELS AVAILABLE ON AROMAXAI DEVICE:
- H04: Pizza / Burger (Savory, baked crust, umami)
- H05: Chocolate (Rich dark roasted cacao, sweet gourmand)
- H06: Royal Perfume (Velvety ambergris, luxury oriental, musk)
- H07: Faint Rose (Delicate dewy blooming rose petals)
- H08: Vanilla (Warm bourbon vanilla bean, comforting sweet)
- H09: Faint Chai (Steamed spiced black tea, cardamom & ginger)
- H10: Biryani / Tadka (Savory basmati spices, cumin & allicin)
- H11: Clove (Warm pungent eugenol clove bud)
- H15: Bitter Citrus / Alcohol Perfume (Limonene, sparkling bitter zest)
- H16: Sweet Milk / Mithai (Condensed milk, sweet creamy lactonic)
- H18: Sandalwood (Mysore aged heartwood, deep sacred woody)
- H19: Soil / Mitti + Rain (Geosmin, intense petrichor, damp earth)
- H20: Faint Bitter Smell (Artemisia herbal bitter ground)
- H21: Garlic Oil / Mustard Oil (Pungent cold-pressed mustard & garlic)
- H22: Lavender + Lotus perfume (French floral, serene calming lavender)
- H23: Ayurvedic Pain Relief Spray (Herbal eucalyptus, camphor)
- H24: Coffee (Dark roasted espresso crema, roasted)
- H25: Peppermint / Colgate-like mint (Crisp crystalline menthol, icy fresh)
- H28: Burning Wood (Dry birch logs crackling in fireplace, smoky)
- H29: Sweet Cardamom (Fresh green cardamom pod spice)
- H31: Water / Neutral (Pure water ion carrier; ONLY use if no other scent fits)
- H32: Hospital / Phenyl (Clinical sterile sanitizing antiseptic)
- H33: Puja / Temple (Sacred sanctum smoke, sambrani & dhoop incense)
- H34: Kesar / Saffron (Kashmiri saffron stigmata, royal golden spice)

STRICT RULES & HARMONIC BLENDING CONSTRAINTS:
1. ONLY USE WORKING CHANNELS FROM THE ABOVE LIST.
2. DO NOT use defective channels H14 (Cinnamon) or H27 (Ester Fruit).
3. DO NOT use non-scent channels (LEDs H02, H03, H13 or fan H30 or unassigned ports H01, H12, H17, H26).
4. CREATE A BLEND OF AT MOST 3 SMELLS (1, 2, or 3 channels maximum). Never return 4 or more.
5. UNDERSTAND THE USER'S TRUE INTENT & DO NOT MAKE RANDOM COMBINATIONS:
   - Carefully interpret the user's emotional mood, imagery, memory, or culinary/atmospheric intent.
   - Combine channels that form an authentic, harmonious olfactory chord (Top, Heart, Base).
   - NEVER create discordant or random mixtures (e.g. never combine savory garlic/pizza with floral rose or chocolate unless the user explicitly asks for such a clash).
   - Exemplary harmonious pairings:
     * Cafe / Morning: H24 (Coffee) + H08 (Vanilla) or H16 (Sweet Milk)
     * Monsoon / Petrichor: H19 (Soil / Mitti + Rain) + H18 (Sandalwood) + H25 (Peppermint for fresh breeze)
     * Sacred Temple: H33 (Puja / Temple) + H18 (Sandalwood) + H34 (Kesar / Saffron)
     * Fireside / Autumn: H28 (Burning Wood) + H18 (Sandalwood)
     * Bedtime / Tranquility: H22 (Lavender + Lotus) + H08 (Vanilla)
     * Fresh Awakening: H15 (Bitter Citrus) + H25 (Peppermint)
     * Royal Indian Cuisine: H10 (Biryani / Tadka) + H29 (Sweet Cardamom) + H34 (Kesar)
     * Sweet Confectionery: H05 (Chocolate) + H08 (Vanilla) + H16 (Sweet Milk)
6. ADJUST ATMOSPHERIC LIGHT COLOR (RGB) TO MATCH THE BLEND:
   - Choose a vibrant, evocative RGB light matching the sensory temperature and mood:
     * Forest / Rain / Mitti -> Deep emerald green or petrichor teal (e.g., [46, 185, 96] or [24, 140, 160])
     * Coffee / Cafe -> Warm roasted caramel amber (e.g., [185, 110, 45])
     * Fireplace / Hearth -> Glowing ember orange (e.g., [255, 110, 20])
     * Temple / Aarti -> Sacred golden saffron (e.g., [245, 158, 20])
     * Lavender / Calm -> Soft twilight violet (e.g., [155, 95, 225])
     * Citrus / Energy -> Radiant sunlit yellow-gold (e.g., [250, 215, 30])
     * Peppermint / Ice -> Crisp polar cyan (e.g., [20, 215, 205])
     * Royal Perfume / Velvet -> Imperial amber gold (e.g., [218, 165, 32])
7. INTENSITIES:
   - Positive numbers between 0.05 and 1.0. The intensities of the selected channels should sum to approximately 1.0.
8. REASON:
   - For every selected channel, provide a succinct 4-8 word reason explaining why it contributes to the user's requested experience.
`;

// Channel color lookup for lighting calculation
const CHANNEL_LIGHT_MAP: Record<string, { r: number; g: number; b: number }> = {
  H04: { r: 235, g: 120, b: 40 },
  H05: { r: 110, g: 60, b: 35 },
  H06: { r: 218, g: 165, b: 32 },
  H07: { r: 255, g: 90, b: 120 },
  H08: { r: 255, g: 190, b: 70 },
  H09: { r: 210, g: 140, b: 65 },
  H10: { r: 240, g: 130, b: 20 },
  H11: { r: 180, g: 75, b: 40 },
  H15: { r: 245, g: 215, b: 30 },
  H16: { r: 250, g: 235, b: 195 },
  H18: { r: 217, g: 119, b: 6 },
  H19: { r: 180, g: 83, b: 9 },
  H20: { r: 130, g: 120, b: 85 },
  H21: { r: 200, g: 160, b: 20 },
  H22: { r: 155, g: 81, b: 224 },
  H23: { r: 80, g: 180, b: 140 },
  H24: { r: 139, g: 69, b: 19 },
  H25: { r: 0, g: 199, b: 190 },
  H28: { r: 255, g: 107, b: 0 },
  H29: { r: 160, g: 190, b: 60 },
  H31: { r: 0, g: 113, b: 227 },
  H32: { r: 190, g: 215, b: 230 },
  H33: { r: 245, g: 158, b: 11 },
  H34: { r: 255, g: 153, b: 51 }
};

// Valid working aroma channels set
const WORKING_CHANNELS_SET = new Set([
  'H04', 'H05', 'H06', 'H07', 'H08', 'H09', 'H10', 'H11',
  'H15', 'H16', 'H18', 'H19', 'H20', 'H21', 'H22', 'H23',
  'H24', 'H25', 'H28', 'H29', 'H31', 'H32', 'H33', 'H34'
]);

// Helper: Semantic fallback generator if Gemini API key is missing or on error
function fallbackSemanticSynthesis(userPrompt: string) {
  const p = userPrompt.toLowerCase();
  
  if (p.includes('rain') || p.includes('petrichor') || p.includes('soil') || p.includes('mitti') || p.includes('earth') || p.includes('monsoon')) {
    return {
      title: 'Monsoon Petrichor & Damp Earth',
      description: 'First drops of monsoon rain striking hot baked clay, deepened with ancient Mysore sandalwood and a crisp rain breeze.',
      channels: [
        { channelId: 'H19', intensity: 0.65, reason: 'First rain striking baked clay' },
        { channelId: 'H18', intensity: 0.25, reason: 'Aged sandalwood base depth' },
        { channelId: 'H25', intensity: 0.10, reason: 'Crisp moist ozone breeze' }
      ],
      light: { r: 46, g: 185, b: 96 },
      durationSeconds: 180,
      batchId: 'RF-9042',
      formulaCode: '#48-A'
    };
  }

  if (p.includes('coffee') || p.includes('cafe') || p.includes('café') || p.includes('espresso') || p.includes('morning') || p.includes('roast')) {
    return {
      title: 'Artisan Espresso & Sweet Cream',
      description: 'Rich dark roasted espresso crema gently softened with warm bourbon vanilla and condensed sweet milk.',
      channels: [
        { channelId: 'H24', intensity: 0.65, reason: 'Freshly pulled dark roast espresso' },
        { channelId: 'H08', intensity: 0.25, reason: 'Bourbon vanilla bean sweetness' },
        { channelId: 'H16', intensity: 0.10, reason: 'Warm steamed milk froth' }
      ],
      light: { r: 185, g: 110, b: 45 },
      durationSeconds: 120,
      batchId: 'CF-4491',
      formulaCode: '#09-C'
    };
  }

  if (p.includes('temple') || p.includes('puja') || p.includes('incense') || p.includes('prayer') || p.includes('spiritual') || p.includes('aarti') || p.includes('sanctum')) {
    return {
      title: 'Sanctum Aarti & Royal Dhoop',
      description: 'Sacred sambrani temple smoke with carved Mysore sandalwood sanctum and steeped Kashmiri saffron threads.',
      channels: [
        { channelId: 'H33', intensity: 0.55, reason: 'Sacred dhoop and sambrani smoke' },
        { channelId: 'H18', intensity: 0.30, reason: 'Carved sacred sandalwood altar' },
        { channelId: 'H34', intensity: 0.15, reason: 'Warm golden Kashmiri saffron' }
      ],
      light: { r: 245, g: 158, b: 20 },
      durationSeconds: 240,
      batchId: 'TP-8820',
      formulaCode: '#33-T'
    };
  }

  if (p.includes('fire') || p.includes('campfire') || p.includes('hearth') || p.includes('smoke') || p.includes('bonfire') || p.includes('autumn') || p.includes('wood')) {
    return {
      title: 'Alpine Fireside & Birch Hearth',
      description: 'Crackling dry birch logs in a stone hearth glowing with embers, softened by fragrant sandalwood.',
      channels: [
        { channelId: 'H28', intensity: 0.75, reason: 'Charred birch log crackle' },
        { channelId: 'H18', intensity: 0.25, reason: 'Warm woody hearth backing' }
      ],
      light: { r: 255, g: 110, b: 20 },
      durationSeconds: 150,
      batchId: 'FP-1205',
      formulaCode: '#28-W'
    };
  }

  if (p.includes('lavender') || p.includes('sleep') || p.includes('relax') || p.includes('calm') || p.includes('stress') || p.includes('night') || p.includes('spa')) {
    return {
      title: 'Serene Twilight & French Lavender',
      description: 'Tranquil French lavender and water lotus blossom deepened with warm vanilla for evening relaxation.',
      channels: [
        { channelId: 'H22', intensity: 0.70, reason: 'Serene French lavender & lotus' },
        { channelId: 'H08', intensity: 0.30, reason: 'Comforting warm vanilla' }
      ],
      light: { r: 155, g: 95, b: 225 },
      durationSeconds: 180,
      batchId: 'LV-3104',
      formulaCode: '#22-L'
    };
  }

  if (p.includes('biryani') || p.includes('tadka') || p.includes('spice') || p.includes('food') || p.includes('curry')) {
    return {
      title: 'Dum Biryani & Royal Shahi Tadka',
      description: 'Steaming dum basmati rice infused with whole cracked green cardamom and steeped Mogra saffron.',
      channels: [
        { channelId: 'H10', intensity: 0.70, reason: 'Dum cooked basmati rice & tadka' },
        { channelId: 'H29', intensity: 0.20, reason: 'Fresh crushed green cardamom' },
        { channelId: 'H34', intensity: 0.10, reason: 'Kashmiri saffron threads' }
      ],
      light: { r: 240, g: 130, b: 20 },
      durationSeconds: 140,
      batchId: 'BY-5520',
      formulaCode: '#10-B'
    };
  }

  if (p.includes('chocolate') || p.includes('cake') || p.includes('dessert') || p.includes('sweet') || p.includes('pastry') || p.includes('cookie')) {
    return {
      title: 'Grand Chocolat & Sweet Pâtisserie',
      description: 'Rich dark roasted cacao notes blended with Madagascar bourbon vanilla and condensed sweet milk glaze.',
      channels: [
        { channelId: 'H05', intensity: 0.55, reason: 'Dark roasted cacao bean' },
        { channelId: 'H08', intensity: 0.30, reason: 'Bourbon vanilla bean' },
        { channelId: 'H16', intensity: 0.15, reason: 'Creamy condensed sweet milk' }
      ],
      light: { r: 140, g: 75, b: 40 },
      durationSeconds: 120,
      batchId: 'DS-2098',
      formulaCode: '#16-D'
    };
  }

  if (p.includes('citrus') || p.includes('lemon') || p.includes('orange') || p.includes('fresh') || p.includes('wake') || p.includes('energy') || p.includes('mint')) {
    return {
      title: 'Sparkling Citrus & Alpine Menthol',
      description: 'Vibrant sparkling citrus zest bursting with invigorating peppermint menthol for crystal clarity.',
      channels: [
        { channelId: 'H15', intensity: 0.60, reason: 'Sparkling bitter citrus zest' },
        { channelId: 'H25', intensity: 0.40, reason: 'Icy crystal peppermint breeze' }
      ],
      light: { r: 245, g: 215, b: 30 },
      durationSeconds: 120,
      batchId: 'CT-1102',
      formulaCode: '#15-C'
    };
  }

  if (p.includes('luxury') || p.includes('hotel') || p.includes('palace') || p.includes('perfume') || p.includes('royal')) {
    return {
      title: 'Imperial Palace & Royal Velvet',
      description: 'Prestige royal ambergris perfume deepened with Mysore sandalwood heartwood and golden saffron.',
      channels: [
        { channelId: 'H06', intensity: 0.65, reason: 'Velvety royal amber perfume' },
        { channelId: 'H18', intensity: 0.25, reason: 'Aged sandalwood base note' },
        { channelId: 'H34', intensity: 0.10, reason: 'Golden saffron touch' }
      ],
      light: { r: 218, g: 165, b: 32 },
      durationSeconds: 180,
      batchId: 'LX-7701',
      formulaCode: '#06-R'
    };
  }

  if (p.includes('tea') || p.includes('chai') || p.includes('masala')) {
    return {
      title: 'Steamed Masala Chai & Cardamom',
      description: 'Traditional slow-brewed black tea infused with cracked green cardamom and condensed sweet milk.',
      channels: [
        { channelId: 'H09', intensity: 0.60, reason: 'Steamed spiced black tea' },
        { channelId: 'H29', intensity: 0.25, reason: 'Green cardamom pod' },
        { channelId: 'H16', intensity: 0.15, reason: 'Sweet condensed milk' }
      ],
      light: { r: 210, g: 140, b: 65 },
      durationSeconds: 150,
      batchId: 'CH-4011',
      formulaCode: '#09-T'
    };
  }

  // Default balanced nature archetype
  return {
    title: 'Forest Twilight & Petrichor',
    description: 'An atmospheric blend of damp earth, aged sandalwood, and crisp evening air.',
    channels: [
      { channelId: 'H19', intensity: 0.60, reason: 'Loam and rain petrichor' },
      { channelId: 'H18', intensity: 0.30, reason: 'Aged sandalwood heartwood' },
      { channelId: 'H25', intensity: 0.10, reason: 'Crisp mountain breeze' }
    ],
    light: { r: 46, g: 185, b: 96 },
    durationSeconds: 180,
    batchId: 'FR-3302',
    formulaCode: '#12-F'
  };
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

/**
 * AI Aroma Generation Endpoint
 */
app.post('/api/ai/generate-aroma', async (req: Request, res: Response) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt is required.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // Graceful semantic synthesis fallback when API key is not yet populated
    const fallback = fallbackSemanticSynthesis(prompt);
    res.json(fallback);
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemInstruction = `You are AROMAXAI, the master olfactory synthesis AI.
Your role is to translate natural language descriptions of moments, memories, feelings, and environments into precise physical aroma recipes for the 34-channel physical AromaxAI hardware device.

${WORKING_CHANNELS_PROMPT}

Format your output STRICTLY as JSON with no markdown wrapping.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Synthesize a realistic aroma experience for the following prompt: "${prompt}"`,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            channels: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  channelId: { type: Type.STRING },
                  intensity: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                },
                required: ['channelId', 'intensity']
              }
            },
            light: {
              type: Type.OBJECT,
              properties: {
                r: { type: Type.INTEGER },
                g: { type: Type.INTEGER },
                b: { type: Type.INTEGER }
              },
              required: ['r', 'g', 'b']
            },
            durationSeconds: { type: Type.INTEGER },
            batchId: { type: Type.STRING },
            formulaCode: { type: Type.STRING }
          },
          required: ['title', 'description', 'channels', 'light', 'durationSeconds']
        }
      }
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    // Strict post-processing: enforce at most 3 working channels
    let sanitizedChannels = Array.isArray(parsed.channels)
      ? parsed.channels
          .filter((c: any) => c && c.channelId && WORKING_CHANNELS_SET.has(String(c.channelId).toUpperCase()))
          .map((c: any) => ({
            channelId: String(c.channelId).toUpperCase(),
            intensity: Math.max(0.05, Math.min(1.0, typeof c.intensity === 'number' ? c.intensity : 0.5)),
            reason: c.reason || 'Harmonious note matching user intent'
          }))
          .slice(0, 3)
      : [];

    if (sanitizedChannels.length === 0) {
      const fallback = fallbackSemanticSynthesis(prompt);
      sanitizedChannels = fallback.channels;
    }

    // Normalize intensities so they sum to 1.0
    const sumInt = sanitizedChannels.reduce((acc: number, c: any) => acc + c.intensity, 0);
    if (sumInt > 0) {
      sanitizedChannels = sanitizedChannels.map((c: any) => ({
        ...c,
        intensity: Math.round((c.intensity / sumInt) * 100) / 100
      }));
    }
    parsed.channels = sanitizedChannels;

    // Validate light RGB
    if (
      !parsed.light ||
      typeof parsed.light.r !== 'number' ||
      typeof parsed.light.g !== 'number' ||
      typeof parsed.light.b !== 'number'
    ) {
      // Derive dominant light from selected channels
      let totalR = 0, totalG = 0, totalB = 0, totalW = 0;
      for (const ch of sanitizedChannels) {
        const col = CHANNEL_LIGHT_MAP[ch.channelId] || { r: 52, g: 199, b: 89 };
        totalR += col.r * ch.intensity;
        totalG += col.g * ch.intensity;
        totalB += col.b * ch.intensity;
        totalW += ch.intensity;
      }
      parsed.light = {
        r: Math.round(totalR / (totalW || 1)),
        g: Math.round(totalG / (totalW || 1)),
        b: Math.round(totalB / (totalW || 1))
      };
    } else {
      parsed.light = {
        r: Math.max(0, Math.min(255, Math.round(parsed.light.r))),
        g: Math.max(0, Math.min(255, Math.round(parsed.light.g))),
        b: Math.max(0, Math.min(255, Math.round(parsed.light.b)))
      };
    }

    // Attach batch ID if not provided
    if (!parsed.batchId) {
      parsed.batchId = `#AR-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    if (!parsed.formulaCode) {
      parsed.formulaCode = `#${Math.floor(10 + Math.random() * 89)}-X`;
    }

    res.json(parsed);
  } catch (err: unknown) {
    console.error('Gemini API Error:', err);
    // Fallback to high quality semantic engine rather than failing completely
    const fallback = fallbackSemanticSynthesis(prompt);
    res.json(fallback);
  }
});

/**
 * AI Free Quota & Token Info Endpoint
 */
app.get('/api/ai/quota-info', (_req: Request, res: Response) => {
  res.json({
    provider: 'Google AI Studio',
    model: 'gemini-3.8-flash',
    freeTier: {
      requestsPerMinute: 15,
      requestsPerDay: 1500,
      tokensPerMinute: 1000000,
      inputContextTokens: 1000000,
      cost: '$0.00 (100% Free)',
      summary: 'You can generate up to 1,500 custom scent formulas per day (15 requests/minute) at zero cost on the Google AI Studio free tier.'
    },
    synthesisCostEstimate: {
      tokensPerFormula: '~350 - 500 tokens',
      dailyLimitExplanation: '1,500 messages/day is the daily request ceiling. You will not be charged.'
    }
  });
});

/**
 * Local Device Proxy / Bridge Endpoint
 * Resolves HTTPS mixed-content and CORS restrictions when connecting to local ESP32
 */
app.all('/api/device/proxy', async (req: Request, res: Response) => {
  const targetHost = (req.query.target as string) || 'http://192.168.6.155';
  const endpoint = (req.query.endpoint as string) || '/status';

  const cleanHost = targetHost.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetUrl = `${cleanHost}${cleanEndpoint}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const forwardHeaders: Record<string, string> = {
      'User-Agent': 'AromaxAI-Bridge/1.0'
    };
    if (req.headers['content-type']) {
      forwardHeaders['Content-Type'] = req.headers['content-type'];
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: forwardHeaders,
      signal: controller.signal
    };

    if (req.method === 'POST' && req.body && Object.keys(req.body).length > 0) {
      forwardHeaders['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    clearTimeout(timer);

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).send(text);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).json({
      error: 'Device bridge unreachable',
      target: targetUrl,
      details: msg
    });
  }
});

/**
 * Health check
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'AROMAXAI',
    timestamp: new Date().toISOString()
  });
});

/**
 * Custom video upload endpoint
 * Saves uploaded video files (e.g. IMG_9031.MP4) directly into public directory
 */
app.post(
  '/api/video/upload',
  express.raw({ type: ['video/*', 'application/octet-stream'], limit: '150mb' }),
  (req: Request, res: Response) => {
    try {
      const filename = (req.query.filename as string) || 'IMG_9031.MP4';
      const safeFilename = path.basename(filename);
      const publicDir = path.resolve(__dirname, 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      const dest = path.join(publicDir, safeFilename);
      fs.writeFileSync(dest, req.body);
      // Also update sensory-odyssey.mp4 if replacing default
      if (req.query.asDefault === 'true' || safeFilename.toUpperCase().includes('IMG_9031')) {
        try {
          fs.writeFileSync(path.join(publicDir, 'sensory-odyssey.mp4'), req.body);
        } catch {
          // ignore copy error
        }
      }
      res.json({
        success: true,
        filename: safeFilename,
        url: `/${safeFilename}`
      });
    } catch (err: unknown) {
      console.error('Video upload error:', err);
      res.status(500).json({ error: String(err) });
    }
  }
);

// ----------------------------------------------------
// STATIC / VITE MIDDLEWARE
// ----------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AROMAXAI Server] Listening on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[AROMAXAI Server] Startup failed:', err);
  process.exit(1);
});
