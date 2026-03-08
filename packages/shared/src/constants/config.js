export const DEFAULT_BITRATE = '192k';
export const DEFAULT_SAMPLE_RATE = 44100;
export const DEFAULT_CHANNELS = 2;

export const MODEL_OPTIONS = [
  {
    id: 'htdemucs',
    name: 'HTDemucs',
    stems: 4,
    stemNames: ['vocals', 'drums', 'bass', 'other'],
    description: 'Fast, good quality. Separates into 4 stems.',
  },
  {
    id: 'htdemucs_6s',
    name: 'HTDemucs 6-Stem',
    stems: 6,
    stemNames: ['vocals', 'drums', 'bass', 'guitar', 'piano', 'other'],
    description: 'Best quality. Separates into 6 stems including guitar and piano.',
  },
  {
    id: 'mdx_extra',
    name: 'MDX Extra',
    stems: 4,
    stemNames: ['vocals', 'drums', 'bass', 'other'],
    description: 'Alternative model. Good for vocals extraction.',
  },
];

export const EXPORT_PRESETS = [
  {
    id: 'youtube-1080',
    name: 'YouTube 1080p',
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    format: 'mp4',
    quality: 'high',
    audioBitrate: '192k',
  },
  {
    id: 'instagram-reel',
    name: 'Instagram Reel',
    resolution: { width: 1080, height: 1920 },
    fps: 30,
    format: 'mp4',
    quality: 'medium',
    audioBitrate: '192k',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    resolution: { width: 1080, height: 1920 },
    fps: 30,
    format: 'mp4',
    quality: 'medium',
    audioBitrate: '192k',
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    resolution: { width: 1280, height: 720 },
    fps: 30,
    format: 'mp4',
    quality: 'medium',
    audioBitrate: '128k',
  },
  {
    id: '4k',
    name: '4K Ultra HD',
    resolution: { width: 3840, height: 2160 },
    fps: 30,
    format: 'mp4',
    quality: 'ultra',
    audioBitrate: '320k',
  },
];

export const BITRATE_OPTIONS = ['64k', '128k', '192k', '256k', '320k'];
export const SAMPLE_RATE_OPTIONS = [22050, 44100, 48000, 96000];
export const FPS_OPTIONS = [24, 30, 60];
