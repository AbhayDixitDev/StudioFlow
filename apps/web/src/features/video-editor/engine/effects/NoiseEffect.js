import VideoEffect from './VideoEffect.js';

export default class NoiseEffect extends VideoEffect {
  constructor() {
    super({
      id: 'noise',
      name: 'Film Grain',
      category: 'stylize',
      params: [
        { name: 'intensity', label: 'Intensity', type: 'number', default: 0, min: 0, max: 100, step: 1 },
      ],
    });
  }

  get usesPixelManipulation() {
    return true;
  }

  applyToCanvas(ctx, values, rect) {
    const { intensity } = values;
    if (intensity <= 0) return;

    const { x, y, width, height } = rect;
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    const amount = (intensity / 100) * 80;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * amount;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }

    ctx.putImageData(imageData, x, y);
  }

  toFFmpegFilter(values) {
    if (values.intensity <= 0) return '';
    const amount = Math.round(values.intensity * 0.8);
    return `noise=alls=${amount}:allf=t`;
  }
}
