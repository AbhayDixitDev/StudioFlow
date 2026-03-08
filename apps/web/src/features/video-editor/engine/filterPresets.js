/**
 * Pre-made color filter presets (Phase 184).
 * Each preset defines a set of effects to apply at once.
 */
const filterPresets = [
  {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Warm tones, high contrast',
    effects: [
      { id: 'brightness', values: { value: 0.95 } },
      { id: 'contrast', values: { value: 1.3 } },
      { id: 'saturation', values: { value: 0.85 } },
      { id: 'temperature', values: { value: 15 } },
    ],
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Faded, warm retro look',
    effects: [
      { id: 'brightness', values: { value: 1.05 } },
      { id: 'contrast', values: { value: 0.9 } },
      { id: 'saturation', values: { value: 0.6 } },
      { id: 'temperature', values: { value: 25 } },
      { id: 'tint', values: { value: 10 } },
    ],
  },
  {
    id: 'cool',
    name: 'Cool',
    description: 'Blue-toned, crisp feel',
    effects: [
      { id: 'temperature', values: { value: -30 } },
      { id: 'contrast', values: { value: 1.1 } },
      { id: 'saturation', values: { value: 0.9 } },
    ],
  },
  {
    id: 'warm',
    name: 'Warm',
    description: 'Golden, inviting tones',
    effects: [
      { id: 'temperature', values: { value: 35 } },
      { id: 'brightness', values: { value: 1.05 } },
      { id: 'saturation', values: { value: 1.1 } },
    ],
  },
  {
    id: 'bw',
    name: 'B&W',
    description: 'Classic black and white',
    effects: [
      { id: 'saturation', values: { value: 0 } },
      { id: 'contrast', values: { value: 1.2 } },
    ],
  },
  {
    id: 'sepia',
    name: 'Sepia',
    description: 'Old photograph look',
    effects: [
      { id: 'saturation', values: { value: 0.3 } },
      { id: 'temperature', values: { value: 40 } },
      { id: 'brightness', values: { value: 1.05 } },
    ],
  },
  {
    id: 'vivid',
    name: 'Vivid',
    description: 'Punchy, saturated colors',
    effects: [
      { id: 'saturation', values: { value: 1.5 } },
      { id: 'contrast', values: { value: 1.15 } },
      { id: 'brightness', values: { value: 1.02 } },
    ],
  },
  {
    id: 'matte',
    name: 'Matte',
    description: 'Lifted blacks, soft look',
    effects: [
      { id: 'contrast', values: { value: 0.8 } },
      { id: 'brightness', values: { value: 1.1 } },
      { id: 'saturation', values: { value: 0.85 } },
    ],
  },
];

export default filterPresets;
