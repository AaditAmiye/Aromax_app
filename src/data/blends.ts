import { Blend } from '../types/aroma';

export const PREDEFINED_BLENDS: Blend[] = [
  {
    id: 'blend-rainy-forest',
    name: 'Rainy Forest',
    category: 'Atmospheric Petrichor',
    description: 'Wild Olympic understory profile. Rich humus, damp cedar, ozone, and mountain spring vapors.',
    batchId: 'RF-9042',
    formulaCode: '#48-A',
    profileName: 'Wild Olympic Understory Profile',
    durationSeconds: 180,
    channels: [
      { channelId: 'H19', intensity: 0.45, reason: 'Deep geosmin & petrichor loamy soil' },
      { channelId: 'H18', intensity: 0.25, reason: 'Aged sandalwood understory wood' },
      { channelId: 'H31', intensity: 0.15, reason: 'Pure water micro-humidity carrier' },
      { channelId: 'H25', intensity: 0.10, reason: 'Crisp mountain breeze mint' },
      { channelId: 'H07', intensity: 0.05, reason: 'Faint wild woodland floral note' }
    ],
    light: { r: 52, g: 199, b: 89 } // Forest Mist Amber-Green
  },
  {
    id: 'blend-monsoon',
    name: 'Monsoon Petrichor',
    category: 'Earth & Atmosphere',
    description: 'The intense, nostalgic fragrance of parched summer earth receiving the very first thunderous drops.',
    batchId: 'MN-1011',
    formulaCode: '#01-M',
    profileName: 'Western Ghats Petrichor',
    durationSeconds: 120,
    channels: [
      { channelId: 'H19', intensity: 0.85, reason: 'Concentrated geosmin baked loamy soil' },
      { channelId: 'H31', intensity: 0.15, reason: 'Rainwater vapor mist carrier' }
    ],
    light: { r: 180, g: 83, b: 9 }
  },
  {
    id: 'blend-forest',
    name: 'Old Growth Forest',
    category: 'Woodland Canopy',
    description: 'Ancient sandalwood groves layered with damp forest floor and towering evergreens.',
    batchId: 'FR-3302',
    formulaCode: '#12-F',
    profileName: 'Pacific Temperate Canopy',
    durationSeconds: 180,
    channels: [
      { channelId: 'H19', intensity: 0.55, reason: 'Deep forest floor soil and fern' },
      { channelId: 'H18', intensity: 0.45, reason: 'Heartwood sandalwood depth' }
    ],
    light: { r: 60, g: 130, b: 50 }
  },
  {
    id: 'blend-cafe',
    name: 'Artisan Café',
    category: 'Roasted Comfort',
    description: 'Freshly pulled double-shot espresso with rich roasted crema sweetened with Madagascar bourbon vanilla.',
    batchId: 'CF-4491',
    formulaCode: '#09-C',
    profileName: 'Milanese Coffee Roastery',
    durationSeconds: 120,
    channels: [
      { channelId: 'H24', intensity: 0.70, reason: 'Dark roast espresso extraction' },
      { channelId: 'H08', intensity: 0.30, reason: 'Bourbon warm vanilla bean' }
    ],
    light: { r: 180, g: 110, b: 40 }
  },
  {
    id: 'blend-temple',
    name: 'Sacred Sanctum',
    category: 'Spiritual / Resinous',
    description: 'Brass lamps flickering at dusk, fragrant sambrani incense, Mysore sandalwood paste, and royal saffron.',
    batchId: 'TP-8820',
    formulaCode: '#33-T',
    profileName: 'Varanasi Sanctum Devotion',
    durationSeconds: 240,
    channels: [
      { channelId: 'H33', intensity: 0.50, reason: 'Dhoop and sambrani holy resin' },
      { channelId: 'H18', intensity: 0.30, reason: 'Carved sandalwood altar' },
      { channelId: 'H34', intensity: 0.20, reason: 'Kashmiri kesar offering' }
    ],
    light: { r: 245, g: 158, b: 11 }
  },
  {
    id: 'blend-dessert',
    name: 'Royal Pâtisserie',
    category: 'Gourmand Sweet',
    description: 'Artisanal dark chocolate, velvety reduced milk confection, and pure aromatic vanilla pods.',
    batchId: 'DS-2098',
    formulaCode: '#16-D',
    profileName: 'Viennese Grand Salon',
    durationSeconds: 120,
    channels: [
      { channelId: 'H05', intensity: 0.45, reason: 'Dark cocoa butter notes' },
      { channelId: 'H16', intensity: 0.35, reason: 'Slow-simmered condensed sweet milk' },
      { channelId: 'H08', intensity: 0.20, reason: 'Golden vanilla glaze' }
    ],
    light: { r: 210, g: 140, b: 65 }
  },
  {
    id: 'blend-indian-kitchen',
    name: 'Royal Feast (Tadka)',
    category: 'Savory Culinary',
    description: 'Hot sizzling mustard oil infused with fresh crushed garlic and aromatic basmati biryani spices.',
    batchId: 'IK-5510',
    formulaCode: '#10-K',
    profileName: 'Awadhi Nizami Kitchen',
    durationSeconds: 90,
    channels: [
      { channelId: 'H10', intensity: 0.60, reason: 'Dum biryani spiced rice steam' },
      { channelId: 'H21', intensity: 0.40, reason: 'Tempered garlic and mustard oil' }
    ],
    light: { r: 235, g: 110, b: 20 }
  },
  {
    id: 'blend-fresh',
    name: 'Glacial Crisp',
    category: 'Invigorating Fresh',
    description: 'Ice-cold menthol frost paired with invigorating bitter citrus peel for maximum alertness.',
    batchId: 'FR-9912',
    formulaCode: '#25-M',
    profileName: 'Nordic Glacial Air',
    durationSeconds: 90,
    channels: [
      { channelId: 'H25', intensity: 0.65, reason: 'Pure crystalline menthol' },
      { channelId: 'H15', intensity: 0.35, reason: 'Bitter zest citrus spark' }
    ],
    light: { r: 0, g: 199, b: 190 }
  },
  {
    id: 'blend-luxury',
    name: 'Imperial Suite',
    category: 'Haute Parfumerie',
    description: 'Aristocratic ambergris and royal perfume harmonized over warm golden sandalwood.',
    batchId: 'LX-7701',
    formulaCode: '#06-R',
    profileName: 'Mayfair Grand Residence',
    durationSeconds: 180,
    channels: [
      { channelId: 'H06', intensity: 0.60, reason: 'Prestige royal perfume blend' },
      { channelId: 'H18', intensity: 0.40, reason: 'Polished sandalwood boiserie' }
    ],
    light: { r: 218, g: 165, b: 32 }
  },
  {
    id: 'blend-fireplace',
    name: 'Hearth & Embers',
    category: 'Smoky Fire',
    description: 'Charred birch and pine embers glowing gently on a snowy alpine evening.',
    batchId: 'FP-1205',
    formulaCode: '#28-W',
    profileName: 'Alpine Chalet Hearth',
    durationSeconds: 120,
    channels: [
      { channelId: 'H28', intensity: 1.0, reason: 'Crackling dry birch wood smoke' }
    ],
    light: { r: 255, g: 107, b: 0 }
  }
];

export const BLEND_MAP: Record<string, Blend> = PREDEFINED_BLENDS.reduce(
  (acc, b) => {
    acc[b.id] = b;
    return acc;
  },
  {} as Record<string, Blend>
);
