import path from 'path';
import { DIRS } from '../config/storage.js';

const CRF_MAP = {
  low: 28,
  medium: 23,
  high: 18,
  ultra: 12,
};

const CODEC_MAP = {
  mp4: 'libx264',
  webm: 'libvpx-vp9',
  mov: 'libx264',
};

/**
 * Build FFmpeg command arguments from a video project timeline.
 * @param {Object} project - VideoProject document
 * @param {Object} settings - { width, height, format, quality, fps, audioBitrate }
 * @returns {{ args: string[], outputPath: string }}
 */
export function buildExportCommand(project, settings) {
  const {
    width = 1920,
    height = 1080,
    format = 'mp4',
    quality = 'high',
    fps = 30,
    audioBitrate = '256k',
  } = settings;

  const outputFileName = `export_${project._id}_${Date.now()}.${format}`;
  const outputPath = path.join(DIRS.output, outputFileName);

  const crf = CRF_MAP[quality] || 23;
  const codec = CODEC_MAP[format] || 'libx264';

  const args = [];
  const inputs = [];
  const filterParts = [];
  const audioFilters = [];

  let inputIndex = 0;

  // Collect all clips with source files
  const tracks = project.tracks || [];

  for (const track of tracks) {
    for (const clip of track.clips || []) {
      if (!clip.sourcePath) continue;

      const i = inputIndex++;
      inputs.push('-i', clip.sourcePath);

      if (track.type === 'video' || track.type === 'image') {
        // Video clip processing
        const parts = [];

        // Trim to clip duration
        parts.push(`[${i}:v]trim=start=0:duration=${clip.duration},setpts=PTS-STARTPTS`);

        // Scale to output resolution
        parts.push(`scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`);

        // Apply effects
        if (clip.effects && clip.effects.length > 0) {
          for (const fx of clip.effects) {
            if (!fx.enabled) continue;
            // Brightness/contrast/saturation
            if (fx.id === 'brightness') {
              parts.push(`eq=brightness=${(fx.values?.value || 1) - 1}`);
            } else if (fx.id === 'contrast') {
              parts.push(`eq=contrast=${fx.values?.value || 1}`);
            } else if (fx.id === 'saturation') {
              parts.push(`eq=saturation=${fx.values?.value || 1}`);
            } else if (fx.id === 'blur') {
              parts.push(`boxblur=${fx.values?.radius || 0}`);
            }
          }
        }

        // Opacity
        if (clip.opacity != null && clip.opacity < 1) {
          parts.push(`format=rgba,colorchannelmixer=aa=${clip.opacity}`);
        }

        const label = `v${i}`;
        filterParts.push(`${parts.join(',')}[${label}]`);
      }

      if (track.type === 'audio' || track.type === 'video') {
        // Audio processing
        const aParts = [`[${i}:a]atrim=start=0:duration=${clip.duration},asetpts=PTS-STARTPTS`];

        const volume = clip.volume != null ? clip.volume : 1;
        aParts.push(`volume=${volume}`);

        if (clip.fadeIn > 0) {
          aParts.push(`afade=t=in:d=${clip.fadeIn}`);
        }
        if (clip.fadeOut > 0) {
          aParts.push(`afade=t=out:st=${clip.duration - clip.fadeOut}:d=${clip.fadeOut}`);
        }

        const aLabel = `a${i}`;
        audioFilters.push(`${aParts.join(',')}[${aLabel}]`);
      }
    }
  }

  // Handle transitions between adjacent video clips on same track
  for (const track of tracks) {
    if (track.type !== 'video' && track.type !== 'image') continue;
    const sorted = [...(track.clips || [])].sort((a, b) => a.startTime - b.startTime);

    for (let i = 1; i < sorted.length; i++) {
      const curr = sorted[i];
      if (curr.transition && curr.transition.type) {
        const trType = curr.transition.type === 'crossfade' ? 'fade' : curr.transition.type;
        const trDuration = curr.transition.duration || 1;
        const offset = curr.startTime;
        filterParts.push(
          `xfade=transition=${trType}:duration=${trDuration}:offset=${offset}`
        );
      }
    }
  }

  // Handle text overlays via drawtext
  for (const track of tracks) {
    if (track.type !== 'text') continue;
    for (const clip of track.clips || []) {
      if (!clip.text?.content) continue;
      const tc = clip.text;
      const escapedText = (tc.content || '').replace(/'/g, "'\\\\\\''");
      const fontSize = tc.fontSize || 48;
      const fontColor = tc.color || 'white';
      const x = `(w-tw)/2+${clip.transform?.x || 0}`;
      const y = `(h-th)/2+${clip.transform?.y || 0}`;

      filterParts.push(
        `drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${fontColor}:x=${x}:y=${y}:enable='between(t,${clip.startTime},${clip.startTime + clip.duration})'`
      );
    }
  }

  // Build final command
  args.push(...inputs);

  if (filterParts.length > 0 || audioFilters.length > 0) {
    const allFilters = [...filterParts, ...audioFilters].join(';');
    if (allFilters) {
      args.push('-filter_complex', allFilters);
    }
  }

  // Output settings
  args.push('-c:v', codec);
  args.push('-crf', String(crf));
  args.push('-r', String(fps));
  args.push('-s', `${width}x${height}`);
  args.push('-c:a', 'aac');
  args.push('-b:a', audioBitrate);
  args.push('-y', outputPath);

  return { args, outputPath };
}

/**
 * Parse FFmpeg progress output to extract percentage.
 * @param {string} line - stderr line from FFmpeg
 * @param {number} totalFrames - total expected frames
 * @returns {number|null} - progress percentage or null
 */
export function parseProgress(line, totalFrames) {
  const match = line.match(/frame=\s*(\d+)/);
  if (match && totalFrames > 0) {
    return Math.min(100, Math.round((parseInt(match[1]) / totalFrames) * 100));
  }
  return null;
}
