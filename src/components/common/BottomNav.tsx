import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';

export type TabKey = 'create' | 'cinema' | 'therapy' | 'blends' | 'device';

interface BottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs: { key: TabKey; icon: string }[] = [
    { key: 'create', icon: 'auto_awesome' },
    { key: 'cinema', icon: 'movie' },
    { key: 'therapy', icon: 'spa' },
    { key: 'blends', icon: 'science' },
    { key: 'device', icon: 'precision_manufacturing' }
  ];

  const navRef = useRef<HTMLDivElement>(null);
  const [isSliding, setIsSliding] = useState(false);

  const handlePointerSelect = useCallback(
    (clientX: number) => {
      if (!navRef.current) return;
      const rect = navRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const ratio = Math.max(0, Math.min(0.999, relativeX / rect.width));
      const targetIndex = Math.floor(ratio * tabs.length);
      const targetTab = tabs[targetIndex];
      if (targetTab && targetTab.key !== activeTab) {
        onTabChange(targetTab.key);
      }
    },
    [tabs, activeTab, onTabChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsSliding(true);
    handlePointerSelect(e.clientX);
    navRef.current?.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isSliding) {
      handlePointerSelect(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsSliding(false);
    try {
      navRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore if not captured
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches[0]) {
      handlePointerSelect(e.touches[0].clientX);
    }
  };

  return (
    <div className="fixed bottom-2 sm:bottom-2.5 inset-x-0 z-40 flex justify-center px-4 pointer-events-none pb-safe select-none">
      {/* Floating iPhone Ultra-Glass Dock with Slide Gesture */}
      <nav
        ref={navRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setIsSliding(false)}
        onTouchMove={handleTouchMove}
        style={{ touchAction: 'none' }}
        className="pointer-events-auto relative w-full max-w-[340px] h-[58px] ios-dock-glass rounded-full px-2 py-1.5 transition-all cursor-pointer flex items-center justify-between"
      >
        {/* Specular Rim Light Refraction (Top Edge of iOS Glass) */}
        <div className="glass-reflection-rim inset-x-6" />

        {/* Ambient Subtle Amber Camera Underglow */}
        <div className="absolute -bottom-4 inset-x-8 h-8 bg-amber-400/15 blur-xl pointer-events-none" />

        {/* iOS App Dock Icons with Slide-Following Glass Capsule */}
        <div className="w-full flex items-center justify-between gap-1 relative z-10 h-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className="relative flex-1 h-full flex flex-col items-center justify-center rounded-full cursor-pointer select-none transition-transform active:scale-90"
                aria-current={isActive ? 'page' : undefined}
                aria-label={tab.key}
              >
                {/* Sliding Liquid Frosted Glass Bubble underneath active icon */}
                {isActive && (
                  <motion.div
                    layoutId="dockGlassPill"
                    transition={{
                      type: 'spring',
                      stiffness: 550,
                      damping: 34,
                      mass: 0.45
                    }}
                    className="absolute inset-0 bg-white/95 dark:bg-zinc-800/95 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_1.5px_rgba(255,255,255,1)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.15)] ring-1 ring-black/[0.05] dark:ring-white/10 z-0 flex items-center justify-center overflow-hidden"
                  >
                    {/* Top specular reflection rim on active dock pill */}
                    <div className="absolute top-0 inset-x-2 h-[1px] bg-gradient-to-r from-transparent via-white dark:via-white/35 to-transparent pointer-events-none" />
                    {/* iPhone Amber Camera / Active Dot */}
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#FF9500] shadow-[0_0_6px_rgba(255,149,0,0.9)]" />
                  </motion.div>
                )}

                {/* Tab Icon with Snappy Spring Pop */}
                <motion.span
                  animate={{
                    scale: isActive ? 1.15 : 0.95,
                    y: isActive ? -1 : 0
                  }}
                  transition={{ type: 'spring', stiffness: 550, damping: 30 }}
                  className={`material-symbols-outlined text-[24px] relative z-10 transition-colors duration-150 ${
                    isActive
                      ? 'text-[#1D1D1F] dark:text-white'
                      : 'text-[#86868B] dark:text-[#A1A1AA] hover:text-[#1D1D1F] dark:hover:text-white'
                  }`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {tab.icon}
                </motion.span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
