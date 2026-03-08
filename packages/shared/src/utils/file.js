import { AUDIO_EXTENSIONS, VIDEO_EXTENSIONS, IMAGE_FORMATS } from '../constants/formats';

/**
 * Format file size in bytes to human-readable string.
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Get file extension (lowercase, without dot).
 */
export function getExtension(filename) {
  const parts = filename.split('.');
  return (parts[parts.length - 1] ?? '').toLowerCase();
}

/**
 * Get filename without extension.
 */
export function getBaseName(filename) {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.substring(0, lastDot) : filename;
}

/**
 * Check if filename has an audio extension.
 */
export function isAudioFile(filename) {
  return AUDIO_EXTENSIONS.includes(getExtension(filename));
}

/**
 * Check if filename has a video extension.
 */
export function isVideoFile(filename) {
  return VIDEO_EXTENSIONS.includes(getExtension(filename));
}

/**
 * Check if filename has an image extension.
 */
export function isImageFile(filename) {
  return IMAGE_FORMATS.includes(getExtension(filename));
}

/**
 * Check if filename is a supported media file (audio, video, or image).
 */
export function isMediaFile(filename) {
  return isAudioFile(filename) || isVideoFile(filename) || isImageFile(filename);
}
