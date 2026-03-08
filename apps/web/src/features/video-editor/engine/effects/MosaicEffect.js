import VideoEffect from './VideoEffect.js';

export default class MosaicEffect extends VideoEffect {
  constructor() {
    super({
      id: 'mosaic',
      name: 'Mosaic',
      category: 'stylize',
      params: [
        { name: 'blockSize', label: 'Block Size', type: 'number', default: 1, min: 1, max: 50, step: 1 },
      ],
    });
  }

  get usesPixelManipulation() {
    return true;
  }

  applyToCanvas(ctx, values, rect) {
    const { blockSize } = values;
    if (blockSize <= 1) return;

    const { x, y, width, height } = rect;
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    const w = width;

    for (let by = 0; by < height; by += blockSize) {
      for (let bx = 0; bx < w; bx += blockSize) {
        // Average color of the block
        let r = 0, g = 0, b = 0, count = 0;
        for (let dy = 0; dy < blockSize && by + dy < height; dy++) {
          for (let dx = 0; dx < blockSize && bx + dx < w; dx++) {
            const idx = ((by + dy) * w + (bx + dx)) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            count++;
          }
        }
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        // Fill block with average
        for (let dy = 0; dy < blockSize && by + dy < height; dy++) {
          for (let dx = 0; dx < blockSize && bx + dx < w; dx++) {
            const idx = ((by + dy) * w + (bx + dx)) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
          }
        }
      }
    }

    ctx.putImageData(imageData, x, y);
  }

  toFFmpegFilter(values) {
    if (values.blockSize <= 1) return '';
    const s = values.blockSize;
    return `scale=iw/${s}:ih/${s}:flags=neighbor,scale=iw*${s}:ih*${s}:flags=neighbor`;
  }
}
