import React, { useState } from 'react';
import { generateAromaExperience } from '../../services/ai/aiService';
import { useActiveSession } from '../../hooks/useActiveSession';
import { ValidatedAiExperience } from '../../services/ai/aiSchema';
import { CHANNEL_MAP } from '../../data/aromas';

interface CreateScreenProps {
  onOpenBlends: () => void;
  onOpenLiveSession: () => void;
}

export const CreateScreen: React.FC<CreateScreenProps> = ({
  onOpenBlends,
  onOpenLiveSession
}) => {
  const { startSession, active: isSessionActive } = useActiveSession();

  const [prompt, setPrompt] = useState(
    'A rainy evening in an old forest after twilight with petrichor, damp clay loam, and cool breeze...'
  );
  const [synthesizing, setSynthesizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  // Current active formula node (default initialized to at most 3 working channels)
  const [currentFormula, setCurrentFormula] = useState<ValidatedAiExperience>({
    title: 'Rainy Forest & Petrichor',
    description: 'First rain falling on summer-baked soil and damp redwood understory with crisp mountain air.',
    batchId: '#48-A',
    formulaCode: '#RF-9042',
    durationSeconds: 180,
    channels: [
      { channelId: 'H19', intensity: 0.60, reason: 'First rain striking baked clay loam' },
      { channelId: 'H18', intensity: 0.30, reason: 'Aged Mysore sandalwood heartwood depth' },
      { channelId: 'H25', intensity: 0.10, reason: 'Crisp moist mountain breeze' }
    ],
    light: { r: 46, g: 185, b: 96 }
  });

  const archetypes = [
    {
      label: 'Monsoon Rain & Mitti',
      color: 'bg-[#0284C7]',
      text: 'First monsoon rain falling on dry summer earth with damp petrichor clay, sandalwood, and fresh breeze'
    },
    {
      label: 'Artisan Espresso',
      color: 'bg-[#92400E]',
      text: 'Rich freshly pulled dark roast espresso crema with sweet bourbon vanilla bean and creamy warm milk'
    },
    {
      label: 'Sacred Temple',
      color: 'bg-[#F59E0B]',
      text: 'Sacred temple sanctum with brass lamps, holy sambrani dhoop smoke, sandalwood, and Kashmiri saffron'
    },
    {
      label: 'Alpine Fireside',
      color: 'bg-[#D97706]',
      text: 'Dry birch logs crackling in an autumn hearth with warm sandalwood and glowing embers'
    },
    {
      label: 'Tranquil Lavender',
      color: 'bg-[#8B5CF6]',
      text: 'Serene French lavender and water lotus blossom with soothing vanilla for peaceful evening relaxation'
    }
  ];

  const handleSynthesize = async () => {
    if (!prompt.trim()) return;
    setSynthesizing(true);
    setErrorMessage(null);

    const result = await generateAromaExperience(prompt);
    setSynthesizing(false);

    if (result.success && result.blend) {
      setCurrentFormula(result.blend);
    } else {
      setErrorMessage(result.error || 'Failed to synthesize aroma.');
    }
  };

  const handleExperienceNow = async () => {
    await startSession({
      title: currentFormula.title,
      type: 'text',
      channels: currentFormula.channels,
      durationSeconds: currentFormula.durationSeconds || 180,
      light: currentFormula.light,
      batchId: currentFormula.batchId || '#48-A',
      profileName: currentFormula.description
    });
    onOpenLiveSession();
  };

  // Live light color strings
  const currentRgbString = `rgb(${currentFormula.light.r}, ${currentFormula.light.g}, ${currentFormula.light.b})`;
  const currentRgbAlpha = (alpha: number) =>
    `rgba(${currentFormula.light.r}, ${currentFormula.light.g}, ${currentFormula.light.b}, ${alpha})`;

  return (
    <div className="flex flex-col gap-6 py-2 max-w-lg mx-auto w-full">
      {/* Hardware Status Pill & Free AI Token Badge */}
      <div className="flex items-center justify-between px-4 py-2.5 ios-glass-pill rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-black/[0.02] dark:ring-white/10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34C759] opacity-40"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34C759]"></span>
          </span>
          <span className="text-[12px] font-medium text-[#1D1D1F] dark:text-[#F4F4F5]">
            34-Channel Olfactory Chamber
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowQuotaModal(!showQuotaModal)}
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/15 active:scale-95 transition-all text-[11px] font-medium text-[#1D1D1F] dark:text-white cursor-pointer"
          title="Click to view Gemini Free Tier Token Limits & Daily Messages"
        >
          <span className="material-symbols-outlined text-[13px] text-[#0071E3] dark:text-sky-400">info</span>
          <span>1,500 msgs/day Free</span>
        </button>
      </div>

      {/* Expandable Free Tokens & Messages Quota Card */}
      {showQuotaModal && (
        <div className="ios-glass-card rounded-[28px] p-5 ring-1 ring-[#0071E3]/20 dark:ring-sky-500/30 bg-gradient-to-br from-white/95 to-[#F0F7FF]/90 dark:from-zinc-900/95 dark:to-zinc-950/95 shadow-lg flex flex-col gap-3 transition-all animate-in fade-in text-[#1D1D1F] dark:text-[#F4F4F5]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#0071E3] dark:text-sky-400">auto_awesome</span>
              <h3 className="text-[15px] font-semibold text-[#1D1D1F] dark:text-[#F4F4F5]">
                Google AI Studio Free Tier Quota
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowQuotaModal(false)}
              className="text-[#86868B] dark:text-[#A1A1AA] hover:text-[#1D1D1F] dark:hover:text-white text-[18px] w-6 h-6 flex items-center justify-center rounded-full cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="text-[13px] text-[#515154] dark:text-[#A1A1AA] leading-relaxed">
            Gemini provides a generous free tier for text-to-smell formula generation:
          </p>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="bg-white/80 dark:bg-zinc-800/80 p-2.5 rounded-xl border border-blue-100 dark:border-white/10 flex flex-col">
              <span className="text-[#86868B] dark:text-[#A1A1AA] font-medium uppercase text-[10px]">Daily Messages</span>
              <span className="text-[16px] font-bold text-[#0071E3] dark:text-sky-400">1,500 requests/day</span>
              <span className="text-[11px] text-[#86868B] dark:text-[#A1A1AA]">100% Free of charge ($0.00)</span>
            </div>
            <div className="bg-white/80 dark:bg-zinc-800/80 p-2.5 rounded-xl border border-blue-100 dark:border-white/10 flex flex-col">
              <span className="text-[#86868B] dark:text-[#A1A1AA] font-medium uppercase text-[10px]">Rate Limit</span>
              <span className="text-[16px] font-bold text-[#1D1D1F] dark:text-[#F4F4F5]">15 requests/min</span>
              <span className="text-[11px] text-[#86868B] dark:text-[#A1A1AA]">Fast parallel generation</span>
            </div>
            <div className="bg-white/80 dark:bg-zinc-800/80 p-2.5 rounded-xl border border-blue-100 dark:border-white/10 flex flex-col">
              <span className="text-[#86868B] dark:text-[#A1A1AA] font-medium uppercase text-[10px]">Token Throughput</span>
              <span className="text-[16px] font-bold text-[#1D1D1F] dark:text-[#F4F4F5]">1,000,000 TPM</span>
              <span className="text-[11px] text-[#86868B] dark:text-[#A1A1AA]">1 Million tokens per minute</span>
            </div>
            <div className="bg-white/80 dark:bg-zinc-800/80 p-2.5 rounded-xl border border-blue-100 dark:border-white/10 flex flex-col">
              <span className="text-[#86868B] dark:text-[#A1A1AA] font-medium uppercase text-[10px]">Per Formula Cost</span>
              <span className="text-[16px] font-bold text-[#34C759] dark:text-emerald-400">~400 tokens</span>
              <span className="text-[11px] text-[#86868B] dark:text-[#A1A1AA]">Up to 3 working scents</span>
            </div>
          </div>
          <div className="text-[11px] text-[#86868B] dark:text-sky-300 bg-blue-50/50 dark:bg-sky-950/40 border border-transparent dark:border-sky-800/30 p-2 rounded-lg">
            ✓ You can synthesize 1,500 custom aromas every single day without incurring any billing or charges.
          </div>
        </div>
      )}

      {/* Pure Minimalist Hero Title */}
      <div className="flex flex-col gap-1.5 px-1 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-[#86868B] dark:text-[#A1A1AA] uppercase tracking-wider">
            Olfactory Synthesis Engine
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-[#1D1D1F] dark:text-[#F4F4F5]">
            Max 3 Smells • Synesthesia Light
          </span>
        </div>
        <h1 className="text-[34px] font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F4F4F5] leading-[1.12]">
          Give AI a sense of smell.
        </h1>
        <p className="text-[15px] text-[#86868B] dark:text-[#A1A1AA] leading-relaxed pt-1 font-normal">
          Describe any moment, memory, or place. Gemini analyzes your intent to craft a harmonious blend of at most 3 working aromas, complete with matched atmospheric lighting.
        </p>
      </div>

      {/* Scent Creation Input Card */}
      <div className="ios-glass-card rounded-[34px] p-6 ring-1 ring-black/[0.03] flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#1D1D1F]">psychology</span>
            <h2 className="text-[17px] font-semibold text-[#1D1D1F] tracking-tight">
              What would you like to smell?
            </h2>
          </div>
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full ios-glass-pill text-[#86868B] tracking-wide uppercase">
            Input Lab
          </span>
        </div>

        {/* Textfield */}
        <div className="relative w-full">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full bg-white/50 dark:bg-zinc-900/80 backdrop-blur-xl hover:bg-white/70 dark:hover:bg-zinc-900 focus:bg-white/95 dark:focus:bg-zinc-900 text-[#1D1D1F] dark:text-[#F4F4F5] placeholder:text-[#86868B] dark:placeholder:text-zinc-500 p-4 rounded-2xl text-[15px] font-normal leading-relaxed border border-white/60 dark:border-white/10 focus:border-black/[0.12] dark:focus:border-white/20 focus:ring-4 focus:ring-black/[0.03] dark:focus:ring-white/[0.03] focus:outline-none transition-all resize-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)]"
            placeholder="A rainy evening in an old forest after twilight with petrichor and pine..."
          />
          <div className="flex justify-between items-center mt-1.5 px-1">
            <span className="text-[11px] font-medium text-[#86868B] dark:text-[#A1A1AA]">
              Gemini understands intent & prevents random combinations
            </span>
            <span className="text-[11px] font-medium text-[#86868B] dark:text-[#A1A1AA] tracking-tight">
              At most 3 scents
            </span>
          </div>
        </div>

        {/* Sensory Archetypes Pills */}
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-medium text-[#86868B] dark:text-[#A1A1AA]">Harmonious Presets</span>
          <div className="flex flex-wrap gap-1.5">
            {archetypes.map((arch) => (
              <button
                key={arch.label}
                type="button"
                onClick={() => setPrompt(arch.text)}
                className="ios-glass-pill hover:bg-white/85 dark:hover:bg-zinc-800 active:scale-[0.98] text-[#1D1D1F] dark:text-[#F4F4F5] px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer border border-transparent dark:border-white/10"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${arch.color}`}></span>
                {arch.label}
              </button>
            ))}
          </div>
        </div>

        {errorMessage && (
          <p className="text-[12px] text-[#FF3B30] dark:text-red-400 bg-[#FFF5F5]/80 dark:bg-red-950/40 backdrop-blur-md p-3 rounded-2xl border border-red-200 dark:border-red-900/40">
            {errorMessage}
          </p>
        )}

        {/* Action CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleSynthesize}
            disabled={synthesizing}
            className="flex-1 ios-liquid-btn-emerald active:scale-[0.97] text-white font-medium text-[15px] h-12 rounded-full flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(16,185,129,0.35)] ring-1 ring-white/20 transition-all cursor-pointer"
          >
            <span
              className={`material-symbols-outlined text-[19px] relative z-10 ${
                synthesizing ? 'animate-spin' : ''
              }`}
            >
              {synthesizing ? 'rotate_right' : 'auto_awesome'}
            </span>
            <span className="relative z-10">{synthesizing ? 'Synthesizing Formula...' : 'Create Blend'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenBlends}
            className="ios-glass ios-liquid-btn hover:bg-white/90 dark:hover:bg-zinc-800 active:scale-[0.97] text-[#1D1D1F] dark:text-white font-medium text-[14px] px-5 h-12 rounded-full flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer border border-white/80 dark:border-white/10"
          >
            <span className="material-symbols-outlined text-[18px] relative z-10">science</span>
            <span className="relative z-10">Explore Blends</span>
          </button>
        </div>
      </div>

      {/* Formulation Telemetry & Dispersion Card */}
      <div className="ios-glass-card rounded-[34px] p-6 ring-1 ring-black/[0.03] flex flex-col gap-5">
        {/* Header Node */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentRgbString }}></span>
              <span className="text-[11px] font-semibold text-[#1D1D1F] uppercase tracking-wider">
                Active Blend Node ({currentFormula.channels.length}/3 Smells)
              </span>
            </div>
            <h3 className="text-[18px] font-semibold text-[#1D1D1F] tracking-tight mt-0.5">
              {currentFormula.title}
            </h3>
            <p className="text-[13px] text-[#86868B] mt-1 leading-snug">
              {currentFormula.description}
            </p>
          </div>
          <span className="ios-glass-pill text-[#1D1D1F] text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-2xs shrink-0 ml-2">
            {currentFormula.batchId || '#48-A'}
          </span>
        </div>

        {/* Minimalist Ceramic Vapor Chamber Graphic with Dynamic Atmospheric Glow */}
        <div
          className="relative w-full h-40 rounded-2xl overflow-hidden flex items-center justify-center border border-white/80 dark:border-white/10 shadow-inner transition-colors duration-700"
          style={{
            backgroundColor: currentRgbAlpha(0.08),
            boxShadow: `inset 0 0 40px ${currentRgbAlpha(0.15)}`
          }}
        >
          {/* Top specular reflection rim */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent pointer-events-none z-20" />

          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-700"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${currentRgbAlpha(0.25)}, transparent 70%)`
            }}
          />
          <div className="relative z-10 flex flex-col items-center">
            <div
              className="w-14 h-14 rounded-full ios-glass flex items-center justify-center border border-white/90 dark:border-white/15 transition-all duration-700 shadow-md"
              style={{
                boxShadow: `0 4px 20px ${currentRgbAlpha(0.4)}`
              }}
            >
              <span
                className="material-symbols-outlined text-[24px] transition-colors duration-500"
                style={{ color: currentRgbString }}
              >
                air
              </span>
            </div>
            <span className="mt-2.5 text-[12px] font-medium text-[#1D1D1F] dark:text-[#F4F4F5] tracking-tight">
              Ultrasonic Vaporizer Chamber
            </span>
            <span className="text-[11px] text-[#86868B] dark:text-[#A1A1AA]">114 kHz Clean Micro-Droplet Dispersion</span>
          </div>

          <div
            className="absolute top-3 left-3 ios-glass-pill px-2.5 py-1 rounded-full shadow-xs text-[11px] font-medium text-[#1D1D1F] dark:text-[#F4F4F5] border border-white/80 dark:border-white/10 flex items-center gap-1.5 z-20"
          >
            <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: currentRgbString, color: currentRgbString }} />
            <span>RGB ({currentFormula.light.r}, {currentFormula.light.g}, {currentFormula.light.b})</span>
          </div>
          <div className="absolute bottom-3 right-3 ios-glass-pill px-2.5 py-1 rounded-full shadow-xs text-[11px] font-medium text-[#1D1D1F] dark:text-[#F4F4F5] border border-white/80 dark:border-white/10 z-20">
            {currentFormula.channels.length} {currentFormula.channels.length === 1 ? 'Scent Note' : 'Scent Chord'}
          </div>
        </div>

        {/* Pure Molecular Ratio Allocation Bar for at most 3 smells */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[12px] font-medium">
            <span className="text-[#86868B] dark:text-[#A1A1AA]">Active Scent Chord (At most 3)</span>
            <span className="text-[#1D1D1F] dark:text-[#F4F4F5] font-semibold">100% Vol</span>
          </div>

          {/* Segmented bar */}
          <div className="w-full h-3 rounded-full bg-neutral-200/80 dark:bg-white/10 overflow-hidden flex gap-[2px] p-0.5">
            {currentFormula.channels.map((ch, idx) => {
              const pct = Math.max(5, Math.round((ch.intensity || 0.33) * 100));
              const palette = [
                currentRgbString,
                '#D97706',
                '#0284C7'
              ];
              const color = palette[idx % palette.length];
              return (
                <div
                  key={ch.channelId}
                  style={{ width: `${pct}%`, backgroundColor: color }}
                  className={`h-full transition-all duration-500 ${idx === 0 ? 'rounded-l-full' : ''} ${
                    idx === currentFormula.channels.length - 1 ? 'rounded-r-full' : ''
                  }`}
                  title={`${ch.channelId}: ${pct}%`}
                />
              );
            })}
          </div>

          {/* Detailed Cards for each chosen smell note with user intent explanation */}
          <div className="flex flex-col gap-2 pt-1">
            {currentFormula.channels.map((ch, idx) => {
              const def = CHANNEL_MAP[ch.channelId];
              const pct = Math.round((ch.intensity || 0.33) * 100);
              const palette = [currentRgbString, '#D97706', '#0284C7'];
              const dotColor = palette[idx % palette.length];
              return (
                <div
                  key={ch.channelId}
                  className="flex items-start justify-between p-3 rounded-2xl bg-white/60 dark:bg-zinc-800/80 border border-white/80 dark:border-white/10 backdrop-blur-md"
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 mt-1 shadow-xs"
                      style={{ backgroundColor: dotColor }}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-[#1D1D1F] dark:text-[#F4F4F5]">
                          {def?.name || ch.channelId}
                        </span>
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/10 text-[#86868B] dark:text-[#A1A1AA]">
                          {ch.channelId}
                        </span>
                      </div>
                      {ch.reason && (
                        <span className="text-[12px] text-[#515154] dark:text-[#A1A1AA] mt-0.5 font-normal">
                          {ch.reason}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[13px] font-bold text-[#1D1D1F] dark:text-[#F4F4F5] shrink-0 ml-3">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Ambient Luminescence Sync Module */}
        <div className="flex flex-col gap-2.5 bg-white/60 dark:bg-zinc-800/80 backdrop-blur-md p-4 rounded-2xl border border-white/80 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full border border-black/10 shadow-sm transition-colors duration-500"
                style={{ backgroundColor: currentRgbString }}
              />
              <span className="text-[13px] font-medium text-[#1D1D1F]">
                Atmospheric Light Synchronizer
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#86868B]">
              RGB ({currentFormula.light.r}, {currentFormula.light.g}, {currentFormula.light.b})
            </span>
          </div>

          {/* Glowing dynamic light swatch */}
          <div
            className="w-full h-4 rounded-full transition-all duration-500"
            style={{
              background: `linear-gradient(90deg, ${currentRgbAlpha(0.6)} 0%, ${currentRgbString} 50%, ${currentRgbAlpha(0.85)} 100%)`,
              boxShadow: `0 2px 14px ${currentRgbAlpha(0.5)}`
            }}
          />

          <div className="flex items-center justify-between text-[11px] text-[#86868B]">
            <span>Mood: Matched to sensory fragrance intent</span>
            <span className="text-[#34C759] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
              Synced to LEDs
            </span>
          </div>
        </div>

        {/* Experience Now Action Button */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]"></span>
              <span className="text-[12px] font-medium text-[#86868B]">
                Hardware Synchronized (Light & Diffuser)
              </span>
            </div>
            <span className="text-[11px] font-medium text-[#34C759]">Ready</span>
          </div>
          <button
            type="button"
            onClick={handleExperienceNow}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium text-[16px] h-13 py-3.5 rounded-full flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(16,185,129,0.3)] ring-1 ring-white/10 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">air</span>
            <span>{isSessionActive ? 'Update Active Session' : 'Experience Now'}</span>
          </button>
        </div>
      </div>

      {/* Sensory Memory Archive Feature Card */}
      <div
        onClick={onOpenBlends}
        className="ios-glass-card rounded-[34px] p-5 ring-1 ring-black/[0.03] dark:ring-white/10 flex items-center justify-between cursor-pointer hover:bg-white/85 dark:hover:bg-zinc-800/80 transition-all"
      >
        <div className="glass-reflection-rim inset-x-5" />
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/80 dark:bg-zinc-800/90 backdrop-blur-md border border-white/80 dark:border-white/10 shadow-xs flex items-center justify-center text-[#1D1D1F] dark:text-[#F4F4F5]">
            <span className="material-symbols-outlined text-[20px]">neurology</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold text-[#1D1D1F] dark:text-[#F4F4F5] tracking-tight">
              Sensory Memory Archive
            </span>
            <span className="text-[13px] text-[#86868B] dark:text-[#A1A1AA]">Explore verified formulas & accords</span>
          </div>
        </div>
        <span className="material-symbols-outlined text-[#86868B] dark:text-[#A1A1AA] text-[20px]">chevron_right</span>
      </div>
    </div>
  );
};
