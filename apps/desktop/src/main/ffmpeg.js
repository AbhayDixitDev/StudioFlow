const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const isDev = !app.isPackaged;

/**
 * Get the path to the FFmpeg binary.
 * Dev: uses system FFmpeg from PATH.
 * Prod: uses bundled binary from app resources.
 */
function getFFmpegPath() {
  if (isDev) {
    // Use system FFmpeg in development
    return 'ffmpeg';
  }

  // In production, look in extraResources
  const resourcePath = process.resourcesPath;
  const ffmpegPath = path.join(resourcePath, 'ffmpeg', 'ffmpeg.exe');

  if (fs.existsSync(ffmpegPath)) {
    return ffmpegPath;
  }

  // Fallback to system FFmpeg
  return 'ffmpeg';
}

/**
 * Verify FFmpeg is available and working.
 */
function isFFmpegAvailable() {
  try {
    const ffmpeg = getFFmpegPath();
    execFileSync(ffmpeg, ['-version'], { timeout: 5000, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

module.exports = { getFFmpegPath, isFFmpegAvailable };
