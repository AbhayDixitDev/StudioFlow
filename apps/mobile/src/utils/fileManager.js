import * as FileSystem from 'expo-file-system';
import { getBaseURLSync } from '../services/api';

const DOWNLOADS_DIR = FileSystem.documentDirectory + 'downloads/';

export async function ensureDownloadDir() {
  const info = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
  }
}

export async function downloadFile(serverPath, filename) {
  await ensureDownloadDir();
  const base = getBaseURLSync().replace('/api', '');
  const url = `${base}${serverPath}`;
  const localUri = DOWNLOADS_DIR + filename;

  const result = await FileSystem.downloadAsync(url, localUri);
  return result.uri;
}

export async function downloadFromURL(url, filename) {
  await ensureDownloadDir();
  const localUri = DOWNLOADS_DIR + filename;
  const result = await FileSystem.downloadAsync(url, localUri);
  return result.uri;
}

export async function getDownloadedFiles() {
  await ensureDownloadDir();
  return await FileSystem.readDirectoryAsync(DOWNLOADS_DIR);
}

export async function deleteDownloadedFile(filename) {
  const uri = DOWNLOADS_DIR + filename;
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

export async function clearDownloads() {
  await FileSystem.deleteAsync(DOWNLOADS_DIR, { idempotent: true });
  await ensureDownloadDir();
}

export async function getCacheSize() {
  try {
    await ensureDownloadDir();
    const files = await FileSystem.readDirectoryAsync(DOWNLOADS_DIR);
    let total = 0;
    for (const file of files) {
      const info = await FileSystem.getInfoAsync(DOWNLOADS_DIR + file);
      if (info.exists && info.size) total += info.size;
    }
    return total;
  } catch {
    return 0;
  }
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
