/**
 * Local persistence for video editor — multi-project support.
 * - IndexedDB "projects" store: project state JSON keyed by projectId
 * - IndexedDB "blobs" store: media file blobs keyed by persistKey
 * - localStorage "ve-projects-index": lightweight list of project metadata
 */

const DB_NAME = 'video-editor';
const DB_VERSION = 2;
const PROJECTS_STORE = 'projects';
const BLOBS_STORE = 'blobs';
const INDEX_KEY = 've-projects-index';

// ─── IndexedDB ───

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(BLOBS_STORE)) {
        db.createObjectStore(BLOBS_STORE);
      }
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(store, key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Projects index (lightweight metadata in localStorage) ───

function readIndex() {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY)) || [];
  } catch {
    return [];
  }
}

function writeIndex(list) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(list));
}

/** Get list of all projects (metadata only). */
export function getProjectsList() {
  return readIndex().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

/** Create a new empty project. Returns projectId. */
export function createProject(name, options = {}) {
  const id = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const meta = {
    id,
    name: name || 'Untitled Project',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    aspectRatio: options.aspectRatio || '16:9',
    width: options.width || 1920,
    height: options.height || 1080,
    fps: options.fps || 30,
    trackCount: 0,
  };
  const list = readIndex();
  list.push(meta);
  writeIndex(list);
  return meta;
}

/** Delete a project and its media blobs. */
export async function deleteProject(projectId) {
  // Remove from index
  const list = readIndex().filter((p) => p.id !== projectId);
  writeIndex(list);

  // Load project to find blob keys, then delete them
  const data = await idbGet(PROJECTS_STORE, projectId);
  if (data?.mediaItems) {
    for (const m of data.mediaItems) {
      const key = m.persistKey || m.id;
      await idbDelete(BLOBS_STORE, key).catch(() => {});
    }
  }
  await idbDelete(PROJECTS_STORE, projectId);
}

/** Rename a project. */
export function renameProject(projectId, newName) {
  const list = readIndex();
  const proj = list.find((p) => p.id === projectId);
  if (proj) {
    proj.name = newName;
    writeIndex(list);
  }
}

// ─── Save / Load project data ───

let _saveTimer = null;

/**
 * Save full project state to IndexedDB (debounced 1s).
 */
export function saveProject(projectId, engine, mediaItems) {
  if (!projectId) return;
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    try {
      const tracks = engine.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) => {
          const clip = { ...c };
          if (clip._persistKey) {
            clip.sourcePath = `idb://${clip._persistKey}`;
          }
          return clip;
        }),
      }));

      const projectData = {
        tracks,
        duration: engine.duration,
        projectSettings: { ...engine.projectSettings },
        markers: [...engine.markers],
        mediaItems: mediaItems.map((m) => ({
          id: m.id,
          name: m.name,
          type: m.type,
          duration: m.duration,
          persistKey: m.persistKey || m.id,
        })),
        savedAt: Date.now(),
      };

      await idbPut(PROJECTS_STORE, projectId, projectData);

      // Update index metadata
      const list = readIndex();
      const meta = list.find((p) => p.id === projectId);
      if (meta) {
        meta.updatedAt = Date.now();
        meta.trackCount = engine.tracks.length;
        meta.aspectRatio = engine.projectSettings.aspectRatio;
        meta.width = engine.projectSettings.width;
        meta.height = engine.projectSettings.height;
        writeIndex(list);
      }

      // Save unsaved blobs
      for (const item of mediaItems) {
        if (item.file && !item._blobSaved) {
          const key = item.persistKey || item.id;
          await saveBlob(key, item.file);
          item._blobSaved = true;
        }
      }
    } catch (e) {
      console.warn('Failed to save project:', e);
    }
  }, 1000);
}

/**
 * Load a project from IndexedDB. Returns full state or null.
 */
export async function loadProject(projectId) {
  try {
    const data = await idbGet(PROJECTS_STORE, projectId);
    if (!data || !data.tracks) return null;

    // Restore media blobs → object URLs
    const mediaItems = [];
    const urlMap = {};

    for (const meta of data.mediaItems || []) {
      const key = meta.persistKey || meta.id;
      const blob = await loadBlob(key);
      if (blob) {
        const url = URL.createObjectURL(blob);
        urlMap[key] = url;
        mediaItems.push({
          ...meta,
          url,
          file: blob,
          persistKey: key,
          _blobSaved: true,
        });
      }
    }

    // Remap idb:// URLs in clips
    const tracks = data.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        const clip = { ...c };
        if (clip.sourcePath && clip.sourcePath.startsWith('idb://')) {
          const key = clip.sourcePath.replace('idb://', '');
          if (urlMap[key]) {
            clip.sourcePath = urlMap[key];
            clip._persistKey = key;
          }
        }
        return clip;
      }),
    }));

    return {
      tracks,
      duration: data.duration,
      projectSettings: data.projectSettings,
      markers: data.markers || [],
      mediaItems,
    };
  } catch (e) {
    console.warn('Failed to load project:', e);
    return null;
  }
}

// ─── Blob helpers (exported for store) ───

export async function saveBlob(key, blob) {
  await idbPut(BLOBS_STORE, key, blob);
}

export async function loadBlob(key) {
  return idbGet(BLOBS_STORE, key);
}

export async function deleteBlob(key) {
  return idbDelete(BLOBS_STORE, key);
}

// ─── Migration: move old single-project data to new format ───

export async function migrateOldProject() {
  const old = localStorage.getItem('video-editor-project');
  if (!old) return;
  try {
    const data = JSON.parse(old);
    if (!data || !data.tracks) return;
    const meta = createProject('Migrated Project');
    await idbPut(PROJECTS_STORE, meta.id, data);
    localStorage.removeItem('video-editor-project');
  } catch {
    localStorage.removeItem('video-editor-project');
  }
}
