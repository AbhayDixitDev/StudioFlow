# Video Editor Architecture

The video editor is the most complex feature. This document details its internal architecture.

---

## Overview

The video editor is split into two layers:
1. **Engine Layer** - Pure TypeScript classes (no React dependency). Manages all state, logic, and operations.
2. **UI Layer** - React components that render the engine state and dispatch user actions.

This separation allows the engine to be reused across Electron (main process) and potentially mobile.

---

## Engine Layer (`apps/web/src/features/video-editor/engine/`)

### TimelineEngine

The central coordinator. Holds the source of truth for all project state.

```typescript
class TimelineEngine {
  // State
  private tracks: Track[];
  private currentTime: number;
  private duration: number;         // computed from tracks
  private playing: boolean;
  private speed: number;            // playback speed multiplier

  // Sub-managers
  private clipManager: ClipManager;
  private playbackController: PlaybackController;
  private selectionManager: SelectionManager;
  private undoManager: UndoManager;
  private snapEngine: SnapEngine;

  // Event emitter for React subscription
  private listeners: Map<string, Set<Function>>;

  // Core methods
  getState(): TimelineState;
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
  emit(event: string, data?: any): void;

  // Track operations (delegate to ClipManager)
  addTrack(type: TrackType, name?: string): Track;
  removeTrack(trackId: string): void;
  reorderTrack(trackId: string, newIndex: number): void;

  // Clip operations (delegate to ClipManager)
  addClip(trackId: string, clip: ClipData): Clip;
  removeClip(clipId: string): void;
  moveClip(clipId: string, newTrackId: string, newStartTime: number): void;
  trimClip(clipId: string, side: 'start' | 'end', newTime: number): void;
  splitClip(clipId: string, atTime: number): [Clip, Clip];
  duplicateClip(clipId: string): Clip;

  // Playback (delegate to PlaybackController)
  play(): void;
  pause(): void;
  seek(time: number): void;
  setSpeed(speed: number): void;

  // Selection (delegate to SelectionManager)
  selectClip(clipId: string, addToSelection?: boolean): void;
  selectTrack(trackId: string): void;
  clearSelection(): void;

  // Undo/Redo (delegate to UndoManager)
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}
```

### ClipManager

Handles all clip CRUD operations with validation.

```typescript
class ClipManager {
  // Validates clip placement (no overlaps on same track for video)
  canPlaceClip(trackId: string, startTime: number, duration: number, excludeClipId?: string): boolean;

  // Finds the clip at a given time on a given track
  getClipAtTime(trackId: string, time: number): Clip | null;

  // Gets all clips visible at a given time (across all tracks)
  getVisibleClipsAtTime(time: number): Clip[];

  // Split a clip into two at the given time
  splitClip(clipId: string, atTime: number): [Clip, Clip];

  // Get clips in a time range (for rendering optimization)
  getClipsInRange(startTime: number, endTime: number): Clip[];
}
```

### PlaybackController

Manages the requestAnimationFrame loop for real-time preview.

```typescript
class PlaybackController {
  private rafId: number | null;
  private lastFrameTime: number;

  play(): void {
    // Start rAF loop
    // Each frame: advance currentTime by delta * speed
    // Emit 'timeupdate' event
    // Stop at end of timeline
  }

  pause(): void {
    // Cancel rAF
  }

  seek(time: number): void {
    // Set currentTime, emit 'seek' event
  }

  // Called each rAF frame
  private tick(timestamp: number): void {
    const delta = (timestamp - this.lastFrameTime) / 1000;
    this.currentTime += delta * this.speed;

    if (this.currentTime >= this.duration) {
      this.pause();
      this.currentTime = this.duration;
    }

    this.emit('timeupdate', this.currentTime);
    this.lastFrameTime = timestamp;
    this.rafId = requestAnimationFrame(this.tick);
  }
}
```

### SelectionManager

Tracks which clips and tracks are selected.

