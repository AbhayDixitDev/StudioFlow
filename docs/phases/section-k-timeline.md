# Section K: Video Editor - Timeline Engine (Phases 111-125)

## Progress Checklist
- [x] Phase 111 - TimelineEngine Class (core state, events)
- [x] Phase 112 - Track Management (add, remove, reorder tracks)
- [x] Phase 113 - Clip Management (ClipManager: add, move, trim, split)
- [x] Phase 114 - PlaybackController (play, pause, seek, rAF loop)
- [x] Phase 115 - Selection Manager (single/multi select)
- [x] Phase 116 - UndoManager (command pattern, undo/redo)
- [x] Phase 117 - SnapEngine (magnetic snap to edges)
- [x] Phase 118 - Video Editor Zustand Store (React bridge)
- [x] Phase 119 - Timeline Container (scrollable, tracks, ruler)
- [x] Phase 120 - TimeRuler (time markers, click-to-seek)
- [x] Phase 121 - Playhead (draggable current-time line)
- [x] Phase 122 - TimelineTrack (single track row, drop target)
- [x] Phase 123 - TimelineClip (draggable, resizable block)
- [x] Phase 124 - VideoPreview (canvas compositor)
- [x] Phase 125 - PreviewControls (play/pause, speed, fullscreen)

---

## Phase 111 - TimelineEngine Class
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/engine/TimelineEngine.ts`:
   - Core state: tracks array, currentTime, playing, speed, duration
   - Event emitter pattern (on, off, emit)
   - `getState()`: return serializable snapshot
   - `loadProject(data)`: hydrate from saved project data
   - `toJSON()`: serialize for saving

---

## Phase 112 - Track Management
**Status:** Pending

### Tasks:
1. Add track methods to TimelineEngine:
   - `addTrack(type, name?)`: create new track, assign unique ID, return track
   - `removeTrack(trackId)`: remove track and all its clips
   - `reorderTrack(trackId, newIndex)`: move track up/down in stack
   - `lockTrack(trackId, locked)`: prevent editing on locked tracks
   - `setTrackVisibility(trackId, visible)`: show/hide track
   - Emit 'tracksChanged' event after any modification

---

## Phase 113 - Clip Management
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/engine/ClipManager.ts`:
   - `addClip(trackId, clipData)`: create clip with unique ID, validate placement
   - `removeClip(clipId)`: remove clip from its track
   - `moveClip(clipId, newTrackId, newStartTime)`: move clip between tracks/positions
   - `trimClip(clipId, side, newTime)`: trim start or end of clip
   - `splitClip(clipId, atTime)`: split into two clips at given time
   - `duplicateClip(clipId)`: create copy at playhead or after original
   - `getClipById(clipId)`: find clip across all tracks
   - `getVisibleClipsAtTime(time)`: get all clips visible at given time
   - Collision detection: prevent overlaps on video tracks

---

## Phase 114 - PlaybackController
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/engine/PlaybackController.ts`:
   - `play()`: start rAF loop, emit 'play' event
   - `pause()`: stop rAF loop, emit 'pause' event
   - `seek(time)`: set currentTime, emit 'seek' event
   - `setSpeed(speed)`: change playback speed (0.25x - 4x)
   - Internal tick: advance time by delta * speed each frame
   - Stop at end of timeline duration
   - Emit 'timeupdate' every frame with current time

---

## Phase 115 - Selection Manager
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/engine/SelectionManager.ts`:
   - `selectClip(clipId, addToSelection)`: single or multi-select
   - `deselectClip(clipId)`: remove from selection
   - `selectTrack(trackId)`: select a track
   - `clearSelection()`: deselect everything
   - `isClipSelected(clipId)`: check if selected
   - `getSelectedClips()`: return array of selected clips
   - Emit 'selectionChanged' event

---

