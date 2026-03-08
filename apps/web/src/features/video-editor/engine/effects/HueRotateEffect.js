import VideoEffect from './VideoEffect.js';

export default class HueRotateEffect extends VideoEffect {
  constructor() {
    super('hue-rotate', 'Hue Rotate', { usesPixelManipulation: false });
    this.params = [{ key: 'value', label: 'Hue', min: -180, max: 180, step: 1, default: 0, unit: 'deg' }];
  }

  getDefaults() { return { value: 0 }; }

  applyToCanvas(ctx, values) {
    const v = values.value || 0;
    if (v !== 0) {
      const existing = ctx.filter === 'none' ? '' : ctx.filter + ' ';
      ctx.filter = existing + `hue-rotate(${v}deg)`;
    }
  }

  toFFmpegFilter(values) {
    const h = (values.value || 0) / 360;
    return h !== 0 ? `hue=h=${h}` : '';
  }
}
