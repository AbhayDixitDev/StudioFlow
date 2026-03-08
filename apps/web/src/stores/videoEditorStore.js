import { create } from 'zustand';
import TimelineEngine from '../features/video-editor/engine/TimelineEngine.js';
import ClipManager from '../features/video-editor/engine/ClipManager.js';
import PlaybackController from '../features/video-editor/engine/PlaybackController.js';
import SelectionManager from '../features/video-editor/engine/SelectionManager.js';
import UndoManager, {
  AddClipCommand,
  RemoveClipCommand,
  MoveClipCommand,
  TrimClipCommand,
  SplitClipCommand,
  UpdatePropertyCommand,
  DuplicateClipCommand,
} from '../features/video-editor/engine/UndoManager.js';
import SnapEngine from '../features/video-editor/engine/SnapEngine.js';
import { saveProject as saveProjectLocal, loadProject as loadProjectLocal, saveBlob } from '../features/video-editor/engine/localPersistence.js';

let mediaIdCounter = 1;
let saveTimer = null;
let saving = false;

const engine = new TimelineEngine();
const clipManager = new ClipManager(engine);
const playback = new PlaybackController(engine);
const selection = new SelectionManager(engine);
const undo = new UndoManager(engine);
const snap = new SnapEngine(engine);

const useVideoEditorStore = create((set) => {
  // Subscribe to engine events
  // Local save helper (saves to the current local project)
  function triggerLocalSave() {
    try {
      const s = useVideoEditorStore.getState();
      if (s.localProjectId) {
        saveProjectLocal(s.localProjectId, engine, s.mediaItems);
      }
    } catch {}
  }

  engine.on('tracksChanged', (tracks) => {
    set({ tracks: tracks.map((t) => ({ ...t, clips: [...t.clips] })) });
    try { useVideoEditorStore.getState().triggerAutoSave?.(); } catch {}
    triggerLocalSave();
  });

  engine.on('clipsChanged', () => {
    set({ tracks: engine.tracks.map((t) => ({ ...t, clips: [...t.clips] })) });
    try { useVideoEditorStore.getState().triggerAutoSave?.(); } catch {}
    triggerLocalSave();
  });

  engine.on('timeupdate', (time) => {
    set({ currentTime: time });
  });

  engine.on('seek', (time) => {
    set({ currentTime: time });
  });

  engine.on('play', () => {
    set({ playing: true });
  });

  engine.on('pause', () => {
    set({ playing: false });
  });

  engine.on('speedChanged', (speed) => {
    set({ speed });
  });

  engine.on('selectionChanged', (sel) => {
    set({ selectedClipIds: sel.clipIds, selectedTrackId: sel.trackId });
  });

  engine.on('historyChanged', ({ canUndo: cu, canRedo: cr }) => {
    set({ canUndo: cu, canRedo: cr });
  });

  engine.on('settingsChanged', (settings) => {
    set({ projectSettings: { ...settings } });
    triggerLocalSave();
  });

  engine.on('markersChanged', (markers) => {
    set({ markers: [...markers] });
    triggerLocalSave();
  });

  return {
    // State
    tracks: [],
    currentTime: 0,
    playing: false,
    speed: 1,
    duration: 0,
    selectedClipIds: [],
    selectedTrackId: null,
    canUndo: false,
    canRedo: false,
    pixelsPerSecond: 50,
    projectSettings: engine.projectSettings,
    markers: [],
    mediaItems: [],

    // Engine accessors
    getEngine: () => engine,
    getSnapEngine: () => snap,

    // Track actions
    addTrack: (type, name) => engine.addTrack(type, name),
    removeTrack: (trackId) => engine.removeTrack(trackId),
    reorderTrack: (trackId, newIndex) => engine.reorderTrack(trackId, newIndex),
    lockTrack: (trackId, locked) => engine.lockTrack(trackId, locked),
    muteTrack: (trackId, muted) => engine.muteTrack(trackId, muted),
    soloTrack: (trackId, solo) => engine.soloTrack(trackId, solo),
    setTrackVisibility: (trackId, visible) => engine.setTrackVisibility(trackId, visible),

    // Clip actions (with undo)
    addClip: (trackId, clipData) => {
      undo.execute(new AddClipCommand(clipManager, trackId, clipData));
    },
    removeClip: (clipId) => {
      undo.execute(new RemoveClipCommand(clipManager, clipId));
    },
    moveClip: (clipId, newTrackId, newStartTime) => {
      undo.execute(new MoveClipCommand(clipManager, clipId, newTrackId, newStartTime));
    },
    trimClip: (clipId, side, newTime) => {
      undo.execute(new TrimClipCommand(clipManager, clipId, side, newTime));
    },
    splitClipAtPlayhead: (clipId) => {
      undo.execute(new SplitClipCommand(clipManager, clipId, engine.currentTime));
    },
    duplicateClip: (clipId) => {
      undo.execute(new DuplicateClipCommand(clipManager, clipId));
    },
    updateClipProperty: (clipId, property, value) => {
      undo.execute(new UpdatePropertyCommand(clipManager, clipId, property, value));
    },

    // Playback actions
    play: () => playback.play(),
    pause: () => playback.pause(),
    togglePlayPause: () => playback.togglePlayPause(),
    seek: (time) => playback.seek(time),
    setSpeed: (speed) => playback.setSpeed(speed),
    skipToStart: () => playback.skipToStart(),
    skipToEnd: () => playback.skipToEnd(),
    stepFrame: (dir) => playback.stepFrame(dir),

    // Selection actions
    selectClip: (id, add) => selection.selectClip(id, add),
    deselectClip: (id) => selection.deselectClip(id),
    selectTrack: (id) => selection.selectTrack(id),
    clearSelection: () => selection.clearSelection(),
    isClipSelected: (id) => selection.isClipSelected(id),

    // Undo/Redo
    undo: () => undo.undo(),
    redo: () => undo.redo(),

    // Zoom
    setPixelsPerSecond: (pps) => set({ pixelsPerSecond: Math.max(10, Math.min(200, pps)) }),
    zoomIn: () => set((s) => ({ pixelsPerSecond: Math.min(200, s.pixelsPerSecond * 1.5) })),
    zoomOut: () => set((s) => ({ pixelsPerSecond: Math.max(10, s.pixelsPerSecond / 1.5) })),

    // Project (server-side)
    projectId: null,
    // Local project ID
    localProjectId: null,
    saveStatus: 'idle', // idle | saving | saved | error
    loadProject: (data) => {
      if (data.projectId) set({ projectId: data.projectId });
      engine.loadProject(data);
    },
    getVisibleClipsAtTime: (time) => engine.getVisibleClipsAtTime(time),

    // Auto-save
    triggerAutoSave: () => {
      const state = useVideoEditorStore.getState();
      if (!state.projectId || state.playing) return;
      const token = localStorage.getItem('accessToken');
      if (!token) return; // Skip save if not logged in
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        const s = useVideoEditorStore.getState();
        if (saving || !s.projectId) return;
        const t = localStorage.getItem('accessToken');
        if (!t) return;
        saving = true;
        set({ saveStatus: 'saving' });
        fetch(`/api/video/projects/${s.projectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${t}`,
          },
          body: JSON.stringify({
            tracks: engine.tracks,
            duration: engine.duration,
            projectSettings: engine.projectSettings,
            mediaFiles: s.mediaItems,
          }),
        })
          .then((res) => {
            set({ saveStatus: res.ok ? 'saved' : 'error' });
          })
          .catch(() => set({ saveStatus: 'error' }))
          .finally(() => { saving = false; });
      }, 3000);
    },

    // Media bin
    addMediaItem: (item) => {
      const id = `media_${mediaIdCounter++}`;
      const persistKey = `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const newItem = { ...item, id, persistKey };
      set((s) => ({ mediaItems: [...s.mediaItems, newItem] }));
      // Save blob to IndexedDB
      if (item.file) {
        saveBlob(persistKey, item.file).catch(() => {});
      }
      triggerLocalSave();
    },
    removeMediaItem: (id) => {
      set((s) => ({
        mediaItems: s.mediaItems.filter((m) => m.id !== id),
      }));
      triggerLocalSave();
    },

    // Clipboard
    clipboardClip: null,
    copyClip: (clipId) => {
      const clip = clipManager.getClipById(clipId);
      if (clip) set({ clipboardClip: { ...clip, transform: { ...clip.transform }, effects: [...clip.effects] } });
    },
    pasteClip: (trackId, startTime) => {
      const state = useVideoEditorStore.getState();
      if (!state.clipboardClip) return;
      const clipData = { ...state.clipboardClip, startTime: startTime || engine.currentTime };
      delete clipData.id;
      undo.execute(new AddClipCommand(clipManager, trackId, clipData));
    },

    // Text templates
    addTextFromTemplate: (template) => {
      // Find or create a text track
      let textTrack = engine.tracks.find((t) => t.type === 'text');
      if (!textTrack) {
        textTrack = engine.addTrack('text', 'Text');
      }
      const clipData = {
        type: 'text',
        name: template.name,
        startTime: engine.currentTime,
        duration: 5,
        text: { ...template.text },
        transform: template.transform ? { ...template.transform } : { x: 0, y: 0, scale: 1, rotation: 0 },
        opacity: template.opacity != null ? template.opacity : 1,
      };
      undo.execute(new AddClipCommand(clipManager, textTrack.id, clipData));
    },

    // Background music
    addBackgroundMusic: ({ name, url }) => {
      const bgTrack = engine.addTrack('audio', 'BG Music');
      const projectDuration = engine.duration || 30;
      undo.execute(
        new AddClipCommand(clipManager, bgTrack.id, {
          type: 'audio',
          name: name || 'Background Music',
          startTime: 0,
          duration: projectDuration,
          sourcePath: url,
          volume: 0.3,
          fadeIn: 1,
          fadeOut: 2,
          loop: true,
        })
      );
    },

    // Aspect ratio (Phase 186)
    setAspectRatio: (ratio) => engine.setAspectRatio(ratio),

    // Markers (Phase 187)
    addMarker: (time, name) => engine.addMarker(time, name),
    removeMarker: (id) => engine.removeMarker(id),
    seekToNextMarker: () => {
      const m = engine.getNextMarker(engine.currentTime);
      if (m) playback.seek(m.time);
    },
    seekToPrevMarker: () => {
      const m = engine.getPrevMarker(engine.currentTime);
      if (m) playback.seek(m.time);
    },

    // Filter presets (Phase 184)
    applyFilterPreset: (clipId, preset) => {
      const clip = clipManager.getClipById(clipId);
      if (!clip) return;
      const effects = preset.effects.map((e) => ({
        id: e.id,
        enabled: true,
        values: { ...e.values },
        keyframes: [],
      }));
      undo.execute(new UpdatePropertyCommand(clipManager, clipId, 'effects', effects));
      undo.execute(new UpdatePropertyCommand(clipManager, clipId, 'filter', preset.id));
    },

    // Project templates (Phase 189)
    loadTemplate: (template) => {
      engine.projectSettings = { ...engine.projectSettings, ...template.settings };
      engine.tracks = [];
      engine.markers = [];
      if (template.tracks) {
        for (const t of template.tracks) {
          engine.addTrack(t.type, t.name);
        }
      }
      engine.emit('settingsChanged', engine.projectSettings);
      engine.emit('tracksChanged', engine.tracks);
      set({ projectId: null, projectSettings: { ...engine.projectSettings }, markers: [] });
    },

    // Open a local project by ID (settings = {aspectRatio, width, height, fps} for new projects)
    openLocalProject: async (projectId, settings) => {
      const data = await loadProjectLocal(projectId);
      if (!data) {
        // New project — apply settings if provided
        if (settings) {
          engine.projectSettings = { ...engine.projectSettings, ...settings };
          engine.emit('settingsChanged', engine.projectSettings);
        }
        set({ localProjectId: projectId, mediaItems: [], projectSettings: { ...engine.projectSettings } });
        return;
      }
      engine.loadProject({
        tracks: data.tracks,
        duration: data.duration,
        projectSettings: data.projectSettings,
        markers: data.markers,
      });
      set({
        localProjectId: projectId,
        mediaItems: data.mediaItems,
        projectSettings: { ...engine.projectSettings },
        markers: [...engine.markers],
      });
    },

    // Close current project (reset editor)
    closeProject: () => {
      engine.tracks = [];
      engine.markers = [];
      engine.currentTime = 0;
      engine.duration = 0;
      engine.projectSettings = { width: 1920, height: 1080, fps: 30, aspectRatio: '16:9' };
      engine.emit('tracksChanged', engine.tracks);
      engine.emit('settingsChanged', engine.projectSettings);
      set({
        localProjectId: null,
        projectId: null,
        mediaItems: [],
        currentTime: 0,
        markers: [],
        projectSettings: { ...engine.projectSettings },
      });
    },

    // Cleanup
    destroy: () => playback.destroy(),
  };
});

export default useVideoEditorStore;
