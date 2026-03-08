import VideoEffect from './VideoEffect.js';

export default class BrightnessEffect extends VideoEffect {
  constructor() {
    super({
      id: 'brightness',
      name: 'Brightness',
      category: 'color',
      params: [
        { name: 'value', label: 'Brightness', type: 'number', default: 1, min: 0, max: 2, step: 0.01 },
      ],
    });
  }

  applyToCanvas(ctx, values) {
    ctx.filter = `${ctx.filter === 'none' ? '' : ctx.filter + ' '}brightness(${values.value})`;
  }

  toFFmpegFilter(values) {
    return `eq=brightness=${values.value - 1}`;
  }
}
