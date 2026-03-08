import VideoEffect from './VideoEffect.js';

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export default class ChromaKeyEffect extends VideoEffect {
  constructor() {
    super({
      id: 'chromakey',
      name: 'Chroma Key',
      category: 'keying',
      params: [
        { name: 'keyColor', label: 'Key Color', type: 'color', default: '#00ff00' },
        { name: 'similarity', label: 'Similarity', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01 },
        { name: 'smoothness', label: 'Smoothness', type: 'number', default: 0.1, min: 0, max: 1, step: 0.01 },
      ],
    });
  }

  get usesPixelManipulation() {
    return true;
  }

  applyToCanvas(ctx, values, rect) {
    const { keyColor, similarity, smoothness } = values;
    const [kr, kg, kb] = hexToRgb(keyColor);
    const threshold = similarity * 441; // max distance = sqrt(3 * 255^2) ≈ 441
    const smooth = smoothness * 441;

    const imageData = ctx.getImageData(rect.x, rect.y, rect.width, rect.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const dr = data[i] - kr;
      const dg = data[i + 1] - kg;
      const db = data[i + 2] - kb;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);

      if (dist < threshold) {
        data[i + 3] = 0;
      } else if (dist < threshold + smooth) {
        data[i + 3] = Math.round(((dist - threshold) / smooth) * data[i + 3]);
      }
    }

    ctx.putImageData(imageData, rect.x, rect.y);
  }

  toFFmpegFilter(values) {
    const color = values.keyColor.replace('#', '0x');
    return `chromakey=${color}:${values.similarity}:${values.smoothness}`;
  }
}
