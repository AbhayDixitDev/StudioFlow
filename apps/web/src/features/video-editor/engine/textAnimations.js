/**
 * Calculate text animation state based on clip-local time.
 *
 * @param {object} textConfig - The clip's text config
 * @param {number} localTime - Time since clip start (seconds)
 * @param {number} clipDuration - Total clip duration (seconds)
 * @returns {{ opacity: number, offsetX: number, offsetY: number, scale: number, visibleChars: number|null }}
 */
export function getTextAnimationState(textConfig, localTime, clipDuration) {
  const anim = textConfig.animation || 'none';
  const animDur = textConfig.animationDuration || 1;
  const content = textConfig.content || '';

  const result = { opacity: 1, offsetX: 0, offsetY: 0, scale: 1, visibleChars: null };

  if (anim === 'none') return result;

  const t = Math.min(1, Math.max(0, localTime / animDur)); // 0-1 progress

  switch (anim) {
    case 'fadeIn':
      result.opacity = easeOut(t);
      break;

    case 'fadeOut': {
      const endTime = clipDuration - animDur;
      if (localTime >= endTime) {
        const tOut = Math.min(1, (localTime - endTime) / animDur);
        result.opacity = 1 - easeIn(tOut);
      }
      break;
    }

    case 'slideIn':
      result.offsetX = (1 - easeOut(t)) * -200;
      break;

    case 'typewriter':
      if (t < 1) {
        result.visibleChars = Math.floor(t * content.length);
      }
      break;

    case 'bounce': {
      if (t < 1) {
        const bounceT = easeOutBounce(t);
        result.scale = bounceT;
        result.opacity = Math.min(1, t * 3);
      }
      break;
    }

    default:
      break;
  }

  return result;
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeIn(t) {
  return t * t * t;
}

function easeOutBounce(t) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}