```typescript
class SelectionManager {
  private selectedClipIds: Set<string>;
  private selectedTrackId: string | null;

  selectClip(clipId: string, addToSelection: boolean): void;
  deselectClip(clipId: string): void;
  selectTrack(trackId: string): void;
  clearSelection(): void;
  isClipSelected(clipId: string): boolean;
  getSelectedClips(): Clip[];
}
```

### UndoManager

Uses the Command Pattern for undo/redo.

```typescript
interface Command {
  execute(): void;
  undo(): void;
  description: string;    // for debug: "Move clip 'intro.mp4' to 5.0s"
}

class UndoManager {
  private undoStack: Command[];
  private redoStack: Command[];
  private maxHistory: number = 100;

  execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];  // clear redo on new action
  }

  undo(): void {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
    }
  }

  redo(): void {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      this.undoStack.push(command);
    }
  }
}

// Example commands:
class MoveClipCommand implements Command {
  constructor(
    private engine: TimelineEngine,
    private clipId: string,
    private fromTrackId: string,
    private fromStartTime: number,
    private toTrackId: string,
    private toStartTime: number
  ) {}

  execute() { this.engine.moveClipDirect(this.clipId, this.toTrackId, this.toStartTime); }
  undo() { this.engine.moveClipDirect(this.clipId, this.fromTrackId, this.fromStartTime); }
}
```

### SnapEngine

Provides magnetic snapping when moving/trimming clips.

```typescript
class SnapEngine {
  private snapThreshold: number = 10;  // pixels
  private enabled: boolean = true;

  // Get snap points: clip edges, playhead, markers
  getSnapPoints(excludeClipId?: string): number[];

  // Given a proposed time, return the snapped time (or original if no snap)
  snap(proposedTime: number, pixelsPerSecond: number): { time: number; snapped: boolean; snapPoint?: number };
}
```

---

## Rendering Pipeline

### Preview Rendering (Real-time, in-app)

Each frame of the preview is rendered on a `<canvas>` element.

```
PlaybackController fires 'timeupdate'
    │
    ▼
VideoPreview.tsx receives currentTime
    │
    ▼
Query ClipManager.getVisibleClipsAtTime(currentTime)
    │
    ▼
For each visible clip (bottom track first = background):
    │
    ├── Video clip:
    │   1. Get source <video> element (pre-loaded, hidden)
    │   2. Seek video to correct frame: clip.trimStart + (currentTime - clip.startTime)
    │   3. ctx.drawImage(video, x, y, width, height)
    │   4. Apply transform: translate, scale, rotate
    │   5. Apply opacity: ctx.globalAlpha = clip.opacity
    │   6. Apply effects: ctx.filter or pixel manipulation
    │
    ├── Image clip:
    │   1. Get source <img> element (pre-loaded)
    │   2. Apply Ken Burns: interpolate position/scale based on time
    │   3. ctx.drawImage(img, x, y, width, height)
    │   4. Apply transform and effects
    │
    ├── Text clip:
    │   1. Set ctx.font, ctx.fillStyle, ctx.textAlign
    │   2. Apply text animation: compute position/opacity based on time
    │   3. Draw stroke if configured: ctx.strokeText()
    │   4. Draw fill: ctx.fillText()
    │   5. Apply shadow: ctx.shadowColor, ctx.shadowBlur
    │
    └── Apply transitions:
        If clip is in transition zone (start/end overlapping another clip):
        1. Render both clips to offscreen canvases
        2. Apply transition blend (crossfade = alpha interpolation)
        3. Composite to main canvas
```

### Export Rendering (FFmpeg)

When exporting, the timeline is converted to an FFmpeg complex filter graph.

