import fs from 'fs';
import path from 'path';
import { DIRS } from '../config/storage.js';

export function saveFile(userId, file, category = 'uploads') {
  const baseDir = DIRS[category] || DIRS.uploads;
  const userDir = path.join(baseDir, userId);
  fs.mkdirSync(userDir, { recursive: true });

  const destPath = path.join(userDir, path.basename(file.path || file.filename));

  // If file is already in the right place (multer disk storage), just return
  if (file.path && path.resolve(file.path).startsWith(path.resolve(userDir))) {
    return file.path;
  }

  // Otherwise move it
  if (file.path) {
    fs.renameSync(file.path, destPath);
  }

  return destPath;
}

export function getFilePath(userId, filename, category = 'uploads') {
  const baseDir = DIRS[category] || DIRS.uploads;
  return path.join(baseDir, userId, filename);
}

export function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function getFileStream(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.createReadStream(filePath);
}

export function cleanupOldFiles(category, maxAgeHours = 24) {
  const baseDir = DIRS[category];
  if (!baseDir || !fs.existsSync(baseDir)) return 0;

  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
  let deleted = 0;

  function walkAndClean(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkAndClean(fullPath);
        // Remove empty directories
        const remaining = fs.readdirSync(fullPath);
        if (remaining.length === 0) fs.rmdirSync(fullPath);
      } else {
        const stat = fs.statSync(fullPath);
        if (stat.mtimeMs < cutoff) {
          fs.unlinkSync(fullPath);
          deleted++;
        }
      }
    }
  }

  walkAndClean(baseDir);
  return deleted;
}

export function getDirectorySize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;

  let total = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += getDirectorySize(fullPath);
    } else {
      total += fs.statSync(fullPath).size;
    }
  }

  return total;
}
