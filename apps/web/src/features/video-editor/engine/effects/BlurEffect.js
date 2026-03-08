import VideoEffect from './VideoEffect.js';

export default class BlurEffect extends VideoEffect {
  constructor() {
    super({
      id: 'blur',
      name: 'Blur',
      category: 'blur',
      params: [
        { name: 'radius', label: 'Radius', type: 'number', default: 0, min: 0, max: 20, step: 0.5 },
      ],
    });
  }

  applyToCanvas(ctx, values) {
    if (values.radius > 0) {
      ctx.filter = `${ctx.filter === 'none' ? '' : ctx.filter + ' '}blur(${values.radius}px)`;
    }
  }

  toFFmpegFilter(values) {
    if (values.radius <= 0) return '';
    return `boxblur=${values.radius}`;
  }
}
