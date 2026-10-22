import React, { useState } from 'react';
import { useDevice } from '../../hooks/useDevice';
import { TransportMode } from '../../types/device';
import { isFirebaseConfigured } from '../../services/firebase/firebaseClient';
import { AromaxLogo } from './AromaxLogo';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDiagnostics?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onOpenDiagnostics }) => {
  const {
    connected,
    transportMode,
    host,
    masks,
    setTransportMode,
    setEspHost,
    checkConnectivity,
    stopAll,
    error
  } = useDevice();

  const [inputHost, setInputHost] = useState(host);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveHost = () => {
    setEspHost(inputHost);
    setTestResult('Host saved.');
  };

  const handleTestPing = async () => {
    setTesting(true);
    setTestResult(null);
    const start = performance.now();
    const ok = await checkConnectivity();
    const elapsed = Math.round(performance.now() - start);
    setTesting(false);
    if (ok) {
      setTestResult(`Connected successfully (${elapsed}ms). Master/Slave synchronized.`);
    } else {
      setTestResult(`Ping failed (${elapsed}ms): ${error || 'Host unreachable'}`);
    }
  };

  const handleStopAll = async () => {
    await stopAll();
    setTestResult('Emergency Stop & Purge completed.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="ios-glass-card w-full max-w-md rounded-[32px] p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto text-[#1D1D1F] dark:text-[#F4F4F5]">
        {/* Top specular reflection rim */}
        <div className="glass-reflection-rim inset-x-8" />
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-black/[0.05] dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <AromaxLogo variant="badge" size={28} />
            <h2 className="text-[17px] font-semibold text-[#1D1D1F] dark:text-[#F4F4F5] tracking-tight">
              Hardware & Transport Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full ios-glass hover:bg-white/90 dark:hover:bg-zinc-700 flex items-center justify-center text-[#86868B] dark:text-[#A1A1AA] hover:text-[#1D1D1F] dark:hover:text-white transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Transport Mode Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold uppercase tracking-wider text-[#86868B] dark:text-[#A1A1AA]">
            Hardware Transport Mode
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F5F5F7] dark:bg-zinc-900 rounded-2xl border border-transparent dark:border-white/10">
            {(['local', 'cloud', 'mock'] as TransportMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setTransportMode(mode)}
                className={`py-2 px-2 rounded-xl text-[12px] font-semibold capitalize transition-all cursor-pointer ${
                  transportMode === mode
                    ? 'bg-white dark:bg-zinc-800 text-[#1D1D1F] dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-[#86868B] dark:text-[#A1A1AA] hover:text-[#1D1D1F] dark:hover:text-white'
                }`}
              >
                {mode === 'local' ? 'Local ESP32' : mode === 'cloud' ? 'Firebase Cloud' : 'Mock Simulator'}
              </button>
            ))}
          </div>
          {transportMode === 'mock' && (
            <p className="text-[11px] text-[#FF9500] dark:text-amber-300 font-medium bg-[#FFFBEB] dark:bg-amber-950/40 p-2 rounded-xl border border-[#FEF3C7] dark:border-amber-800/40">
              Notice: MOCK mode is active. Hardware commands are simulated locally.
            </p>
          )}
        </div>

        {/* Local ESP32 Configuration */}
        {transportMode === 'local' && (
          <div className="flex flex-col gap-2.5 bg-[#F5F5F7]/80 dark:bg-zinc-900/80 p-4 rounded-2xl border border-black/[0.03] dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#1D1D1F] dark:text-[#F4F4F5]">
                ESP32 Master Host IP
              </span>
              <span className="text-[11px] font-medium text-[#86868B] dark:text-[#A1A1AA]">
                WiFi: AromaxAI-Hub
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputHost}
                onChange={(e) => setInputHost(e.target.value)}
                placeholder="http://192.168.6.155"
                className="flex-1 bg-white dark:bg-zinc-950 text-[#1D1D1F] dark:text-white px-3 py-2 rounded-xl text-[13px] font-mono border border-black/[0.08] dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                onClick={handleSaveHost}
                className="px-3 py-2 bg-[#1D1D1F] dark:bg-zinc-800 text-white rounded-xl text-[12px] font-medium hover:bg-black dark:hover:bg-zinc-700 transition-all cursor-pointer ring-1 ring-white/10"
              >
                Save
              </button>
            </div>
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleTestPing}
                disabled={testing}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0071E3] dark:text-sky-400 hover:underline cursor-pointer"
              >
                <span className={`material-symbols-outlined text-[15px] ${testing ? 'animate-spin' : ''}`}>
                  sync
                </span>
                <span>{testing ? 'Testing...' : 'Test Connection / Status'}</span>
              </button>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  connected
                    ? 'bg-[#34C759]/10 text-[#34C759]'
                    : 'bg-[#FF9500]/10 text-[#FF9500]'
                }`}
              >
                {connected ? 'Device Online' : 'Device Offline'}
              </span>
            </div>
            {testResult && (
              <p className="text-[11px] font-medium text-[#1D1D1F] dark:text-[#F4F4F5] bg-white dark:bg-zinc-950 p-2.5 rounded-xl border border-black/[0.04] dark:border-white/10">
                {testResult}
              </p>
            )}
          </div>
        )}

        {/* Firebase Gateway Info */}
        {transportMode === 'cloud' && (
          <div className="flex flex-col gap-2 bg-[#F5F5F7]/80 dark:bg-zinc-900/80 p-4 rounded-2xl border border-black/[0.03] dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#1D1D1F] dark:text-[#F4F4F5]">
                Firebase Realtime Database
              </span>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  isFirebaseConfigured
                    ? 'bg-[#34C759]/10 text-[#34C759]'
                    : 'bg-[#FF9500]/10 text-[#FF9500]'
                }`}
              >
                {isFirebaseConfigured ? 'Connected' : 'Credentials Missing'}
              </span>
            </div>
            <p className="text-[11px] text-[#86868B] dark:text-[#A1A1AA] leading-relaxed">
              Streams desired commands to <code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">AromaxAI/commands/AROMAXAI-001</code> and monitors
              heartbeats from remote ESP32 clients.
            </p>
          </div>
        )}

        {/* Diagnostic Bitmasks */}
        <div className="bg-[#F5F5F7] dark:bg-zinc-900 p-3.5 rounded-2xl flex flex-col gap-1.5 font-mono text-[11px] border border-transparent dark:border-white/10">
          <span className="text-[10px] font-semibold uppercase text-[#86868B] dark:text-[#A1A1AA] tracking-wider font-sans">
            Hardware Bitmask Registers
          </span>
          <div className="flex justify-between text-[#1D1D1F] dark:text-[#F4F4F5]">
            <span>Master Mask (H01–H17):</span>
            <span className="font-bold">0x{masks.masterMask.toString(16).toUpperCase()} ({masks.masterMask})</span>
          </div>
          <div className="flex justify-between text-[#1D1D1F] dark:text-[#F4F4F5]">
            <span>Slave Mask (H18–H34):</span>
            <span className="font-bold">0x{masks.slaveMask.toString(16).toUpperCase()} ({masks.slaveMask})</span>
          </div>
          <div className="flex justify-between text-[#34C759] pt-1 border-t border-black/[0.05] dark:border-white/10">
            <span>H30 Fan Register (Slave bit 12):</span>
            <span className="font-bold">ACTIVE (1 &lt;&lt; 12)</span>
          </div>
        </div>

        {/* Network & Browser Diagnostics Trigger */}
        {onOpenDiagnostics && (
          <button
            onClick={() => {
              onClose();
              onOpenDiagnostics();
            }}
            className="w-full bg-[#0071E3]/10 dark:bg-sky-500/15 hover:bg-[#0071E3]/15 dark:hover:bg-sky-500/25 text-[#0071E3] dark:text-sky-300 font-semibold text-[13px] h-11 rounded-2xl flex items-center justify-center gap-2 transition-all border border-[#0071E3]/20 dark:border-sky-500/30 active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">troubleshoot</span>
            <span>Run Network &amp; Browser Diagnostics</span>
          </button>
        )}

        {/* Emergency Stop All */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={handleStopAll}
            className="w-full bg-[#FF3B30]/10 dark:bg-red-500/15 hover:bg-[#FF3B30]/15 dark:hover:bg-red-500/25 text-[#FF3B30] dark:text-red-300 font-semibold text-[13px] h-11 rounded-2xl flex items-center justify-center gap-2 transition-all border border-[#FF3B30]/20 dark:border-red-500/30 active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">cancel</span>
            <span>Emergency Stop & Purge All</span>
          </button>
          <p className="text-[10.5px] text-center text-[#86868B] dark:text-[#A1A1AA]">
            Stops all aroma channels immediately while keeping chamber purge fan active.
          </p>
        </div>
      </div>
    </div>
  );
};