```
Timeline JSON
    │
    ▼
videoExport.service.ts (or desktop/videoExport.ts)
    │
    ▼
Build FFmpeg command:
    │
    ├── Inputs: -i clip1.mp4 -i clip2.mp4 -i image1.png ...
    │
    ├── Filter graph: -filter_complex "
    │   [0:v]trim=start=2:end=10,setpts=PTS-STARTPTS[v0];
    │   [1:v]trim=start=0:end=5,setpts=PTS-STARTPTS[v1];
    │   [v0][v1]xfade=transition=fade:duration=1:offset=7[vout];
    │   [vout]drawtext=text='Title':fontsize=48:x=(w-text_w)/2:y=50[final];
    │   [0:a]atrim=start=2:end=10,asetpts=PTS-STARTPTS,volume=0.8[a0];
    │   [1:a]atrim=start=0:end=5,asetpts=PTS-STARTPTS[a1];
    │   [a0][a1]concat=n=2:v=0:a=1[aout]
    │   "
    │
    ├── Output: -map "[final]" -map "[aout]" -c:v libx264 -preset medium
    │           -crf 23 -c:a aac -b:a 192k output.mp4
    │
    └── Monitor progress: parse FFmpeg stdout for frame count / duration
```

---

## Effect System

### VideoEffect Interface

```typescript
interface VideoEffect {
  id: string;
  name: string;
  category: 'color' | 'blur' | 'keying' | 'stylize';
  defaultParams: Record<string, EffectParam>;

  // Apply to canvas context (real-time preview)
  applyToCanvas(
    ctx: CanvasRenderingContext2D,
    params: Record<string, number>,
    clipRect: { x: number; y: number; width: number; height: number }
  ): void;

  // Generate FFmpeg filter string (export)
  toFFmpegFilter(params: Record<string, number>): string;
}

interface EffectParam {
  name: string;
  type: 'number' | 'color' | 'boolean';
  min?: number;
  max?: number;
  step?: number;
  default: number | string | boolean;
}
```

### Built-in Effects

| Effect | Canvas Implementation | FFmpeg Filter |
|--------|----------------------|---------------|
| Brightness | `ctx.filter = brightness(${val})` | `eq=brightness=${val-1}` |
| Contrast | `ctx.filter = contrast(${val})` | `eq=contrast=${val}` |
| Saturation | `ctx.filter = saturate(${val})` | `eq=saturation=${val}` |
| Blur | `ctx.filter = blur(${val}px)` | `boxblur=${val}` |
| Hue Rotate | `ctx.filter = hue-rotate(${val}deg)` | `hue=h=${val}` |
| Grayscale | `ctx.filter = grayscale(${val})` | `hue=s=0` |
| Sepia | `ctx.filter = sepia(${val})` | `colorchannelmixer=...` |
| Chroma Key | Pixel-level ImageData manipulation | `chromakey=0x00FF00:0.3:0.1` |
| Temperature | Custom color matrix in ImageData | `colortemperature=${val}` |

### EffectRegistry

```typescript
class EffectRegistry {
  private effects: Map<string, VideoEffect> = new Map();

  register(effect: VideoEffect): void;
  get(id: string): VideoEffect | undefined;
  getAll(): VideoEffect[];
  getByCategory(category: string): VideoEffect[];
}

// Initialize with built-in effects:
const registry = new EffectRegistry();
registry.register(new BrightnessEffect());
registry.register(new ContrastEffect());
registry.register(new BlurEffect());
// ... etc
```

---

## Transition System

### Transition Types

```typescript
type TransitionType = 'crossfade' | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown'
  | 'wipeHorizontal' | 'wipeVertical' | 'wipeDiagonal' | 'zoomIn' | 'zoomOut';

interface Transition {
  type: TransitionType;
  duration: number;  // seconds
}
```

### Canvas Rendering (Preview)