## Phase 116 - UndoManager
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/engine/UndoManager.ts`:
   - Command interface: { execute(), undo(), description }
   - `execute(command)`: run command, push to undo stack, clear redo stack
   - `undo()`: pop from undo, call undo(), push to redo
   - `redo()`: pop from redo, call execute(), push to undo
   - `canUndo()`, `canRedo()`: check stack state
   - Max history: 100 commands
   - Concrete commands: MoveClipCommand, TrimClipCommand, AddClipCommand, RemoveClipCommand, SplitClipCommand

---

## Phase 117 - SnapEngine
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/engine/SnapEngine.ts`:
   - `enabled`: toggle snapping on/off
   - `snapThreshold`: pixels (default 10)
   - `getSnapPoints(excludeClipId?)`: collect all clip edges + playhead position
   - `snap(proposedTime, pixelsPerSecond)`: return snapped time if within threshold
   - Visual feedback: return snap indicator position for UI

---

## Phase 118 - Video Editor Zustand Store
**Status:** Pending

### Tasks:
1. Create `apps/web/src/stores/videoEditorStore.ts`:
   - Instantiate TimelineEngine
   - Subscribe to all engine events
   - Expose React-friendly state: tracks, currentTime, playing, selectedClipIds, canUndo, canRedo
   - Expose actions: addTrack, addClip, removeClip, moveClip, play, pause, seek, undo, redo
   - All actions delegate to engine methods

---

## Phase 119 - Timeline Container
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/Timeline/Timeline.tsx`:
   - Scrollable container (horizontal + vertical scroll)
   - Track lane headers on left (track name, type icon, lock, mute, visibility)
   - Track lanes on right (where clips are rendered)
   - TimeRuler at top
   - Playhead overlay
   - Zoom controls (affect pixelsPerSecond)
   - Drop target for media from MediaBin

---

## Phase 120 - TimeRuler
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/Timeline/TimeRuler.tsx`:
   - Time markers at regular intervals (auto-adjust based on zoom)
   - Major markers: every second/5s/10s/30s/1min (zoom-dependent)
   - Minor tick marks between major markers
   - Click on ruler to seek to that time
   - Formatted time labels

---

## Phase 121 - Playhead
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/Timeline/Playhead.tsx`:
   - Vertical line spanning all tracks
   - Triangle handle at top (in ruler area)
   - Draggable: drag to scrub through timeline
   - Position: currentTime * pixelsPerSecond
   - Accent color (cyan)

---

## Phase 122 - TimelineTrack
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/Timeline/TimelineTrack.tsx`:
   - Single horizontal row representing one track
   - Background color based on track type (video=blue, audio=green, text=purple, image=orange)
   - Renders TimelineClip components for each clip in track
   - Drop target: accept clips from MediaBin or other tracks
   - Context menu: add track above/below, delete track

---

## Phase 123 - TimelineClip
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/Timeline/TimelineClip.tsx`:
   - Rectangular block positioned at clip.startTime * pixelsPerSecond
   - Width: clip.duration * pixelsPerSecond
   - Draggable: move along timeline or between tracks
   - Resizable: trim handles on left/right edges
   - Content: clip name, thumbnail strip (video), waveform (audio), text preview (text)
   - Selected state: accent border + handles visible
   - Context menu: split, duplicate, delete, properties

---

## Phase 124 - VideoPreview
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/Preview/VideoPreview.tsx`:
   - Canvas element maintaining project aspect ratio (16:9, 9:16, etc.)
   - Render composited frame at currentTime:
     - Query visible clips at currentTime
     - Draw each clip layer (video frames, images, text)
     - Apply transforms and effects
   - Re-render on timeupdate events
   - Black background for empty areas

---

## Phase 125 - PreviewControls
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/Preview/PreviewControls.tsx`:
   - Play/Pause toggle button
   - Skip to start (|<) button
   - Skip to end (>|) button
   - Frame step forward/backward buttons
   - Speed selector dropdown (0.25x, 0.5x, 1x, 1.5x, 2x)
   - Current time / total duration display
   - Fullscreen toggle

### Section K Verification:
- Create new project with 1920x1080 resolution
- Import 2 video clips and 1 audio clip via MediaBin
- Drag video clips to timeline (they appear as blocks)
- Move clips by dragging
- Trim clips by dragging edges
- Preview shows composited video at playhead position
- Play button plays preview with audio
- Undo/redo works for all operations
