import VideoEffect from './VideoEffect.js';

export default class SaturationEffect extends VideoEffect {
  constructor() {
    super({
      id: 'saturation',
      name: 'Saturation',
      category: 'color',
      params: [
        { name: 'value', label: 'Saturation', type: 'number', default: 1, min: 0, max: 3, step: 0.01 },
      ],
    });
  }

  applyToCanvas(ctx, values) {
    ctx.filter = `${ctx.filter === 'none' ? '' : ctx.filter + ' '}saturate(${values.value})`;
  }

  toFFmpegFilter(values) {
    return `eq=saturation=${values.value}`;
  }
}
