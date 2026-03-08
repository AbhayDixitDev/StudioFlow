export const AUDIO_FORMATS = [
  { extension: 'mp3', mimeType: 'audio/mpeg', label: 'MP3', lossy: true },
  { extension: 'wav', mimeType: 'audio/wav', label: 'WAV', lossy: false },
  { extension: 'flac', mimeType: 'audio/flac', label: 'FLAC', lossy: false },
  { extension: 'ogg', mimeType: 'audio/ogg', label: 'OGG', lossy: true },
  { extension: 'aac', mimeType: 'audio/aac', label: 'AAC', lossy: true },
  { extension: 'm4a', mimeType: 'audio/mp4', label: 'M4A', lossy: true },
  { extension: 'wma', mimeType: 'audio/x-ms-wma', label: 'WMA', lossy: true },
];

export const VIDEO_FORMATS = [
  { extension: 'mp4', mimeType: 'video/mp4', label: 'MP4', lossy: true },
  { extension: 'mkv', mimeType: 'video/x-matroska', label: 'MKV', lossy: true },
  { extension: 'avi', mimeType: 'video/x-msvideo', label: 'AVI', lossy: true },
  { extension: 'mov', mimeType: 'video/quicktime', label: 'MOV', lossy: true },
  { extension: 'webm', mimeType: 'video/webm', label: 'WebM', lossy: true },
];

export const IMAGE_FORMATS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'];

export const SUPPORTED_AUDIO_MIMES = AUDIO_FORMATS.map((f) => f.mimeType);
export const SUPPORTED_VIDEO_MIMES = VIDEO_FORMATS.map((f) => f.mimeType);
export const SUPPORTED_UPLOAD_MIMES = [...SUPPORTED_AUDIO_MIMES, ...SUPPORTED_VIDEO_MIMES];

export const AUDIO_EXTENSIONS = AUDIO_FORMATS.map((f) => f.extension);
export const VIDEO_EXTENSIONS = VIDEO_FORMATS.map((f) => f.extension);

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
