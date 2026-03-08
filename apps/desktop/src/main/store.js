let Store;
let store = null;

function initStore() {
  if (store) return store;

  // electron-store v10 is ESM-only, use dynamic import
  // For CJS compatibility, use require with a try/catch
  try {
    Store = require('electron-store');
    if (Store.default) Store = Store.default;
  } catch {
    // If CJS require fails, store won't work until ESM import
    return createFallbackStore();
  }

  store = new Store({
    defaults: {
      theme: 'dark',
      defaultFormat: 'wav',
      defaultModel: 'htdemucs',
      lastInputDir: '',
      lastOutputDir: '',
      windowBounds: { width: 1280, height: 800 },
    },
  });

  return store;
}

function createFallbackStore() {
  // In-memory fallback if electron-store can't load
  const data = {
    theme: 'dark',
    defaultFormat: 'wav',
    defaultModel: 'htdemucs',
    lastInputDir: '',
    lastOutputDir: '',
    windowBounds: { width: 1280, height: 800 },
  };

  return {
    get: (key, defaultValue) => {
      return key in data ? data[key] : defaultValue;
    },
    set: (key, value) => {
      data[key] = value;
    },
    store: data,
  };
}

module.exports = { initStore };
