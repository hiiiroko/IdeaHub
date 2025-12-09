import { Resolution, Ratio } from '../types/video';

export const VIDEO_RESOLUTIONS: { value: Resolution; label: string }[] = [
  { value: '480p', label: '480P（标清）' },
  { value: '720p', label: '720P（高清）' }
];

export const VIDEO_RATIOS: { value: Ratio; label: string }[] = [
  '16:9', '4:3', '1:1', '3:4', '9:16', '21:9'
].map(r => ({ value: r as Ratio, label: r }));

export const VIDEO_FPS_OPTIONS: { value: number; label: string }[] = [
  { value: 16, label: '16 FPS' },
  { value: 24, label: '24 FPS' }
];

export const VIDEO_DURATIONS = {
  MIN: 2,
  MAX: 12,
  STEP: 1,
  DEFAULT: 5
};
