/**
 * Copies the web app build output into the desktop app's renderer directory.
 * Run before electron-builder packaging.
 */
const fs = require('fs');
const path = require('path');

const webDist = path.resolve(__dirname, '..', '..', 'web', 'dist');
const rendererDir = path.resolve(__dirname, '..', 'renderer');

if (!fs.existsSync(webDist)) {
  console.error('Web app not built yet. Run: npm run build --workspace=apps/web');
  process.exit(1);
}

// Remove old renderer directory
if (fs.existsSync(rendererDir)) {
  fs.rmSync(rendererDir, { recursive: true });
}

// Copy web dist to renderer
fs.cpSync(webDist, rendererDir, { recursive: true });
console.log(`Copied web build to ${rendererDir}`);