```typescript
function renderTransition(
  ctx: CanvasRenderingContext2D,
  fromCanvas: OffscreenCanvas,   // outgoing clip
  toCanvas: OffscreenCanvas,     // incoming clip
  progress: number,              // 0.0 to 1.0
  type: TransitionType,
  width: number,
  height: number
): void {
  switch (type) {
    case 'crossfade':
      ctx.globalAlpha = 1 - progress;
      ctx.drawImage(fromCanvas, 0, 0);
      ctx.globalAlpha = progress;
      ctx.drawImage(toCanvas, 0, 0);
      ctx.globalAlpha = 1;
      break;

    case 'slideLeft':
      const offset = width * progress;
      ctx.drawImage(fromCanvas, -offset, 0);
      ctx.drawImage(toCanvas, width - offset, 0);
      break;

    case 'wipeHorizontal':
      ctx.drawImage(fromCanvas, 0, 0);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width * progress, height);
      ctx.clip();
      ctx.drawImage(toCanvas, 0, 0);
      ctx.restore();
      break;

    // ... other transitions
  }
}
```

### FFmpeg Export

```
Crossfade: [v0][v1]xfade=transition=fade:duration=1:offset=9[vout]
Slide:     [v0][v1]xfade=transition=slideleft:duration=1:offset=9[vout]
Wipe:      [v0][v1]xfade=transition=wipeleft:duration=1:offset=9[vout]
Zoom:      [v0][v1]xfade=transition=zoomin:duration=1:offset=9[vout]
```

---

## Audio Sync

### Multi-track Audio Playback

The video editor uses Web Audio API for synchronized audio playback:

```typescript
class AudioEngine {
  private audioContext: AudioContext;
  private gainNodes: Map<string, GainNode>;  // per clip
  private sourceNodes: Map<string, AudioBufferSourceNode>;

  // Load audio for all clips
  async loadClipAudio(clipId: string, audioBuffer: AudioBuffer): Promise<void>;

  // Play all audio clips from a given time
  play(fromTime: number): void {
    for (const [clipId, clip] of this.clips) {
      if (clip.startTime + clip.duration > fromTime && clip.startTime < this.duration) {
        const offset = Math.max(0, fromTime - clip.startTime) + clip.trimStart;
        const delay = Math.max(0, clip.startTime - fromTime);
        const source = this.audioContext.createBufferSource();
        source.buffer = this.buffers.get(clipId);
        source.playbackRate.value = clip.speed;
        const gain = this.audioContext.createGain();
        gain.gain.value = clip.volume;
        source.connect(gain).connect(this.audioContext.destination);
        source.start(this.audioContext.currentTime + delay, offset);
      }
    }
  }

  // Stop all audio
  stop(): void;

  // Update volume for a clip
  setClipVolume(clipId: string, volume: number): void;

  // Mute/unmute a track
  muteTrack(trackId: string, muted: boolean): void;
}
```

---

## Zustand Store Bridge

The `videoEditorStore` bridges the pure TypeScript engine with React:

```typescript
interface VideoEditorState {
  // Engine instance
  engine: TimelineEngine;

  // Derived state (updated on engine events)
  tracks: Track[];
  currentTime: number;
  playing: boolean;
  selectedClipIds: string[];
  selectedTrackId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  duration: number;

  // Actions
  addTrack: (type: TrackType) => void;
  addClip: (trackId: string, clip: ClipData) => void;
  removeClip: (clipId: string) => void;
  moveClip: (clipId: string, trackId: string, startTime: number) => void;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  undo: () => void;
  redo: () => void;
  // ... etc
}

const useVideoEditorStore = create<VideoEditorState>((set, get) => {
  const engine = new TimelineEngine();

  // Subscribe to engine events and update Zustand state
  engine.on('statechange', () => {
    set({
      tracks: engine.getTracks(),
      currentTime: engine.getCurrentTime(),
      playing: engine.isPlaying(),
      duration: engine.getDuration(),
      canUndo: engine.canUndo(),
      canRedo: engine.canRedo(),
    });
  });

  return {
    engine,
    tracks: [],
    currentTime: 0,
    // ... initial state

    addTrack: (type) => engine.addTrack(type),
    play: () => engine.play(),
    // ... actions delegate to engine
  };
});
```
