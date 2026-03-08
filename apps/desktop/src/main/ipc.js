const { ipcMain, dialog, app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getFFmpegPath } = require('./ffmpeg.js');
const { getSetupStatus, setupVirtualEnv, installDemucs, getMlDir, getSeparationPython } = require('./demucs.js');
const { initStore } = require('./store.js');

function sendProgress(type, progress, extra = {}) {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.webContents.send('processing-progress', { type, progress, ...extra });
  }
}

function registerIpcHandlers() {
  // ─── App info ───
  ipcMain.handle('get-app-version', () => app.getVersion());

  // ─── File dialogs ───
  ipcMain.handle('open-file-dialog', async (_event, filters) => {
    const win = BrowserWindow.getFocusedWindow();
    const defaultFilters = filters || [
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a'] },
      { name: 'Video Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm'] },
      { name: 'All Files', extensions: ['*'] },
    ];

    const result = await dialog.showOpenDialog(win, { filters: defaultFilters });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('save-file-dialog', async (_event, defaultName) => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showSaveDialog(win, {
      defaultPath: defaultName,
    });
    if (result.canceled) return null;
    return result.filePath;
  });

  // ─── Local FFmpeg: convert ───
  ipcMain.handle('convert-audio', (_event, input, output, options = {}) => {
    return new Promise((resolve, reject) => {
      const ffmpeg = getFFmpegPath();
      const args = ['-i', input, '-y'];

      if (options.bitrate) args.push('-b:a', options.bitrate);
      if (options.sampleRate) args.push('-ar', String(options.sampleRate));
      if (options.channels) args.push('-ac', String(options.channels));

      args.push(output);

      const proc = spawn(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stderr = '';

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        const match = stderr.match(/time=(\d+):(\d+):(\d+)/);
        if (match) {
          sendProgress('convert', -1, { time: `${match[1]}:${match[2]}:${match[3]}` });
        }
      });

      proc.on('close', (code) => {
        if (code !== 0) return reject(new Error(`FFmpeg failed: ${stderr.slice(-300)}`));
        resolve({ outputPath: output, size: fs.statSync(output).size });
      });

      proc.on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)));
    });
  });

  // ─── Local FFmpeg: cut ───
  ipcMain.handle('cut-audio', (_event, input, output, options = {}) => {
    return new Promise((resolve, reject) => {
      const ffmpeg = getFFmpegPath();
      const args = ['-i', input, '-y'];

      if (options.startTime != null) args.push('-ss', String(options.startTime));
      if (options.endTime != null) args.push('-to', String(options.endTime));

      // Fade filters
      const filters = [];
      if (options.fadeInDuration > 0) {
        filters.push(`afade=t=in:d=${options.fadeInDuration}`);
      }
      if (options.fadeOutDuration > 0) {
        const duration = (options.endTime || 0) - (options.startTime || 0);
        const fadeStart = duration - options.fadeOutDuration;
        filters.push(`afade=t=out:st=${Math.max(0, fadeStart)}:d=${options.fadeOutDuration}`);
      }
      if (filters.length > 0) args.push('-af', filters.join(','));

      args.push(output);

      const proc = spawn(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stderr = '';

      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', (code) => {
        if (code !== 0) return reject(new Error(`FFmpeg cut failed: ${stderr.slice(-300)}`));
        resolve({ outputPath: output, size: fs.statSync(output).size });
      });

      proc.on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)));
    });
  });

  // ─── Local FFmpeg: extract audio from video ───
  ipcMain.handle('extract-audio', (_event, input, output, format = 'mp3') => {
    return new Promise((resolve, reject) => {
      const ffmpeg = getFFmpegPath();
      const outPath = output || input.replace(/\.[^.]+$/, `.${format}`);
      const args = ['-i', input, '-vn', '-y', outPath];

      const proc = spawn(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stderr = '';

      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', (code) => {
        if (code !== 0) return reject(new Error(`FFmpeg extract failed: ${stderr.slice(-300)}`));
        resolve({ outputPath: outPath, size: fs.statSync(outPath).size });
      });

      proc.on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)));
    });
  });

  // ─── Demucs: setup status ───
  ipcMain.handle('get-setup-status', () => getSetupStatus());

  // ─── Demucs: install ───
  ipcMain.handle('install-demucs', async () => {
    await setupVirtualEnv();
    await installDemucs((pct) => sendProgress('install', pct));
    return { success: true };
  });

  // ─── Demucs: separate audio ───
  ipcMain.handle('separate-audio', (_event, input, output, model = 'htdemucs') => {
    return new Promise((resolve, reject) => {
      const python = getSeparationPython();
      const mlDir = getMlDir();

      fs.mkdirSync(output, { recursive: true });

      const args = ['-m', 'src.separate', '--input', input, '--output', output, '--model', model];

      const proc = spawn(python, args, {
        cwd: mlDir,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stderr = '';
      const stems = [];

      proc.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('PROGRESS:')) {
            const pct = parseInt(trimmed.replace('PROGRESS:', ''), 10);
            if (!isNaN(pct)) sendProgress('separate', pct);
          } else if (trimmed.startsWith('STEM:')) {
            stems.push(trimmed.replace('STEM:', '').trim());
          }
        }
      });

      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', (code) => {
        if (code !== 0) {
          const errorLines = stderr.split('\n').filter((l) => l.includes('ERROR:'));
          const msg = errorLines.length > 0
            ? errorLines.map((l) => l.replace(/.*ERROR:/, '').trim()).join('; ')
            : stderr.trim() || `Process exited with code ${code}`;
          return reject(new Error(msg));
        }

        const result = stems.map((p) => ({
          name: path.parse(p).name,
          path: p,
          size: fs.existsSync(p) ? fs.statSync(p).size : 0,
        }));

        sendProgress('separate', 100);
        resolve({ stems: result });
      });

      proc.on('error', (err) => reject(new Error(`Python error: ${err.message}`)));
    });
  });

  // ─── Local video export ───
  ipcMain.handle('export-video', async (_event, projectData, settings = {}) => {
    const win = BrowserWindow.getFocusedWindow();

    // Ask user for save location
    const ext = settings.format || 'mp4';
    const result = await dialog.showSaveDialog(win, {
      defaultPath: `export.${ext}`,
      filters: [{ name: 'Video', extensions: [ext] }],
    });
    if (result.canceled || !result.filePath) return null;

    const outputPath = result.filePath;
    const ffmpeg = getFFmpegPath();

    // Build FFmpeg args from project data
    const args = ['-y'];

    // For each source clip, add input
    const tracks = projectData.tracks || [];
    for (const track of tracks) {
      for (const clip of track.clips || []) {
        if (clip.sourcePath) {
          args.push('-i', clip.sourcePath);
        }
      }
    }

    // Output settings
    const codec = ext === 'webm' ? 'libvpx-vp9' : 'libx264';
    const crf = { low: 28, medium: 23, high: 18, ultra: 12 }[settings.quality] || 23;

    args.push('-c:v', codec);
    args.push('-crf', String(crf));
    args.push('-r', String(settings.fps || 30));
    args.push('-s', `${settings.width || 1920}x${settings.height || 1080}`);
    args.push('-c:a', 'aac');
    args.push('-b:a', settings.audioBitrate || '256k');
    args.push(outputPath);

    return new Promise((resolve, reject) => {
      const proc = spawn(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stderr = '';

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        const match = data.toString().match(/frame=\s*(\d+)/);
        if (match) {
          const totalFrames = Math.ceil((projectData.duration || 30) * (settings.fps || 30));
          const progress = Math.min(100, Math.round((parseInt(match[1]) / totalFrames) * 100));
          sendProgress('export', progress);
        }
      });

      proc.on('close', (code) => {
        if (code !== 0) return reject(new Error(`Export failed: ${stderr.slice(-300)}`));
        sendProgress('export', 100);
        resolve({ outputPath, size: fs.statSync(outputPath).size });
      });

      proc.on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)));
    });
  });

  // ─── Read file as buffer (for renderer blob creation) ───
  ipcMain.handle('read-file', (_event, filePath) => {
    return fs.readFileSync(filePath);
  });

  // ─── Settings ───
  ipcMain.handle('get-setting', (_event, key) => {
    const store = initStore();
    return store.get(key);
  });

  ipcMain.handle('set-setting', (_event, key, value) => {
    const store = initStore();
    store.set(key, value);
    return true;
  });

  ipcMain.handle('get-all-settings', () => {
    const store = initStore();
    return store.store;
  });
}

module.exports = { registerIpcHandlers };
