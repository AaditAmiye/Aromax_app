import React, { useState, useEffect, useRef } from 'react';
import { VIDEO_DEMOS } from '../../data/videos';
import { videoScentEngine } from '../../services/video/videoEngine';
import { VideoDemo, VideoScentEvent } from '../../types/video';
import { CalibrateModal } from '../common/CalibrateModal';

interface CinemaScreenProps {
  onOpenLiveSession: () => void;
}

export const CinemaScreen: React.FC<CinemaScreenProps> = ({ onOpenLiveSession }) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoDemo>(VIDEO_DEMOS[0]);
  const [videoSrc, setVideoSrc] = useState<string>(
    VIDEO_DEMOS[0].videoUrl || '/IMG_9031.MP4'
  );
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [engineState, setEngineState] = useState({
    isPlaying: false,
    currentTimeSeconds: 0,
    durationSeconds: VIDEO_DEMOS[0].durationSeconds,
    activeEvent: null as VideoScentEvent | null,
    queuedEvents: [] as VideoScentEvent[],
    video: null as VideoDemo | null
  });

  const [isCalibrateOpen, setIsCalibrateOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Sync video source whenever selected video changes
  useEffect(() => {
    const nextSrc = selectedVideo.videoUrl || '/IMG_9031.MP4';
    setVideoSrc(nextSrc);
  }, [selectedVideo]);

  // Synchronize play/pause with HTML5 video element
  useEffect(() => {
    if (!videoRef.current) return;
    if (engineState.isPlaying) {
      videoRef.current.play().catch((err) => {
        console.warn('Playback play() prevented or interrupted:', err);
      });
    } else {
      videoRef.current.pause();
    }
  }, [engineState.isPlaying]);

  useEffect(() => {
    videoScentEngine.loadVideo(selectedVideo);
    // Start cleanly at 0 seconds without triggering any automatic aroma emission
    videoScentEngine.seek(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }

    const unsubscribe = videoScentEngine.subscribe((state) => {
      setEngineState(state);
    });

    return () => {
      unsubscribe();
      // Completely halt playback and ensure any active physical aromas are cleared
      videoScentEngine.stop();
    };
  }, [selectedVideo]);

  const handleTogglePlay = () => {
    videoScentEngine.togglePlayPause();
  };

  const handleSeek = (timeSec: number) => {
    videoScentEngine.seek(timeSec);
    if (videoRef.current) {
      videoRef.current.currentTime = timeSec;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = selectedVideo.durationSeconds > 0
    ? (engineState.currentTimeSeconds / selectedVideo.durationSeconds) * 100
    : 0;

  // Active cue (only actively emitting when playing AND inside a cue)
  const isActivelyEmitting = engineState.isPlaying && !!engineState.activeEvent;
  const currentEmittingCue = engineState.activeEvent || selectedVideo.events[0];
  const upcomingEvents = selectedVideo.events.filter(
    (ev) => ev.timeSeconds > engineState.currentTimeSeconds
  );

  return (
    <div className="flex flex-col gap-6 py-2 max-w-lg mx-auto w-full">
      {/* Hero Title Header */}
      <div className="pt-2 flex flex-col gap-1.5 px-1">
        <div className="inline-flex items-center gap-2 self-start px-2.5 py-1 rounded-full bg-[#F5F5F7] dark:bg-zinc-800 border border-black/[0.04] dark:border-white/10 text-[#86868B] dark:text-[#A1A1AA] text-[11px] font-medium tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]"></span>
          Spatial Olfactory Engine
        </div>
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F4F4F5]">
          Smell the Story
        </h1>
        <p className="text-[15px] leading-snug text-[#86868B] dark:text-[#A1A1AA] font-normal">
          Synchronized scent, sound, and visual narrative.
        </p>
      </div>

      {/* Cinematic Video Player with Live HTML5 Video */}
      <div className="relative w-full aspect-[16/10] rounded-3xl overflow-hidden bg-black border border-black/[0.06] shadow-[0_12px_32px_rgba(0,0,0,0.12)] flex flex-col justify-between group">
        {/* Real HTML5 Video Player */}
        <video
          ref={videoRef}
          src={videoSrc}
          poster={selectedVideo.thumbnailUrl}
          playsInline
          muted={isMuted}
          preload="auto"
          onLoadedData={() => setVideoLoaded(true)}
          onEnded={() => videoScentEngine.stop()}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-102"
        />

        {/* Fallback image if video not yet loaded or playback paused at 0s */}
        {!videoLoaded && !engineState.isPlaying && (
          <img
            src={selectedVideo.thumbnailUrl}
            alt={selectedVideo.title}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        )}

        {/* Dynamic atmospheric ambient glow matching active scent */}
        {isActivelyEmitting && currentEmittingCue?.light && (
          <div
            className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen transition-all duration-1000"
            style={{
              boxShadow: `inset 0 0 80px rgba(${currentEmittingCue.light.r}, ${currentEmittingCue.light.g}, ${currentEmittingCue.light.b}, 0.7)`
            }}
          />
        )}

        {/* Apple cinematic vignette gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/40 pointer-events-none"></div>

        {/* Top Overlay Tags */}
        <div className="relative z-10 p-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-sm text-[#1D1D1F] dark:text-white border border-transparent dark:border-white/10">
            <span
              className={`w-2 h-2 rounded-full ${
                isActivelyEmitting
                  ? 'bg-[#34C759] shadow-[0_0_8px_rgba(52,199,89,0.8)] animate-pulse'
                  : 'bg-[#86868B]'
              }`}
            />
            <span className="text-[12px] font-semibold tracking-tight">
              {isActivelyEmitting
                ? `Active: ${currentEmittingCue ? currentEmittingCue.title : selectedVideo.title}`
                : engineState.activeEvent
                ? `Cue: ${engineState.activeEvent.title} (Standby)`
                : 'Ready for Playback'}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-xl border border-white/20 text-white text-[11px] font-medium tracking-tight">
            <span className="material-symbols-outlined text-[13px] text-[#34C759]">graphic_eq</span>
            <span>4K HDR • Olfactory Sync</span>
          </div>
        </div>

        {/* Center Floating Apple Music Playback Control */}
        <div className="relative z-10 flex items-center justify-center">
          <button
            onClick={handleTogglePlay}
            aria-label="Toggle Playback"
            className="w-16 h-16 rounded-full bg-white/95 dark:bg-zinc-900/95 text-[#1D1D1F] dark:text-white hover:bg-white dark:hover:bg-zinc-800 active:scale-95 shadow-[0_12px_36px_rgba(0,0,0,0.25)] border border-transparent dark:border-white/15 backdrop-blur-2xl flex items-center justify-center transition-all duration-200 cursor-pointer"
          >
            <span
              className="material-symbols-outlined text-[32px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {engineState.isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
        </div>

        {/* Bottom Player HUD */}
        <div className="relative z-10 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold tracking-tight bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
              {formatTime(engineState.currentTimeSeconds)}{' '}
              <span className="text-white/60 font-normal">
                / {formatTime(selectedVideo.durationSeconds)}
              </span>
            </span>
            <span className="text-[11px] text-white/90 font-medium hidden xs:inline-block">
              CH {currentEmittingCue ? currentEmittingCue.channels.join(' • ') : 'Ready'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              aria-label="Mute Audio"
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors border border-white/10 text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isMuted ? 'volume_off' : 'volume_up'}
              </span>
            </button>
            <button
              onClick={onOpenLiveSession}
              aria-label="Open Fullscreen Diffusion"
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors border border-white/10 text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">fullscreen</span>
            </button>
          </div>
        </div>
      </div>

      {/* SMPTE Olfactory Cue Timeline Card matching Image 1 */}
      <div className="rounded-[34px] ios-glass-card p-5 ring-1 ring-black/[0.03] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#34C759]/15 text-[#34C759] flex items-center justify-center">
              <span className="material-symbols-outlined text-[15px]">timeline</span>
            </div>
            <span className="text-[14px] font-semibold text-[#1D1D1F] tracking-tight">
              SMPTE Scent Timeline
            </span>
          </div>
          <span className="text-[11px] font-semibold tracking-wider text-[#34C759] uppercase bg-[#34C759]/10 px-2.5 py-0.5 rounded-full border border-[#34C759]/20 shadow-2xs">
            Frame-Locked
          </span>
        </div>

        {/* Timeline Scrubbing Track with Interactive Event Nodes */}
        <div className="relative w-full py-2">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              handleSeek(Math.round(pct * selectedVideo.durationSeconds));
            }}
            className="w-full h-2 rounded-full bg-[#E5E5EA] relative overflow-visible cursor-pointer"
          >
            {/* Progress Fill */}
            <div
              className="h-full rounded-full bg-[#1D1D1F] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />

            {/* Event Markers */}
            {selectedVideo.events.map((ev) => {
              const nodePos = (ev.timeSeconds / selectedVideo.durationSeconds) * 100;
              const isPast = engineState.currentTimeSeconds >= ev.timeSeconds;
              const isCurrent =
                engineState.currentTimeSeconds >= ev.timeSeconds &&
                engineState.currentTimeSeconds < ev.timeSeconds + ev.durationSeconds;

              return (
                <div
                  key={ev.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSeek(ev.timeSeconds);
                  }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-10"
                  style={{ left: `${nodePos}%` }}
                  title={`${ev.title} (${formatTime(ev.timeSeconds)})`}
                >
                  {isCurrent ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-[#34C759]/30 animate-ping absolute"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-[#34C759] border-2 border-white shadow-sm relative z-10"></div>
                    </div>
                  ) : (
                    <div
                      className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-xs ${
                        isPast ? 'bg-[#1D1D1F]' : 'bg-[#AEAEB2]'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[11px] text-[#86868B] font-medium mt-3 gap-1 overflow-hidden">
            {selectedVideo.events.slice(0, 3).map((ev) => (
              <span
                key={ev.id}
                onClick={() => handleSeek(ev.timeSeconds)}
                className="cursor-pointer hover:underline truncate max-w-[100px]"
                title={`${formatTime(ev.timeSeconds)} (${ev.title})`}
              >
                {formatTime(ev.timeSeconds)} ({ev.title.split(' ')[0]})
              </span>
            ))}
            <span
              onClick={() => handleSeek(selectedVideo.durationSeconds)}
              className="cursor-pointer hover:underline shrink-0"
            >
              {formatTime(selectedVideo.durationSeconds)}
            </span>
          </div>
        </div>

        {/* Live Cue Cards */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Currently Emitting Card */}
          <div className="p-3.5 rounded-2xl ios-glass flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[12px] font-bold font-mono text-[#1D1D1F] dark:text-white bg-white/80 dark:bg-zinc-700/80 px-2 py-1 rounded-lg border border-black/[0.04] dark:border-white/10 shadow-2xs">
                {formatTime(currentEmittingCue.timeSeconds)}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-semibold text-[#1D1D1F] dark:text-[#F4F4F5] truncate">
                  {currentEmittingCue.title}
                </span>
                <span className="text-[12px] text-[#86868B] dark:text-[#A1A1AA] truncate">
                  CH: {currentEmittingCue.channels.join(' + ')}
                  {currentEmittingCue.note ? ` • ${currentEmittingCue.note}` : ''}
                </span>
              </div>
            </div>
            {isActivelyEmitting ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#34C759]/10 text-[#34C759] text-[11px] font-semibold uppercase tracking-wider shrink-0 border border-[#34C759]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse"></span>
                Emitting
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[#86868B] dark:text-[#A1A1AA] text-[11px] font-medium uppercase tracking-wider shrink-0 border border-black/[0.04] dark:border-white/10">
                Standby
              </span>
            )}
          </div>

          {/* Queued Cue Cards */}
          {upcomingEvents.slice(0, 2).map((ev) => (
            <div
              key={ev.id}
              onClick={() => handleSeek(ev.timeSeconds)}
              className="p-3.5 rounded-2xl ios-glass flex items-center justify-between opacity-90 cursor-pointer hover:bg-white/90 dark:hover:bg-zinc-700/80 transition-all shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[12px] font-medium font-mono text-[#86868B] dark:text-[#A1A1AA] ios-glass-pill px-2.5 py-1 rounded-lg">
                  {formatTime(ev.timeSeconds)}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] font-medium text-[#1D1D1F] dark:text-[#F4F4F5] truncate">
                    {ev.title}
                  </span>
                  <span className="text-[12px] text-[#86868B] dark:text-[#A1A1AA] truncate">
                    CH: {ev.channels.join(' + ')}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full ios-glass-pill text-[#86868B] dark:text-[#A1A1AA] text-[11px] font-medium uppercase tracking-wider shrink-0">
                Queued
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Aroma Telemetry matching Image 1 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[13px] font-semibold text-[#86868B] uppercase tracking-wider">
            Aroma Telemetry
          </span>
          <div className="flex items-center gap-1.5 text-amber-500 text-[12px] font-semibold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            <span>T-Minus 00:03s</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Chamber Purge Tile */}
          <div className="p-4 rounded-[28px] ios-glass-card ring-1 ring-black/[0.03] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#86868B]">
              <span className="text-[12px] font-medium tracking-tight">Purge Delta</span>
              <span className="material-symbols-outlined text-[17px] text-[#0071E3]">
                autorenew
              </span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] font-bold tracking-tight text-[#1D1D1F]">
                  0.28
                </span>
                <span className="text-[13px] font-semibold text-[#86868B]">sec</span>
              </div>
              <p className="text-[11px] text-[#86868B] mt-0.5">Chamber purge latency</p>
            </div>
          </div>

          {/* Dispersion Velocity Tile */}
          <div className="p-4 rounded-[28px] ios-glass-card ring-1 ring-black/[0.03] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#86868B]">
              <span className="text-[12px] font-medium tracking-tight">Dispersion</span>
              <span className="material-symbols-outlined text-[17px] text-[#34C759]">air</span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] font-bold tracking-tight text-[#34C759]">
                  1.4
                </span>
                <span className="text-[13px] font-semibold text-[#86868B]">m/s</span>
              </div>
              <p className="text-[11px] text-[#86868B] mt-0.5">Calibrated air velocity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Curated Stories Carousel Section matching Image 1 */}
      <div className="flex flex-col gap-3 mt-1">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-[20px] font-semibold tracking-tight text-[#1D1D1F]">
              Curated Stories
            </h2>
            <p className="text-[13px] text-[#86868B]">Mastered olfactory scores</p>
          </div>
          <span className="text-[13px] font-semibold text-[#0071E3]">
            {VIDEO_DEMOS.length} Mastered Scores
          </span>
        </div>

        {/* Horizontal scroll cards */}
        <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 no-scrollbar snap-x">
          {VIDEO_DEMOS.map((video) => {
            const isSelected = selectedVideo.id === video.id;
            return (
              <div
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className={`snap-start shrink-0 w-64 rounded-[28px] bg-white/75 dark:bg-zinc-900/85 backdrop-blur-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  isSelected ? 'border-[#1D1D1F] dark:border-white/30 ring-2 ring-[#1D1D1F]/10 dark:ring-white/10' : 'border-white/70 dark:border-white/10'
                }`}
              >
                <div className="relative w-full h-36 bg-[#F5F5F7] dark:bg-zinc-950 overflow-hidden">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-white">
                      READY
                    </span>
                  )}
                  <span className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-medium text-white">
                    {formatTime(video.durationSeconds)}
                  </span>
                </div>
                <div className="p-3.5 flex flex-col gap-0.5">
                  <h3 className="text-[15px] font-semibold text-[#1D1D1F] dark:text-[#F4F4F5] truncate">
                    {video.title}
                  </h3>
                  <p className="text-[12px] text-[#86868B] dark:text-[#A1A1AA] truncate">{video.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Device Sync Bar & iOS Calibrate Pill matching Image 1 */}
      <div className="p-4 rounded-[28px] ios-glass-card shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-3 h-3 rounded-full bg-[#34C759] shadow-[0_0_8px_rgba(52,199,89,0.7)] shrink-0"></div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-semibold text-[#1D1D1F] dark:text-[#F4F4F5] truncate">
              Device Synced: AROMAXAI-001
            </span>
            <span className="text-[11px] text-[#86868B] dark:text-[#A1A1AA] truncate">
              Active • Purge Ready • 34 Channels
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsCalibrateOpen(true)}
          className="h-9 px-4 rounded-full ios-glass ios-liquid-btn hover:bg-white/90 dark:hover:bg-zinc-800 text-[#1D1D1F] dark:text-[#F4F4F5] border border-white/80 dark:border-white/10 active:scale-95 text-[12px] font-semibold tracking-wide flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-[15px] relative z-10">tune</span>
          <span className="relative z-10">Calibrate</span>
        </button>
      </div>

      <CalibrateModal
        isOpen={isCalibrateOpen}
        onClose={() => setIsCalibrateOpen(false)}
        currentLight={currentEmittingCue?.light || { r: 52, g: 199, b: 89 }}
        onApplyLight={(rgb) => {
          // Send calibrated light to device
        }}
      />
    </div>
  );
};
