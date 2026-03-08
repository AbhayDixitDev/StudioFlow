/**
 * Detect if running inside Electron.
 */
export function isElectron() {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
}

/**
 * Get the Electron API bridge.
 * Returns null if not in Electron.
 */
function getApi() {
  if (!isElectron()) return null;
  return window.electronAPI;
}

// ─── File dialogs ───

export async function openFileDialog(filters) {
  const api = getApi();
  if (!api) return null;
  return api.openFileDialog(filters);
}

export async function saveFileDialog(defaultName) {
  const api = getApi();
  if (!api) return null;
  return api.saveFileDialog(defaultName);
}

// ─── Audio processing ───

export async function convertAudioLocal(input, output, options) {
  const api = getApi();
  if (!api) throw new Error('Not in Electron');
  return api.convertAudio(input, output, options);
}

export async function cutAudioLocal(input, output, options) {
  const api = getApi();
  if (!api) throw new Error('Not in Electron');
  return api.cutAudio(input, output, options);
}

export async function extractAudioLocal(input, output, format) {
  const api = getApi();
  if (!api) throw new Error('Not in Electron');
  return api.extractAudio(input, output, format);
}

export async function separateAudioLocal(input, output, model) {
  const api = getApi();
  if (!api) throw new Error('Not in Electron');
  return api.separateAudio(input, output, model);
}

// ─── Demucs setup ───

export async function getSetupStatus() {
  const api = getApi();
  if (!api) return null;
  return api.getSetupStatus();
}

export async function installDemucs() {
  const api = getApi();
  if (!api) throw new Error('Not in Electron');
  return api.installDemucs();
}

// ─── Progress ───

export function onProgress(callback) {
  const api = getApi();
  if (!api) return () => {};
  return api.onProgress(callback);
}

// ─── Settings ───

export async function getSetting(key) {
  const api = getApi();
  if (!api) return null;
  return api.getSetting(key);
}

export async function setSetting(key, value) {
  const api = getApi();
  if (!api) return;
  return api.setSetting(key, value);
}

export async function getAllSettings() {
  const api = getApi();
  if (!api) return null;
  return api.getAllSettings();
}
