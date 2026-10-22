import React from 'react';
import { useDevice } from '../../hooks/useDevice';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { AromaxLogo } from './AromaxLogo';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenLiveSession?: () => void;
  onOpenDiagnostics?: () => void;
  isSessionActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenAuth,
  onOpenLiveSession,
  onOpenDiagnostics,
  isSessionActive
}) => {
  const { connected, transportMode, error } = useDevice();
  const { user } = useAuth();
  const { isDark, triggerThanosSnap, snapPhase } = useTheme();

  const handleAromaxClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    triggerThanosSnap({ x: originX, y: originY });
  };

  return (
    <header className="fixed top-0 w-full z-40 pt-safe bg-white/75 dark:bg-black/75 backdrop-blur-3xl border-b border-white/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.8)] transition-all">
      {/* Liquid Glass Refraction Edge along header top */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent pointer-events-none" />

      <div className="h-16 px-4 sm:px-6 flex items-center justify-between max-w-4xl mx-auto">
        {/* Left: Branding & Connection Status */}
        <div className="flex items-center gap-3">
          {/* Aromax AI Icon with Thanos Snap Transition Trigger */}
          <button
            type="button"
            onClick={handleAromaxClick}
            disabled={snapPhase !== 'idle'}
            aria-label={`Toggle theme (currently ${isDark ? 'Dark' : 'Light'}). Thanos snap animation.`}
            title={isDark ? 'Click Aromax AI to reverse snap to Light Mode' : 'Click Aromax AI for Thanos Snap Dark Mode'}
            className="relative group p-0.5 rounded-full cursor-pointer transition-transform active:scale-90 hover:scale-105 focus:outline-hidden disabled:cursor-wait"
          >
            <div className="w-8 h-8 rounded-full ios-glass flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs border border-white/90 dark:border-white/15 select-none transition-all">
              <AromaxLogo variant="icon" size={17} color="currentColor" />
            </div>
            {/* Glowing amber/cosmic energy halo on hover */}
            <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500/30 via-orange-500/25 to-purple-500/30 blur-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAromaxClick}
                disabled={snapPhase !== 'idle'}
                className="font-semibold text-[15px] tracking-tight text-[#1D1D1F] dark:text-[#F4F4F5] leading-none hover:opacity-80 transition-opacity text-left cursor-pointer"
                title={isDark ? 'Restore Light Mode' : 'Thanos Snap Dark Mode'}
              >
                AROMAXAI
              </button>
              <span className="text-[10px] tracking-widest font-semibold uppercase text-[#86868B] dark:text-[#A1A1AA] ios-glass-pill px-2 py-0.5 rounded-full border border-white/80 dark:border-white/10 shadow-2xs">
                001
              </span>
            </div>
            <button
              onClick={onOpenDiagnostics || onOpenSettings}
              className="flex items-center gap-1.5 mt-1 text-left hover:opacity-80 transition-opacity"
              title="Click to run network and hardware diagnostics"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connected
                    ? 'bg-[#34C759] shadow-[0_0_6px_rgba(52,199,89,0.8)]'
                    : 'bg-[#FF9500] animate-pulse'
                }`}
              />
              <span className="text-[11px] font-medium text-[#86868B] dark:text-[#A1A1AA] tracking-normal underline decoration-dotted decoration-[#86868B]/40 dark:decoration-white/30 underline-offset-2">
                {connected
                  ? transportMode === 'mock'
                    ? 'Simulated • MOCK-001'
                    : 'Synced • AROMAXAI-001'
                  : error
                  ? 'Reconnecting • 192.168.6.155'
                  : 'Searching Hardware...'}
              </span>
            </button>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* 34 Channels Badge */}
          <div className="hidden xs:flex items-center gap-1.5 px-3 py-1.5 rounded-full ios-glass-pill text-[11px] font-medium text-[#1D1D1F] dark:text-[#F4F4F5] border border-white/80 dark:border-white/10 shadow-xs">
            <span className="material-symbols-outlined text-[#34C759] text-[14px]">air</span>
            <span>34 Channels Active</span>
          </div>

          {/* Theme Quick Indicator badge */}
          <button
            onClick={handleAromaxClick}
            disabled={snapPhase !== 'idle'}
            aria-label="Toggle Theme"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-[#86868B] dark:text-[#A1A1AA] hover:text-[#1D1D1F] dark:hover:text-white ios-glass cursor-pointer transition-all"
            title="Toggle theme with Thanos Snap effect"
          >
            <span className="material-symbols-outlined text-[15px]">
              {isDark ? 'dark_mode' : 'light_mode'}
            </span>
          </button>

          {/* Settings / Hardware Link */}
          <button
            onClick={onOpenSettings}
            aria-label="Hardware settings and diagnostics"
            className="w-9 h-9 rounded-full ios-glass hover:bg-white/90 dark:hover:bg-zinc-800 text-[#1D1D1F] dark:text-[#F4F4F5] flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </button>

          {/* Profile / Auth Button */}
          <button
            onClick={onOpenAuth}
            aria-label="User Profile and Firebase Auth"
            className="w-9 h-9 rounded-full ios-glass text-[#1D1D1F] dark:text-white flex items-center justify-center shadow-xs hover:bg-white/90 dark:hover:bg-zinc-700 active:scale-95 transition-all border border-white/90 dark:border-white/10 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              {user && !user.isAnonymous ? 'account_circle' : 'person'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
