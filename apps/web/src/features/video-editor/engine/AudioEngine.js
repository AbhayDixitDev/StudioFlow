/**
 * AudioEngine - Web Audio API playback, waveform generation, and volume control
 * for the video editor.
 */

// Cache waveform peaks per source URL
const peaksCache = new Map();
// Cache decoded AudioBuffers per source URL
const bufferCache = new Map();

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Decode an audio file URL into an AudioBuffer, with caching.
 */
export async function decodeAudioBuffer(url) {
  if (bufferCache.has(url)) return bufferCache.get(url);

  const ctx = getAudioContext();
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  bufferCache.set(url, audioBuffer);
  return audioBuffer;
}

/**
 * Generate waveform peaks from an AudioBuffer.
 * Returns an array of peak values (0-1) for rendering.
 * @param {AudioBuffer} buffer
 * @param {number} numPeaks - number of peak samples to generate
 * @returns {number[]}
 */
export function generatePeaks(buffer, numPeaks = 200) {
  const channelData = buffer.getChannelData(0);
  const samplesPerPeak = Math.floor(channelData.length / numPeaks);
  const peaks = [];

  for (let i = 0; i < numPeaks; i++) {
    let max = 0;
    const start = i * samplesPerPeak;
    const end = Math.min(start + samplesPerPeak, channelData.length);
    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > max) max = abs;
    }
    peaks.push(max);
  }

  return peaks;
}

/**
 * Get cached peaks for a source URL. Returns null if not cached.
 */
export function getCachedPeaks(url) {
  return peaksCache.get(url) || null;
}

/**
 * Generate and cache peaks for a source URL.
 */
export async function getOrGeneratePeaks(url, numPeaks = 200) {
  const cacheKey = `${url}:${numPeaks}`;
  if (peaksCache.has(cacheKey)) return peaksCache.get(cacheKey);

  const buffer = await decodeAudioBuffer(url);
  const peaks = generatePeaks(buffer, numPeaks);
  peaksCache.set(cacheKey, peaks);
  return peaks;
}

/**
 * AudioPlaybackManager - manages synchronized playback of multiple audio clips
 */
export class AudioPlaybackManager {
  constructor() {
    this._sources = [];
    this._gainNodes = [];
    this._playing = false;
  }

  /**
   * Start playback of all audio clips at the given time.
   * @param {Array} clips - array of { sourcePath, startTime, duration, volume, fadeIn, fadeOut, muted }
   * @param {number} currentTime - current playback position in seconds
   */
  async play(clips, currentTime) {
    this.stop();
    this._playing = true;

    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    for (const clip of clips) {
      if (clip.muted || !clip.sourcePath) continue;

      const clipEnd = clip.startTime + clip.duration;
      if (currentTime >= clipEnd || currentTime < clip.startTime) continue;

      try {
        const buffer = await decodeAudioBuffer(clip.sourcePath);
        if (!this._playing) return; // stopped while loading

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // Gain node for volume
        const gainNode = ctx.createGain();
        const volume = clip.volume != null ? clip.volume : 1;

        // Calculate where we are in the clip
        const clipLocalTime = currentTime - clip.startTime;
        const remaining = clip.duration - clipLocalTime;

        // Apply volume with fade in/out
        const fadeIn = clip.fadeIn || 0;
        const fadeOut = clip.fadeOut || 0;

        if (fadeIn > 0 && clipLocalTime < fadeIn) {
          // We're in the fade-in zone
          const fadeProgress = clipLocalTime / fadeIn;
          gainNode.gain.setValueAtTime(volume * fadeProgress, ctx.currentTime);
          gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + (fadeIn - clipLocalTime));
        } else {
          gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        }

        if (fadeOut > 0) {
          const fadeOutStart = clip.duration - fadeOut;
          const timeUntilFadeOut = fadeOutStart - clipLocalTime;
          if (timeUntilFadeOut > 0) {
            gainNode.gain.setValueAtTime(volume, ctx.currentTime + timeUntilFadeOut);
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + remaining);
          } else {
            // Already in fade-out zone
            const fadeProgress = (clip.duration - clipLocalTime) / fadeOut;
            gainNode.gain.setValueAtTime(volume * fadeProgress, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + remaining);
          }
        }

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Calculate offset into the audio buffer
        const bufferOffset = clipLocalTime;
        source.start(0, bufferOffset, remaining);

        this._sources.push(source);
        this._gainNodes.push(gainNode);
      } catch {
        // Skip clips that fail to decode
      }
    }
  }

  /**
   * Stop all playing audio sources.
   */
  stop() {
    this._playing = false;
    for (const source of this._sources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // ignore
      }
    }
    for (const gain of this._gainNodes) {
      try {
        gain.disconnect();
      } catch {
        // ignore
      }
    }
    this._sources = [];
    this._gainNodes = [];
  }

  destroy() {
    this.stop();
  }
}

export { getAudioContext };
