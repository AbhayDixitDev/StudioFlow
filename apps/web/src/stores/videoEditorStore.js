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
  engine.on('tracksChanged', (tracks) => {
    set({ tracks: tracks.map((t) => ({ ...t, clips: [...t.clips] })) });
    // Trigger auto-save on track changes
    try { useVideoEditorStore.getState().triggerAutoSave?.(); } catch {}
  });

  engine.on('clipsChanged', () => {
    set({ tracks: engine.tracks.map((t) => ({ ...t, clips: [...t.clips] })) });
    try { useVideoEditorStore.getState().triggerAutoSave?.(); } catch {}
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

    // Project
    projectId: null,
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
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        const s = useVideoEditorStore.getState();
        if (saving || !s.projectId) return;
        saving = true;
        set({ saveStatus: 'saving' });
        fetch(`/api/video/projects/${s.projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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
    addMediaItem: (item) =>
      set((s) => ({
        mediaItems: [...s.mediaItems, { ...item, id: `media_${mediaIdCounter++}` }],
      })),
    removeMediaItem: (id) =>
      set((s) => ({
        mediaItems: s.mediaItems.filter((m) => m.id !== id),
      })),

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

    // Cleanup
    destroy: () => playback.destroy(),
  };
});

export default useVideoEditorStore;
