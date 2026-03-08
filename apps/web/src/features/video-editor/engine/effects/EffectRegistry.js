import BrightnessEffect from './BrightnessEffect.js';
import ContrastEffect from './ContrastEffect.js';
import SaturationEffect from './SaturationEffect.js';
import BlurEffect from './BlurEffect.js';
import ChromaKeyEffect from './ChromaKeyEffect.js';

const effects = new Map();

function register(effect) {
  effects.set(effect.id, effect);
}

function get(id) {
  return effects.get(id) || null;
}

function getAll() {
  return Array.from(effects.values());
}

function getByCategory(category) {
  return getAll().filter((e) => e.category === category);
}

function getCategories() {
  const cats = new Set();
  for (const e of effects.values()) cats.add(e.category);
  return Array.from(cats);
}

// Register built-in effects
register(new BrightnessEffect());
register(new ContrastEffect());
register(new SaturationEffect());
register(new BlurEffect());
register(new ChromaKeyEffect());

const effectRegistry = { register, get, getAll, getByCategory, getCategories };
export default effectRegistry;
