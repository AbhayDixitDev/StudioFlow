export const EFFECT_DEFINITIONS = [
  {
    type: 'brightness',
    name: 'Brightness',
    category: 'color',
    params: [{ key: 'value', name: 'Brightness', min: 0, max: 2, step: 0.01, default: 1 }],
  },
  {
    type: 'contrast',
    name: 'Contrast',
    category: 'color',
    params: [{ key: 'value', name: 'Contrast', min: 0, max: 3, step: 0.01, default: 1 }],
  },
  {
    type: 'saturation',
    name: 'Saturation',
    category: 'color',
    params: [{ key: 'value', name: 'Saturation', min: 0, max: 3, step: 0.01, default: 1 }],
  },
  {
    type: 'blur',
    name: 'Blur',
    category: 'blur',
    params: [{ key: 'radius', name: 'Radius', min: 0, max: 20, step: 0.5, default: 0 }],
  },
  {
    type: 'hueRotate',
    name: 'Hue Rotate',
    category: 'color',
    params: [{ key: 'degrees', name: 'Degrees', min: -180, max: 180, step: 1, default: 0 }],
  },
  {
    type: 'grayscale',
    name: 'Grayscale',
    category: 'stylize',
    params: [{ key: 'amount', name: 'Amount', min: 0, max: 1, step: 0.01, default: 0 }],
  },
  {
    type: 'sepia',
    name: 'Sepia',
    category: 'stylize',
    params: [{ key: 'amount', name: 'Amount', min: 0, max: 1, step: 0.01, default: 0 }],
  },
  {
    type: 'chromaKey',
    name: 'Chroma Key',
    category: 'keying',
    params: [
      { key: 'similarity', name: 'Similarity', min: 0, max: 1, step: 0.01, default: 0.3 },
      { key: 'smoothness', name: 'Smoothness', min: 0, max: 1, step: 0.01, default: 0.1 },
    ],
  },
  {
    type: 'temperature',
    name: 'Temperature',
    category: 'color',
    params: [{ key: 'value', name: 'Temperature', min: -1, max: 1, step: 0.01, default: 0 }],
  },
];

export const TRANSITION_DEFINITIONS = [
  { type: 'crossfade', name: 'Crossfade', category: 'fade' },
  { type: 'slideLeft', name: 'Slide Left', category: 'slide' },
  { type: 'slideRight', name: 'Slide Right', category: 'slide' },
  { type: 'slideUp', name: 'Slide Up', category: 'slide' },
  { type: 'slideDown', name: 'Slide Down', category: 'slide' },
  { type: 'wipeHorizontal', name: 'Wipe Horizontal', category: 'wipe' },
  { type: 'wipeVertical', name: 'Wipe Vertical', category: 'wipe' },
  { type: 'wipeDiagonal', name: 'Wipe Diagonal', category: 'wipe' },
  { type: 'zoomIn', name: 'Zoom In', category: 'zoom' },
  { type: 'zoomOut', name: 'Zoom Out', category: 'zoom' },
];

export const TEXT_ANIMATION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'fadeIn', label: 'Fade In' },
  { value: 'fadeOut', label: 'Fade Out' },
  { value: 'slideIn', label: 'Slide In' },
  { value: 'typewriter', label: 'Typewriter' },
  { value: 'bounce', label: 'Bounce' },
];
