import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/common/Header';
import { BottomNav, TabKey } from './components/common/BottomNav';
import { CreateScreen } from './components/screens/CreateScreen';
import { CinemaScreen } from './components/screens/CinemaScreen';
import { TherapyScreen } from './components/screens/TherapyScreen';
import { BlendsScreen } from './components/screens/BlendsScreen';
import { DeviceScreen } from './components/screens/DeviceScreen';
import { LiveDiffusionOverlay } from './components/diffusion/LiveDiffusionOverlay';
import { SettingsModal } from './components/common/SettingsModal';
import { AuthModal } from './components/common/AuthModal';
import { DiagnosticModal } from './components/common/DiagnosticModal';
import { DynamicIsland } from './components/common/DynamicIsland';
import { ThanosSnapTransition } from './components/common/ThanosSnapTransition';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useActiveSession } from './hooks/useActiveSession';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('create');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLiveOverlayOpen, setIsLiveOverlayOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);

  const { active: isSessionActive } = useActiveSession();
  const { isDark, snapPhase } = useTheme();

  const handleTabChange = (nextTab: TabKey) => {
    setActiveTab(nextTab);
  };

  return (
    <>
      {/* Fullscreen Thanos Snap Disintegration & Reverse Reconstitution Canvas */}
      <ThanosSnapTransition />

      <div
        className={`min-h-screen flex flex-col font-sans relative overflow-x-hidden transition-colors duration-300 ${
          isDark
            ? 'bg-black dark:bg-black text-[#F4F4F5] selection:bg-white selection:text-black'
            : 'bg-[#F2F4F7] text-[#1D1D1F] selection:bg-[#1D1D1F] selection:text-white'
        } ${
          snapPhase === 'vanishing'
            ? 'snap-vanishing-page'
            : snapPhase === 'reconstituting'
            ? 'snap-reconstituting-page'
            : ''
        }`}
      >
        {/* iOS Liquid Ambient Glow Blobs - adapts between light chromatic refraction and OLED cosmic nebulas */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {isDark ? (
            <>
              <div
                className="liquid-ambient-blob absolute -top-32 -right-20 w-[540px] h-[540px] rounded-full bg-gradient-to-br from-blue-600/20 via-indigo-600/18 to-transparent blur-[130px]"
                style={{ animationDuration: '22s' }}
              />
              <div
                className="liquid-ambient-blob absolute top-1/4 -left-32 w-[580px] h-[580px] rounded-full bg-gradient-to-tr from-emerald-500/18 via-teal-500/15 to-transparent blur-[140px]"
                style={{ animationDuration: '26s', animationDelay: '-4s' }}
              />
              <div
                className="liquid-ambient-blob absolute top-2/3 -right-28 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-amber-500/18 via-rose-500/15 to-transparent blur-[130px]"
                style={{ animationDuration: '20s', animationDelay: '-8s' }}
              />
              <div
                className="liquid-ambient-blob absolute -bottom-24 left-1/4 w-[540px] h-[540px] rounded-full bg-gradient-to-r from-purple-600/20 via-sky-600/15 to-transparent blur-[140px]"
                style={{ animationDuration: '24s', animationDelay: '-12s' }}
              />
            </>
          ) : (
            <>
              <div
                className="liquid-ambient-blob absolute -top-32 -right-20 w-[540px] h-[540px] rounded-full bg-gradient-to-br from-blue-300/45 via-indigo-200/40 to-transparent blur-[120px]"
                style={{ animationDuration: '22s' }}
              />
              <div
                className="liquid-ambient-blob absolute top-1/4 -left-32 w-[580px] h-[580px] rounded-full bg-gradient-to-tr from-emerald-300/40 via-teal-200/35 to-transparent blur-[130px]"
                style={{ animationDuration: '26s', animationDelay: '-4s' }}
              />
              <div
                className="liquid-ambient-blob absolute top-2/3 -right-28 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-amber-300/45 via-orange-200/35 to-transparent blur-[120px]"
                style={{ animationDuration: '20s', animationDelay: '-8s' }}
              />
              <div
                className="liquid-ambient-blob absolute -bottom-24 left-1/4 w-[540px] h-[540px] rounded-full bg-gradient-to-r from-purple-300/35 via-rose-200/30 to-transparent blur-[130px]"
                style={{ animationDuration: '24s', animationDelay: '-12s' }}
              />
            </>
          )}
        </div>

        {/* Dynamic Island: iPhone / Origin Island morphing floating pill for Emitting & Purging */}
        <DynamicIsland
          onOpenLiveSession={() => setIsLiveOverlayOpen(true)}
          isOverlayOpen={isLiveOverlayOpen}
          onExpandedChange={setIsIslandExpanded}
        />

        {/* Main app content */}
        <div className="flex-1 flex flex-col z-10">
          {/* Pristine Apple-style Top Header */}
          <Header
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenLiveSession={() => setIsLiveOverlayOpen(true)}
            onOpenDiagnostics={() => setIsDiagnosticOpen(true)}
            isSessionActive={isSessionActive}
          />

          {/* Main Screen Canvas with Snappy iOS Fade Transition & Slight Blur */}
          <main className="flex-1 w-full pt-20 pb-32 px-4 max-w-lg mx-auto flex flex-col relative">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{
                  opacity: 0,
                  filter: 'blur(5px)',
                  scale: 0.99
                }}
                animate={{
                  opacity: 1,
                  filter: 'blur(0px)',
                  scale: 1,
                  transition: {
                    duration: 0.15,
                    ease: [0.16, 1, 0.3, 1]
                  }
                }}
                exit={{
                  opacity: 0,
                  filter: 'blur(5px)',
                  scale: 0.99,
                  transition: {
                    duration: 0.1,
                    ease: [0.4, 0, 1, 1]
                  }
                }}
                className="w-full flex flex-col flex-1"
              >
                {activeTab === 'create' && (
                  <CreateScreen
                    onOpenBlends={() => handleTabChange('blends')}
                    onOpenLiveSession={() => setIsLiveOverlayOpen(true)}
                  />
                )}
                {activeTab === 'cinema' && (
                  <CinemaScreen
                    onOpenLiveSession={() => setIsLiveOverlayOpen(true)}
                  />
                )}
                {activeTab === 'therapy' && (
                  <TherapyScreen
                    onOpenLiveSession={() => setIsLiveOverlayOpen(true)}
                  />
                )}
                {activeTab === 'blends' && (
                  <BlendsScreen
                    onOpenLiveSession={() => setIsLiveOverlayOpen(true)}
                  />
                )}
                {activeTab === 'device' && (
                  <DeviceScreen onOpenDiagnostics={() => setIsDiagnosticOpen(true)} />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Bottom Frosted Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Fullscreen Live Diffusion Overlay matching Image 5 */}
        <LiveDiffusionOverlay
          isOpen={isLiveOverlayOpen}
          onClose={() => setIsLiveOverlayOpen(false)}
        />

        {/* Modals */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onOpenDiagnostics={() => setIsDiagnosticOpen(true)}
        />
        <DiagnosticModal
          isOpen={isDiagnosticOpen}
          onClose={() => setIsDiagnosticOpen(false)}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />
      </div>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainAppContent />
    </ThemeProvider>
  );
}
