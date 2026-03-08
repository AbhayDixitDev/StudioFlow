import youtubedl from 'youtube-dl-exec';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

/**
 * Get a clean ffmpeg path without spaces (Windows yt-dlp bug workaround).
 * Copies ffmpeg.exe to a temp location if the original path has spaces.
 */
let cachedFfmpegPath = null;
function getCleanFfmpegPath() {
  if (cachedFfmpegPath) return cachedFfmpegPath;

  const src = ffmpegStatic;
  if (!src) {
    cachedFfmpegPath = 'ffmpeg';
    return cachedFfmpegPath;
  }

  // If path has no spaces, use it directly
  if (!src.includes(' ')) {
    cachedFfmpegPath = src;
    return cachedFfmpegPath;
  }

  // Copy to temp dir (no spaces) to work around yt-dlp argument parsing
  const dest = path.join(os.tmpdir(), 'audiosep_ffmpeg.exe');
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
  }
  cachedFfmpegPath = dest;
  return cachedFfmpegPath;
}

/**
 * Get video info without downloading.
 * Uses youtube-dl-exec (bundles yt-dlp via npm — no system install).
 */
export async function getVideoInfo(url) {
  const info = await youtubedl(url, {
    dumpSingleJson: true,
    noCheckCertificates: true,
    noWarnings: true,
    skipDownload: true,
  });

  return {
    title: info.title || 'Unknown',
    duration: info.duration || 0,
    thumbnail: info.thumbnail || null,
    uploader: info.uploader || info.channel || '',
  };
}

/**
 * Download audio from a YouTube URL.
 * Uses youtube-dl-exec (npm-bundled yt-dlp binary) — no system install needed.
 *
 * @param {string} url - YouTube video URL
 * @param {string} outputDir - Directory to save output
 * @param {string} format - Output format (mp3, wav, flac)
 * @param {function} onProgress - Callback with progress percentage
 * @returns {{ path: string, title: string }}
 */
export async function downloadAudio(url, outputDir, format = 'mp3', onProgress) {
  const tempId = crypto.randomBytes(6).toString('hex');

  // Use a temp dir with no spaces for yt-dlp (Windows path-with-spaces bug)
  const safeDir = path.join(os.tmpdir(), `audiosep_dl_${tempId}`);
  fs.mkdirSync(safeDir, { recursive: true });
  const outputTemplate = path.join(safeDir, `${tempId}.%(ext)s`);

  if (onProgress) onProgress(5);

  // Get info first for the title
  let title = 'audio';
  try {
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      skipDownload: true,
    });
    title = info.title || 'audio';
    if (onProgress) onProgress(15);
  } catch {
    // Continue without title
  }

  if (onProgress) onProgress(20);

  // Download and convert to requested format
  const ffmpegPath = getCleanFfmpegPath();

  await youtubedl(url, {
    extractAudio: true,
    audioFormat: format,
    audioQuality: format === 'mp3' ? '192K' : '0',
    output: outputTemplate,
    noCheckCertificates: true,
    noWarnings: true,
    ffmpegLocation: ffmpegPath,
  });

  if (onProgress) onProgress(90);

  // Find the downloaded file in the safe temp dir
  const tempFile = findOutputFile(safeDir, tempId, format);

  // Move to the actual output directory
  fs.mkdirSync(outputDir, { recursive: true });
  const finalPath = path.join(outputDir, path.basename(tempFile));
  fs.renameSync(tempFile, finalPath);

  // Clean up temp dir
  try { fs.rmSync(safeDir, { recursive: true, force: true }); } catch {}

  if (onProgress) onProgress(100);

  return { path: finalPath, title };
}

/**
 * Find the output file (yt-dlp resolves %(ext)s to the actual format).
 */
function findOutputFile(dir, tempId, format) {
  // Check exact expected path first
  const exact = path.join(dir, `${tempId}.${format}`);
  if (fs.existsSync(exact)) return exact;

  // yt-dlp may output with a different extension — find any file starting with tempId
  const files = fs.readdirSync(dir).filter(
    (f) => f.startsWith(tempId) && !f.endsWith('.part')
  );
  if (files.length > 0) {
    return path.join(dir, files[0]);
  }

  return exact; // fallback
}
