import { RGB, BlendChannelAllocation } from './aroma';

export interface VideoScentEvent {
  id: string;
  timeSeconds: number;
  title: string;
  channels: string[]; // e.g. ["H19", "H18"]
  durationSeconds: number;
  light?: RGB;
  note?: string;
  channelDetails?: BlendChannelAllocation[];
}

export interface VideoDemo {
  id: string;
  title: string;
  subtitle: string;
  durationSeconds: number;
  thumbnailUrl: string;
  videoUrl?: string;
  tags: string[];
  events: VideoScentEvent[];
  description?: string;
}
