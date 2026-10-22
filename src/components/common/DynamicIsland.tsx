import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useActiveSession } from '../../hooks/useActiveSession';
import { AromaxLogo } from './AromaxLogo';

interface DynamicIslandProps {
  onOpenLiveSession: () => void;
  isOverlayOpen: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  onOpenLiveSession,
  isOverlayOpen,
  onExpandedChange
}) => {
  const {
    active: isSessionActive,
    paused,
    isPurging,
    purgeRemainingSeconds,
    experienceTitle,
    batchId,
    channels,
    light,
    formattedRemaining,
    progressPercent,
    diffusionOutputPercent,
    pauseSession,
    resumeSession,
    stopSession,
    startPurge,
    startSession
  } = useActiveSession();

  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Notify parent of expansion state
  useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  // When fullscreen overlay opens, collapse island immediately
  useEffect(() => {
    if (isOverlayOpen) {
      setIsExpanded(false);
    }
  }, [isOverlayOpen]);

  // Robust, non-glitchy click-away handler for iOS Dynamic Island
  // When expanded, tapping anywhere outside the island collapses it instantly with zero glitch
  useEffect(() => {
    if (!isExpanded) return;

    const handlePointerDownOutside = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDownOutside, { capture: true });
    return () => {
      window.removeEventListener('pointerdown', handlePointerDownOutside, { capture: true });
    };
  }, [isExpanded]);

  // Dynamic Island is shown ONLY when emitting (active session or chamber purge)
  const isEmitting = isSessionActive || isPurging;
  const isIslandVisible = !isOverlayOpen && isEmitting;

  // Scent color theme
  const scentColor = isPurging
    ? '#22D3EE'
    : light
    ? `rgb(${light.r}, ${light.g}, ${light.b})`
    : '#34C759';

  const activePortsCount = channels.length || 5;

  const handleIslandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded) {
      // First click: snappily expand island widget with fast spring physics
      setIsExpanded(true);
    } else {
      // If already expanded and user clicks anywhere on the card (outside buttons): maximize to fullscreen!
      onOpenLiveSession();
    }
  };

  const handleQuickStartDemo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSessionActive) {
      await startSession({
        title: 'Atmospheric Petrichor',
        type: 'text',
        channels: [
          { channelId: 'H19', intensity: 0.45, reason: 'Geosmin' },
          { channelId: 'H18', intensity: 0.25, reason: 'Hinoki' },
          { channelId: 'H31', intensity: 0.15, reason: 'Water vapor' }
        ],
        durationSeconds: 180,
        light: { r: 52, g: 199, b: 89 },
        batchId: '#48-A',
        profileName: 'Olympic Rainforest Mist'
      });
    }
  };

  return (
    <>
      {/* 
        Completely transparent touch shield when expanded:
        No dark tint, NO background screen blur (as strictly requested:
        "dont make the screen blur when tap the island ones and it and it become big..dont blur the bg")
        This ensures clicks outside immediately close the island without flashing or layout glitches.
      */}
      {isIslandVisible && isExpanded && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(false);
          }}
          className="fixed inset-0 z-40 bg-transparent cursor-default pointer-events-auto"
          aria-hidden="true"
        />
      )}

      {/* Floating Dynamic Island Hardware Cutout */}
      <div
        ref={containerRef}
        className="fixed top-2 sm:top-2.5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto select-none"
      >
        <AnimatePresence>
          {isIslandVisible && (
            <motion.div
              key="dynamic-island-shell"
              initial={{
                scale: 0.5,
                opacity: 0,
                y: -14,
                filter: 'blur(8px)'
              }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                transition: {
                  type: 'spring',
                  stiffness: 650,
                  damping: 34,
                  mass: 0.4
                }
              }}
              exit={{
                scale: 0.4,
                opacity: 0,
                y: -16,
                filter: 'blur(10px)',
                transition: {
                  duration: 0.14
                }
              }}
              className="origin-top flex items-center justify-center"
            >
              {/* iPhone 16 Pro Style Morphing Deep Black OLED Capsule */}
              <motion.div
                onClick={handleIslandClick}
                whileTap={{ scale: isExpanded ? 0.99 : 0.94 }}
                animate={{
                  width: isExpanded ? 364 : 220,
                  height: isExpanded ? 190 : 37,
                  borderRadius: isExpanded ? 38 : 20,
                  // Snappy motion blur effect during expanding/minimizing transitions
                  filter: 'blur(0px)'
                }}
                transition={{
                  type: 'spring',
                  stiffness: 600,
                  damping: 35,
                  mass: 0.42
                }}
                className="bg-black text-white relative overflow-hidden ring-1 ring-white/15 shadow-[0_22px_60px_rgba(0,0,0,0.7),0_4px_16px_rgba(0,0,0,0.45)] cursor-pointer"
                style={{
                  willChange: 'width, height, border-radius',
                  maxWidth: 'calc(100vw - 20px)'
                }}
              >
                {/* Ultra-subtle specular light refraction on top glass rim of iPhone display cutout */}
                <div className="absolute top-0 inset-x-0 h-[1.2px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none z-30" />

                {/* Scent Ambience Glow Bleeding Behind Island when active */}
                {(isSessionActive || isPurging) && (
                  <div
                    className="absolute -top-10 -left-10 w-28 h-28 rounded-full blur-2xl opacity-25 pointer-events-none transition-colors duration-500"
                    style={{ backgroundColor: scentColor }}
                  />
                )}

                {/* ================= COMPACT ISLAND STATE (PILL) ================= */}
                {/* Fixed-dimension wrapper prevents any text reflow, stretching, or jittering during spring animations */}
                <motion.div
                  initial={false}
                  animate={{
                    opacity: !isExpanded ? 1 : 0,
                    scale: !isExpanded ? 1 : 0.88,
                    pointerEvents: !isExpanded ? 'auto' : 'none'
                  }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                  className="absolute inset-0 flex items-center justify-between px-2.5 z-20 h-[37px]"
                >
                  {/* Left: Olfactory Scent Vapor Plume Animation (Dedicated Smell Animation) */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isPurging ? (
                      <div className="flex items-center text-cyan-400 shrink-0">
                        <span
                          className="material-symbols-outlined text-[16px] animate-spin"
                          style={{ animationDuration: '0.6s' }}
                        >
                          mode_fan
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Glowing Fragrance Droplet / Emitter Node */}
                        <div className="relative flex items-center justify-center w-3 h-3">
                          <span
                            className="w-2 h-2 rounded-full transition-colors duration-300 shadow-[0_0_8px_currentColor]"
                            style={{ backgroundColor: scentColor, color: scentColor }}
                          />
                          <span
                            className="absolute w-3.5 h-3.5 rounded-full animate-ping opacity-40"
                            style={{ backgroundColor: scentColor }}
                          />
                        </div>

                        {/* Rising Aromatic Scent Mist Wisps (Curved SVG vapors, NOT music equalizer) */}
                        <div className="flex items-center gap-[2px]">
                          {[0, 1, 2].map((i) => (
                            <motion.svg
                              key={i}
                              className="w-1.5 h-3"
                              viewBox="0 0 6 12"
                              fill="none"
                              animate={
                                paused
                                  ? { opacity: 0.3 }
                                  : {
                                      y: [0, -1.8, 0],
                                      opacity: [0.35, 0.95, 0.35],
                                      transition: {
                                        duration: 1.3,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                        delay: i * 0.22
                                      }
                                    }
                              }
                            >
                              <path
                                d="M 3 11 C 1.5 8.5, 4.5 5.5, 3 3 C 2 1.5, 3 0, 3 0"
                                stroke={paused ? '#86868B' : scentColor}
                                strokeWidth="1.4"
                                strokeLinecap="round"
                              />
                            </motion.svg>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fragrance Name */}
                    <span className="text-[12px] font-medium tracking-tight text-white/95 truncate max-w-[105px]">
                      {isPurging
                        ? 'Chamber Flush'
                        : paused
                        ? 'Paused'
                        : experienceTitle || 'Petrichor Mist'}
                    </span>
                  </div>

                  {/* Right: Digital Countdown Timer */}
                  <div className="flex items-center gap-1 shrink-0 font-mono text-[11px] font-semibold text-white/90">
                    {isPurging ? (
                      <span className="text-cyan-400 font-bold px-1.5 py-0.5 bg-cyan-950/60 rounded-full border border-cyan-500/25 text-[10px]">
                        {purgeRemainingSeconds ?? 6}s
                      </span>
                    ) : (
                      <div className="bg-white/10 px-2 py-0.5 rounded-full border border-white/5">
                        <span>{formattedRemaining}</span>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* ================= EXPANDED ISLAND STATE (CARD) ================= */}
                {/* Fixed-dimension inner card (w-[364px] h-[190px]) completely prevents any text wrapping or layout jitter during spring snap */}
                <motion.div
                  initial={false}
                  animate={{
                    opacity: isExpanded ? 1 : 0,
                    scale: isExpanded ? 1 : 0.9,
                    y: isExpanded ? 0 : -6,
                    pointerEvents: isExpanded ? 'auto' : 'none'
                  }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute inset-0 w-[364px] h-[190px] p-4 pb-3 flex flex-col justify-between z-10"
                >
                  {/* Top Header Row: Scent Diffuser Icon, Title & Countdown */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-2xl flex items-center justify-center ring-1 ring-white/15 transition-all shadow-[0_0_14px_rgba(255,255,255,0.08)] shrink-0 overflow-hidden"
                        style={{
                          backgroundColor: isPurging
                            ? 'rgba(6, 182, 212, 0.2)'
                            : 'rgba(255, 255, 255, 0.12)'
                        }}
                      >
                        {isPurging ? (
                          <span className="material-symbols-outlined text-[20px] text-cyan-400 animate-spin">
                            mode_fan
                          </span>
                        ) : (
                          <AromaxLogo variant="icon" size={19} color="#34C759" className="drop-shadow-[0_0_8px_rgba(52,199,89,0.6)]" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13.5px] font-semibold tracking-tight text-white truncate max-w-[175px]">
                            {isPurging
                              ? 'Chamber Flush Active'
                              : isSessionActive
                              ? experienceTitle || 'Atmospheric Petrichor'
                              : 'Olfactory Engine Ready'}
                          </span>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-white/15 rounded text-white/80 shrink-0">
                            {batchId || '#RF-9042'}
                          </span>
                        </div>
                        <span className="text-[10.5px] text-white/60">
                          {isPurging
                            ? 'High Airflow Dispersion • Ports Cleared'
                            : isSessionActive
                            ? `${activePortsCount} Scent Ports Actuating • Active`
                            : '34 Micro-Valves Calibrated • Tap to Diffuse'}
                        </span>
                      </div>
                    </div>

                    {/* Countdown / Status Tile */}
                    <div className="flex flex-col items-end shrink-0 pl-1">
                      <span className="font-mono text-[15px] font-bold text-white tracking-tight leading-none">
                        {isPurging
                          ? `${purgeRemainingSeconds ?? 6}s`
                          : isSessionActive
                          ? formattedRemaining
                          : 'STANDBY'}
                      </span>
                      <span className="text-[8.5px] uppercase tracking-wider text-white/50 mt-1">
                        {isPurging ? 'Flush Delta' : isSessionActive ? 'Remaining' : 'Ready'}
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: REAL Olfactory / Scent Vapor Flow Visualizer (NOT audio equalizer bars) */}
                  <div className="flex flex-col gap-1.5 bg-white/[0.06] p-2.5 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between text-[11px] text-white/70">
                      <div className="flex items-center gap-2">
                        {/* Organic Undulating Scent Mist Wave (Smooth curved paths representing aroma diffusing) */}
                        <div className="relative flex items-center justify-center w-8 h-4 overflow-hidden">
                          <motion.svg
                            className="w-10 h-4"
                            viewBox="0 0 40 16"
                            fill="none"
                            animate={
                              paused || !isSessionActive
                                ? { opacity: 0.4 }
                                : {
                                    x: [-4, 4, -4],
                                    opacity: [0.65, 1, 0.65],
                                    transition: {
                                      duration: 2.2,
                                      repeat: Infinity,
                                      ease: 'easeInOut'
                                    }
                                  }
                            }
                          >
                            <path
                              d="M 0 8 Q 10 2, 20 8 T 40 8"
                              stroke={isPurging ? '#22D3EE' : scentColor}
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M 0 11 Q 10 5, 20 11 T 40 11"
                              stroke={isPurging ? '#22D3EE' : scentColor}
                              strokeWidth="1.2"
                              strokeOpacity="0.6"
                              strokeLinecap="round"
                            />
                          </motion.svg>
                        </div>

                        {/* Scent dispersion text */}
                        <span className="font-medium text-white/90 text-[11px]">
                          {isPurging
                            ? 'Flushing Scent Actuators (H01–H34)'
                            : isSessionActive
                            ? `Aroma Vapor Dispersion ${diffusionOutputPercent}%`
                            : 'Tap to trigger instant aromatic diffusion'}
                        </span>
                      </div>

                      <span className="font-mono text-[10px] text-white/60">
                        {isPurging
                          ? '100% Boost'
                          : isSessionActive
                          ? `${Math.round(progressPercent)}%`
                          : 'Active'}
                      </span>
                    </div>

                    {/* Thin Apple Progress Track with Scent Gradient */}
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: isPurging
                            ? `${100 - ((purgeRemainingSeconds ?? 6) / 6) * 100}%`
                            : isSessionActive
                            ? `${progressPercent}%`
                            : '100%',
                          background: isPurging
                            ? 'linear-gradient(90deg, #06B6D4, #22D3EE)'
                            : isSessionActive
                            ? 'linear-gradient(90deg, #34C759, #30B0C7)'
                            : 'rgba(255,255,255,0.2)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Bottom Controls Row: Quick Controls */}
                  <div className="grid grid-cols-2 gap-2">
                    {isSessionActive ? (
                      <>
                        {/* Pause / Resume button */}
                        {!isPurging && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (paused) resumeSession();
                              else pauseSession();
                            }}
                            className="py-2 px-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 text-[12px] font-medium text-white shadow-xs cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px] text-amber-400">
                              {paused ? 'play_arrow' : 'pause'}
                            </span>
                            <span>{paused ? 'Resume' : 'Pause'}</span>
                          </button>
                        )}

                        {/* Stop & Purge / Flush button */}
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (isPurging) {
                              await startPurge(6);
                            } else {
                              await stopSession(true);
                            }
                          }}
                          className={`py-2 px-3 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-1.5 text-[12px] font-medium shadow-xs cursor-pointer ${
                            isPurging
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 col-span-2'
                              : 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/25'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isPurging ? 'restart_alt' : 'mode_fan_off'}
                          </span>
                          <span>{isPurging ? 'Flush Again' : 'Stop & Purge'}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Quick Diffuse Demo Button */}
                        <button
                          type="button"
                          onClick={handleQuickStartDemo}
                          className="py-2 px-3 rounded-2xl bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 text-[12px] font-medium text-emerald-300 shadow-xs cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                          <span>Diffuse Now</span>
                        </button>

                        {/* Flush Chamber Button */}
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await startPurge(6);
                          }}
                          className="py-2 px-3 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 text-[12px] font-medium text-cyan-300 shadow-xs cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">mode_fan</span>
                          <span>Flush 6s</span>
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
