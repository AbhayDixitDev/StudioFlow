import VideoEffect from './VideoEffect.js';

export default class SharpenEffect extends VideoEffect {
  constructor() {
    super({
      id: 'sharpen',
      name: 'Sharpen',
      category: 'enhance',
      params: [
        { name: 'amount', label: 'Amount', type: 'number', default: 0, min: 0, max: 100, step: 1 },
      ],
    });
  }

  get usesPixelManipulation() {
    return true;
  }

  applyToCanvas(ctx, values, rect) {
    const { amount } = values;
    if (amount <= 0) return;

    const { x, y, width, height } = rect;
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    const copy = new Uint8ClampedArray(data);
    const w = width;
    const strength = amount / 100;

    // Unsharp mask: sharpen = original + strength * (original - blurred)
    // Using 3x3 Laplacian kernel approximation
    for (let row = 1; row < height - 1; row++) {
      for (let col = 1; col < w - 1; col++) {
        const idx = (row * w + col) * 4;
        for (let c = 0; c < 3; c++) {
          const center = copy[idx + c] * 5;
          const neighbors =
            copy[((row - 1) * w + col) * 4 + c] +
            copy[((row + 1) * w + col) * 4 + c] +
            copy[(row * w + col - 1) * 4 + c] +
            copy[(row * w + col + 1) * 4 + c];
          const sharpened = center - neighbors;
          data[idx + c] = Math.max(0, Math.min(255, copy[idx + c] + sharpened * strength * 0.3));
        }
      }
    }

    ctx.putImageData(imageData, x, y);
  }

  toFFmpegFilter(values) {
    if (values.amount <= 0) return '';
    const str = (values.amount / 100) * 1.5;
    return `unsharp=5:5:${str.toFixed(2)}`;
  }
}
