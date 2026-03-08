import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

/**
 * Probe a media file for metadata.
 * Returns: { duration, format, channels, sampleRate, bitrate, codec }
 */
export function probeFile(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      const audio = metadata.streams.find((s) => s.codec_type === 'audio');
      const format = metadata.format;

      resolve({
        duration: format.duration || 0,
        format: path.extname(filePath).replace('.', ''),
        channels: audio?.channels || 0,
        sampleRate: audio?.sample_rate ? parseInt(audio.sample_rate) : 0,
        bitrate: format.bit_rate ? Math.round(parseInt(format.bit_rate) / 1000) : 0,
        codec: audio?.codec_name || '',
        size: format.size ? parseInt(format.size) : 0,
      });
    });
  });
}

/**
 * Convert an audio file to a different format.
 * @param {string} inputPath - Source file path
 * @param {string} outputPath - Destination file path
 * @param {object} options - { format, bitrate, sampleRate, channels }
 * @param {function} onProgress - Callback with progress percentage (0-100)
 * @returns {Promise<void>}
 */
// Max sample rates per format (formats not listed support any rate)
const MAX_SAMPLE_RATES = {
  mp3: 48000,
  ogg: 48000,
  aac: 96000,
  m4a: 96000,
};

export function convertAudio(inputPath, outputPath, options = {}, onProgress) {
  return new Promise((resolve, reject) => {
    // If no outputPath, generate a temp file
    const actualOutput = outputPath || path.join(
      os.tmpdir(),
      `audiosep_${crypto.randomBytes(6).toString('hex')}.${options.format || 'mp3'}`
    );

    // Detect output format from extension
    const ext = path.extname(actualOutput).replace('.', '').toLowerCase();

    let cmd = ffmpeg(inputPath);

    if (options.bitrate) {
      cmd = cmd.audioBitrate(options.bitrate);
    }
    if (options.sampleRate) {
      // Cap sample rate to what the target format supports
      const maxRate = MAX_SAMPLE_RATES[ext];
      const rate = maxRate ? Math.min(options.sampleRate, maxRate) : options.sampleRate;
      cmd = cmd.audioFrequency(rate);
    }
    if (options.channels) {
      cmd = cmd.audioChannels(options.channels);
    }

    cmd
      .output(actualOutput)
      .on('progress', (progress) => {
        if (onProgress && progress.percent != null) {
          onProgress(Math.round(progress.percent));
        }
      })
      .on('end', () => resolve(actualOutput))
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Extract audio from a video file.
 */
export function extractAudio(inputPath, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    let cmd = ffmpeg(inputPath).noVideo();

    if (options.bitrate) {
      cmd = cmd.audioBitrate(options.bitrate);
    }
    if (options.sampleRate) {
      cmd = cmd.audioFrequency(options.sampleRate);
    }

    cmd
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Cut a segment from an audio file.
 */
export function cutAudio(inputPath, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    let cmd = ffmpeg(inputPath);

    if (options.startTime != null) {
      cmd = cmd.setStartTime(options.startTime);
    }
    if (options.endTime != null && options.startTime != null) {
      cmd = cmd.setDuration(options.endTime - options.startTime);
    }
    if (options.fadeInDuration) {
      cmd = cmd.audioFilters(`afade=t=in:d=${options.fadeInDuration}`);
    }
    if (options.fadeOutDuration && options.endTime != null && options.startTime != null) {
      const duration = options.endTime - options.startTime;
      const fadeStart = duration - options.fadeOutDuration;
      cmd = cmd.audioFilters(`afade=t=out:st=${fadeStart}:d=${options.fadeOutDuration}`);
    }

    cmd
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}
