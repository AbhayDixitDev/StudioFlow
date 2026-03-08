import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';

// ml/ lives at the monorepo root, two levels up from apps/server/
const ML_DIR = path.resolve(import.meta.dirname, '..', '..', '..', '..', 'ml');

function findPython() {
  if (process.env.PYTHON_CMD) return process.env.PYTHON_CMD;

  // On Windows, spawn('python') can fail with ENOENT even when Python is in PATH.
  // Try common locations.
  if (process.platform === 'win32') {
    const candidates = [
      'python',
      'python3',
      'C:\\Python313\\python.exe',
      'C:\\Python312\\python.exe',
      'C:\\Python311\\python.exe',
      'C:\\Python310\\python.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python313', 'python.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python312', 'python.exe'),
    ];
    for (const cmd of candidates) {
      try {
        if (cmd.includes('\\') && fs.existsSync(cmd)) return cmd;
      } catch { /* skip */ }
    }
  }
  return 'python';
}

const PYTHON_CMD = findPython();

const MODELS = {
  htdemucs: { stems: ['drums', 'bass', 'other', 'vocals'], description: '4-stem separation' },
  htdemucs_6s: { stems: ['drums', 'bass', 'other', 'vocals', 'guitar', 'piano'], description: '6-stem separation' },
  mdx_extra: { stems: ['drums', 'bass', 'other', 'vocals'], description: 'MDX-Net extra quality' },
};

/**
 * Check if Python and Demucs are available.
 */
export async function isAvailable() {
  return new Promise((resolve) => {
    const proc = spawn(PYTHON_CMD, ['-c', 'import demucs; print("ok")'], {
      timeout: 10000,
    });
    let output = '';
    proc.stdout.on('data', (d) => { output += d.toString(); });
    proc.on('close', (code) => resolve(code === 0 && output.includes('ok')));
    proc.on('error', () => resolve(false));
  });
}

/**
 * Return available models.
 */
export function getModels() {
  return MODELS;
}

/**
 * Run audio separation via the Python CLI.
 * @param {string} inputPath - Path to input audio file
 * @param {string} outputDir - Directory for output stems
 * @param {string} model - Model name (htdemucs, htdemucs_6s, mdx_extra)
 * @param {object} [options]
 * @param {function} [options.onProgress] - Called with progress 0-100
 * @param {AbortSignal} [options.signal] - AbortSignal for cancellation
 * @returns {Promise<{stems: Array<{name: string, path: string, size: number}>}>}
 */
export function separate(inputPath, outputDir, model, options = {}) {
  const { onProgress, signal } = options;

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new Error('Separation aborted'));
    }

    const args = [
      '-m', 'src.separate',
      '--input', inputPath,
      '--output', outputDir,
      '--model', model,
    ];

    const proc = spawn(PYTHON_CMD, args, {
      cwd: ML_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    const stems = [];

    // Handle abort signal
    if (signal) {
      const onAbort = () => {
        proc.kill('SIGTERM');
        reject(new Error('Separation aborted'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
      proc.on('close', () => signal.removeEventListener('abort', onAbort));
    }

    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('PROGRESS:')) {
          const pct = parseInt(trimmed.replace('PROGRESS:', ''), 10);
          if (!isNaN(pct) && onProgress) {
            onProgress(pct);
          }
        } else if (trimmed.startsWith('STEM:')) {
          const stemPath = trimmed.replace('STEM:', '').trim();
          stems.push(stemPath);
        }
      }
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        // Extract ERROR: lines from stderr
        const errorLines = stderr
          .split('\n')
          .filter((l) => l.includes('ERROR:'))
          .map((l) => l.replace(/.*ERROR:/, '').trim());

        const msg = errorLines.length > 0
          ? errorLines.join('; ')
          : stderr.trim() || `Python process exited with code ${code}`;

        return reject(new Error(msg));
      }

      // Build result with file sizes
      const result = stems.map((stemPath) => {
        const name = path.parse(stemPath).name;
        let size = 0;
        try {
          size = fs.statSync(stemPath).size;
        } catch {
          // File might not exist if there was a partial failure
        }
        return { name, path: stemPath, size };
      });

      resolve({ stems: result });
    });
  });
}
