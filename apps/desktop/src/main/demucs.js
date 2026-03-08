const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile, spawn } = require('child_process');

const isDev = !app.isPackaged;

function getAppDataDir() {
  return path.join(app.getPath('userData'), 'demucs-env');
}

function getVenvPythonPath() {
  const venvDir = getAppDataDir();
  if (process.platform === 'win32') {
    return path.join(venvDir, 'Scripts', 'python.exe');
  }
  return path.join(venvDir, 'bin', 'python');
}

function getSystemPython() {
  return process.platform === 'win32' ? 'python' : 'python3';
}

/**
 * Check if Python is installed on the system.
 */
function checkPythonInstalled() {
  return new Promise((resolve) => {
    execFile(getSystemPython(), ['--version'], { timeout: 5000 }, (err, stdout) => {
      if (err) return resolve(false);
      resolve(stdout.includes('Python'));
    });
  });
}

/**
 * Check if Demucs is installed in the venv.
 */
function checkDemucsInstalled() {
  const venvPython = getVenvPythonPath();
  if (!fs.existsSync(venvPython)) return Promise.resolve(false);

  return new Promise((resolve) => {
    execFile(venvPython, ['-c', 'import demucs; print("ok")'], { timeout: 10000 }, (err, stdout) => {
      resolve(!err && stdout.includes('ok'));
    });
  });
}

/**
 * Check if virtual environment exists.
 */
function venvExists() {
  return fs.existsSync(getVenvPythonPath());
}

/**
 * Create a Python virtual environment.
 */
function setupVirtualEnv() {
  return new Promise((resolve, reject) => {
    const venvDir = getAppDataDir();
    fs.mkdirSync(venvDir, { recursive: true });

    execFile(getSystemPython(), ['-m', 'venv', venvDir], { timeout: 60000 }, (err) => {
      if (err) return reject(new Error(`Failed to create venv: ${err.message}`));
      resolve(venvDir);
    });
  });
}

/**
 * Install Demucs and dependencies in the venv.
 * Returns a promise. Sends progress via onProgress callback.
 */
function installDemucs(onProgress) {
  return new Promise((resolve, reject) => {
    const venvPython = getVenvPythonPath();

    if (!fs.existsSync(venvPython)) {
      return reject(new Error('Virtual environment not found. Run setup first.'));
    }

    const proc = spawn(venvPython, ['-m', 'pip', 'install', 'demucs', 'soundfile', 'psutil'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
      if (onProgress) {
        // Count collected/installed lines as rough progress
        const lines = output.split('\n').length;
        onProgress(Math.min(lines * 2, 90));
      }
    });

    proc.stderr.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`pip install failed (exit ${code}): ${output.slice(-500)}`));
      }
      if (onProgress) onProgress(100);
      resolve();
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to run pip: ${err.message}`));
    });
  });
}

/**
 * Get full setup status.
 */
async function getSetupStatus() {
  const pythonInstalled = await checkPythonInstalled();
  const hasVenv = venvExists();
  const demucsInstalled = hasVenv ? await checkDemucsInstalled() : false;

  return {
    pythonInstalled,
    venvExists: hasVenv,
    demucsInstalled,
    venvPath: getAppDataDir(),
    ready: pythonInstalled && demucsInstalled,
  };
}

/**
 * Get the ML project directory.
 */
function getMlDir() {
  if (isDev) {
    return path.resolve(__dirname, '..', '..', '..', '..', 'ml');
  }
  return path.join(process.resourcesPath, 'ml');
}

/**
 * Get the Python executable to use for separation.
 */
function getSeparationPython() {
  if (venvExists()) {
    return getVenvPythonPath();
  }
  return getSystemPython();
}

module.exports = {
  checkPythonInstalled,
  checkDemucsInstalled,
  setupVirtualEnv,
  installDemucs,
  getSetupStatus,
  getMlDir,
  getSeparationPython,
};
