import VideoEffect from './VideoEffect.js';

export default class ContrastEffect extends VideoEffect {
  constructor() {
    super({
      id: 'contrast',
      name: 'Contrast',
      category: 'color',
      params: [
        { name: 'value', label: 'Contrast', type: 'number', default: 1, min: 0, max: 3, step: 0.01 },
      ],
    });
  }

  applyToCanvas(ctx, values) {
    ctx.filter = `${ctx.filter === 'none' ? '' : ctx.filter + ' '}contrast(${values.value})`;
  }

  toFFmpegFilter(values) {
    return `eq=contrast=${values.value}`;
  }
}
