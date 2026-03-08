const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Platform detection
  getPlatform: () => 'electron',
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // File dialogs
  openFileDialog: (filters) => ipcRenderer.invoke('open-file-dialog', filters),
  saveFileDialog: (defaultName) => ipcRenderer.invoke('save-file-dialog', defaultName),

  // Audio processing (local FFmpeg)
  convertAudio: (input, output, options) =>
    ipcRenderer.invoke('convert-audio', input, output, options),
  cutAudio: (input, output, options) =>
    ipcRenderer.invoke('cut-audio', input, output, options),
  extractAudio: (input, output, format) =>
    ipcRenderer.invoke('extract-audio', input, output, format),

  // Audio separation (local Python/Demucs)
  separateAudio: (input, output, model) =>
    ipcRenderer.invoke('separate-audio', input, output, model),

  // Video export (local FFmpeg)
  exportVideo: (projectData, settings) =>
    ipcRenderer.invoke('export-video', projectData, settings),

  // Python/Demucs setup
  getSetupStatus: () => ipcRenderer.invoke('get-setup-status'),
  installDemucs: () => ipcRenderer.invoke('install-demucs'),

  // Progress listener
  onProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('processing-progress', handler);
    return () => ipcRenderer.removeListener('processing-progress', handler);
  },

  // Settings
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  getAllSettings: () => ipcRenderer.invoke('get-all-settings'),
});
