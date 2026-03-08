/**
 * Format duration in seconds to "M:SS" or "H:MM:SS" string.
 */
export function formatDuration(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Format seconds to full timecode: "HH:MM:SS.mmm"
 */
export function formatTimecode(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '00:00:00.000';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);

  return (
    [
      String(h).padStart(2, '0'),
      String(m).padStart(2, '0'),
      String(s).padStart(2, '0'),
    ].join(':') +
    '.' +
    String(ms).padStart(3, '0')
  );
}

/**
 * Parse timecode string "HH:MM:SS.mmm" or "MM:SS" to seconds.
 */
export function parseTimecode(timecode) {
  const parts = timecode.split(':');
  if (parts.length === 3) {
    const [h, m, sMs] = parts;
    const [s, ms] = (sMs ?? '0').split('.');
    return (
      parseInt(h ?? '0', 10) * 3600 +
      parseInt(m ?? '0', 10) * 60 +
      parseInt(s ?? '0', 10) +
      parseInt((ms ?? '0').padEnd(3, '0'), 10) / 1000
    );
  }
  if (parts.length === 2) {
    const [m, sMs] = parts;
    const [s, ms] = (sMs ?? '0').split('.');
    return (
      parseInt(m ?? '0', 10) * 60 +
      parseInt(s ?? '0', 10) +
      parseInt((ms ?? '0').padEnd(3, '0'), 10) / 1000
    );
  }
  return parseFloat(timecode) || 0;
}

/**
 * Convert seconds to hours, minutes, seconds, milliseconds.
 */
export function secondsToHMS(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return { h, m, s, ms };
}
