import { mkdirSync } from 'fs';
import path from 'path';
import { env } from './env.js';

const BASE_DIR = path.resolve(env.UPLOAD_DIR, '..');

export const DIRS = {
  uploads: path.resolve(BASE_DIR, 'uploads'),
  outputs: path.resolve(BASE_DIR, 'outputs'),
  converted: path.resolve(BASE_DIR, 'converted'),
  stems: path.resolve(BASE_DIR, 'stems'),
  cut: path.resolve(BASE_DIR, 'cut'),
  exports: path.resolve(BASE_DIR, 'exports'),
  thumbnails: path.resolve(BASE_DIR, 'thumbnails'),
};

export function ensureDirectories() {
  Object.values(DIRS).forEach((dir) => {
    mkdirSync(dir, { recursive: true });
  });
}

export function getUploadPath(userId) {
  const dir = path.join(DIRS.uploads, userId);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getOutputPath(userId, jobId) {
  const dir = path.join(DIRS.outputs, userId, jobId);
  mkdirSync(dir, { recursive: true });
  return dir;
}
