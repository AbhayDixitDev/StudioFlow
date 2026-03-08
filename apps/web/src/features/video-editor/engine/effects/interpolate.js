/**
 * Linear interpolation of effect params between keyframes.
 *
 * @param {Array<{time: number, params: object}>} keyframes - sorted by time
 * @param {number} time - current time relative to clip start (0 = clip start)
 * @param {object} defaults - default param values
 * @returns {object} interpolated param values
 */
export function interpolateKeyframes(keyframes, time, defaults) {
  if (!keyframes || keyframes.length === 0) return { ...defaults };
  if (keyframes.length === 1) return { ...defaults, ...keyframes[0].params };

  // Before first keyframe
  if (time <= keyframes[0].time) return { ...defaults, ...keyframes[0].params };

  // After last keyframe
  if (time >= keyframes[keyframes.length - 1].time) {
    return { ...defaults, ...keyframes[keyframes.length - 1].params };
  }

  // Find surrounding keyframes
  let before = keyframes[0];
  let after = keyframes[1];
  for (let i = 1; i < keyframes.length; i++) {
    if (keyframes[i].time >= time) {
      after = keyframes[i];
      before = keyframes[i - 1];
      break;
    }
  }

  const range = after.time - before.time;
  const t = range > 0 ? (time - before.time) / range : 0;

  const result = { ...defaults };

  // Interpolate each numeric param
  for (const key of Object.keys(result)) {
    const a = before.params[key];
    const b = after.params[key];
    if (typeof a === 'number' && typeof b === 'number') {
      result[key] = a + (b - a) * t;
    } else if (b !== undefined) {
      result[key] = b;
    } else if (a !== undefined) {
      result[key] = a;
    }
  }

  return result;
}
