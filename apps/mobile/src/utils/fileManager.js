import { File, Directory, Paths } from 'expo-file-system/next';

const DOWNLOADS_DIR = new Directory(Paths.document, 'downloads');
const ALL_DIR_NAMES = ['downloads', 'stems', 'converted', 'cut', 'processed'];

export function getDownloadedFiles() {
  DOWNLOADS_DIR.create({ intermediates: true, idempotent: true });
  return DOWNLOADS_DIR.list()
    .filter((entry) => entry instanceof File)
    .map((f) => f.name);
}

export function deleteDownloadedFile(filename) {
  const file = new File(DOWNLOADS_DIR, filename);
  if (file.exists) file.delete();
}

export async function clearDownloads() {
  for (const name of ALL_DIR_NAMES) {
    const dir = new Directory(Paths.document, name);
    if (dir.exists) dir.delete();
  }
  DOWNLOADS_DIR.create({ intermediates: true, idempotent: true });
}

export async function getCacheSize() {
  try {
    let total = 0;
    for (const name of ALL_DIR_NAMES) {
      const dir = new Directory(Paths.document, name);
      if (!dir.exists) continue;
      const entries = dir.list();
      for (const entry of entries) {
        if (entry instanceof File) {
          total += entry.size;
        }
      }
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
