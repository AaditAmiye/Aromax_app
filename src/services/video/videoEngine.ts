import { VideoDemo, VideoScentEvent } from '../../types/video';
import { deviceService } from '../device/DeviceService';
import { calculateBlendDominantLight } from '../hardware/lightEngine';

type VideoEngineListener = (status: {
  isPlaying: boolean;
  currentTimeSeconds: number;
  durationSeconds: number;
  activeEvent: VideoScentEvent | null;
  queuedEvents: VideoScentEvent[];
  video: VideoDemo | null;
}) => void;

export class VideoScentEngine {
  private currentVideo: VideoDemo | null = null;
  private currentTimeSeconds = 0;
  private isPlaying = false;
  private activeEvent: VideoScentEvent | null = null;
  private eventDeactivationTimer: NodeJS.Timeout | null = null;
  private playbackInterval: NodeJS.Timeout | null = null;
  private listeners = new Set<VideoEngineListener>();

  // Track the ID of the last triggered event to avoid repeated calls at same second
  private lastTriggeredEventId: string | null = null;

  loadVideo(video: VideoDemo) {
    this.stop();
    this.currentVideo = video;
    this.currentTimeSeconds = 0;
    this.activeEvent = null;
    this.lastTriggeredEventId = null;
    this.notify();
  }

  subscribe(listener: VideoEngineListener): () => void {
    this.listeners.add(listener);
    this.notifySingle(listener);
    return () => this.listeners.delete(listener);
  }

  private notifySingle(listener: VideoEngineListener) {
    listener({
      isPlaying: this.isPlaying,
      currentTimeSeconds: this.currentTimeSeconds,
      durationSeconds: this.currentVideo ? this.currentVideo.durationSeconds : 0,
      activeEvent: this.activeEvent,
      queuedEvents: this.getQueuedEvents(),
      video: this.currentVideo
    });
  }

  private notify() {
    for (const l of this.listeners) {
      try {
        this.notifySingle(l);
      } catch (err) {
        console.error('Video engine listener error:', err);
      }
    }
  }

  getQueuedEvents(): VideoScentEvent[] {
    if (!this.currentVideo) return [];
    return this.currentVideo.events
      .filter((ev) => ev.timeSeconds > this.currentTimeSeconds)
      .sort((a, b) => a.timeSeconds - b.timeSeconds);
  }

  play() {
    if (!this.currentVideo || this.isPlaying) return;
    this.isPlaying = true;

    // If starting playback inside an active event cue, trigger physical aroma immediately
    const matching = this.findEventAtTime(this.currentTimeSeconds);
    if (matching) {
      this.triggerScentEvent(matching);
    }

    this.playbackInterval = setInterval(() => {
      this.tick();
    }, 1000);

    this.notify();
  }

  pause() {
    this.isPlaying = false;
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    // Stop physical aroma emission immediately upon pause
    this.clearActiveScent();
    this.notify();
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seek(timeSeconds: number) {
    if (!this.currentVideo) return;
    const clamped = Math.max(0, Math.min(this.currentVideo.durationSeconds, timeSeconds));
    this.currentTimeSeconds = clamped;

    // Check if there is an active event at this seek point
    const matching = this.findEventAtTime(clamped);
    if (matching) {
      if (matching.id !== this.activeEvent?.id) {
        this.triggerScentEvent(matching);
      }
    } else {
      if (this.activeEvent) {
        this.clearActiveScent();
      }
    }

    this.notify();
  }

  private findEventAtTime(timeSeconds: number): VideoScentEvent | null {
    if (!this.currentVideo) return null;
    for (const ev of this.currentVideo.events) {
      if (timeSeconds >= ev.timeSeconds && timeSeconds < ev.timeSeconds + ev.durationSeconds) {
        return ev;
      }
    }
    return null;
  }

  private tick() {
    if (!this.currentVideo) return;
    this.currentTimeSeconds += 1;

    // Check for video end
    if (this.currentTimeSeconds >= this.currentVideo.durationSeconds) {
      this.stop();
      return;
    }

    // Check for cue event crossing
    for (const ev of this.currentVideo.events) {
      if (Math.floor(this.currentTimeSeconds) === ev.timeSeconds && this.lastTriggeredEventId !== ev.id) {
        this.triggerScentEvent(ev);
        break;
      }
    }

    // Check if active event reached end of duration
    if (this.activeEvent) {
      const elapsed = this.currentTimeSeconds - this.activeEvent.timeSeconds;
      if (elapsed >= this.activeEvent.durationSeconds) {
        this.clearActiveScent();
      }
    }

    this.notify();
  }

  private async triggerScentEvent(event: VideoScentEvent) {
    this.activeEvent = event;
    this.lastTriggeredEventId = event.id;

    if (this.eventDeactivationTimer) {
      clearTimeout(this.eventDeactivationTimer);
      this.eventDeactivationTimer = null;
    }

    // CRITICAL: NEVER command physical hardware if the video is NOT currently playing!
    // Seeking, scrubbing, or loading a video should only update UI cues without firing physical scent actuators.
    if (!this.isPlaying) {
      this.notify();
      return;
    }

    const light = event.light || calculateBlendDominantLight(
      event.channelDetails || event.channels.map((id) => ({ channelId: id, intensity: 0.7 }))
    );

    // Command physical device
    await deviceService.applyState({
      channels: event.channels,
      light,
      source: `video-cue-${event.id}`
    });

    this.notify();
  }

  private async clearActiveScent() {
    this.activeEvent = null;

    // Reset aroma channels while keeping fan active
    await deviceService.applyState({
      channels: [],
      light: { r: 25, g: 25, b: 25 },
      source: 'video-cue-end'
    });

    this.notify();
  }

  stop() {
    this.pause();
    this.currentTimeSeconds = 0;
    this.clearActiveScent();
    this.lastTriggeredEventId = null;
    this.notify();
  }
}

export const videoScentEngine = new VideoScentEngine();
