/**
 * Base class for video effects.
 * Each effect defines canvas rendering and FFmpeg filter equivalents.
 */
export default class VideoEffect {
  /**
   * @param {object} config
   * @param {string} config.id - Unique effect identifier
   * @param {string} config.name - Display name
   * @param {string} config.category - 'color' | 'blur' | 'keying' | 'stylize'
   * @param {Array<EffectParam>} config.params - Parameter definitions
   */
  constructor({ id, name, category, params }) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.params = params;
  }

  /** Returns a copy of default param values */
  getDefaults() {
    const defaults = {};
    for (const p of this.params) {
      defaults[p.name] = p.default;
    }
    return defaults;
  }

  /**
   * Apply effect to canvas context. Override in subclass.
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} values - Current parameter values
   * @param {object} rect - { x, y, width, height } of the clip on canvas
   */
  applyToCanvas(ctx, values, rect) {
    // Override in subclass
  }

  /**
   * Generate FFmpeg filter string. Override in subclass.
   * @param {object} values - Current parameter values
   * @returns {string} FFmpeg filter expression
   */
  toFFmpegFilter(values) {
    return '';
  }

  /**
   * Whether this effect uses pixel manipulation (needs ImageData).
   * Override to return true for effects like chroma key.
   */
  get usesPixelManipulation() {
    return false;
  }
}

/**
 * @typedef {object} EffectParam
 * @property {string} name - Parameter key
 * @property {string} label - Display label
 * @property {'number'|'color'|'boolean'} type
 * @property {*} default - Default value
 * @property {number} [min] - Min value (for number)
 * @property {number} [max] - Max value (for number)
 * @property {number} [step] - Step value (for number)
 */
