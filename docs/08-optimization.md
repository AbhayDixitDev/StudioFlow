# Performance Optimization Strategy

Making the app fast on low-end devices is a core requirement.

---

## 1. Audio Separation Optimization

### Model Selection Based on Hardware

```python
# ml/src/utils/gpu_check.py

def recommend_model():
    """Recommend the best model based on available hardware."""
    import torch
    import psutil

    ram_gb = psutil.virtual_memory().total / (1024 ** 3)
    has_cuda = torch.cuda.is_available()

    if has_cuda:
        vram_gb = torch.cuda.get_device_properties(0).total_mem / (1024 ** 3)
        if vram_gb >= 6:
            return "htdemucs_6s"    # Best quality, 6 stems
        else:
            return "htdemucs"       # Good quality, 4 stems
    elif ram_gb >= 8:
        return "htdemucs"           # CPU with enough RAM
    else:
        return "htdemucs"           # CPU with limited RAM, use smaller segments

def recommend_segment_size():
    """Recommend segment size for chunked processing."""
    ram_gb = psutil.virtual_memory().total / (1024 ** 3)

    if ram_gb >= 16:
        return None     # No chunking needed (default behavior)
    elif ram_gb >= 8:
        return 10       # 10-second segments
    else:
        return 7        # 7-second segments (less RAM usage)
```

### Chunked Processing for Large Files

- Demucs supports `--segment N` flag for processing in chunks
- Default segment: 7.8 seconds
- Low RAM (<8GB): Force `--segment 7` to reduce memory footprint
- Trade-off: Slightly more processing time, but uses much less RAM
- Progress reporting: Each segment completion = progress increment

### CPU Thread Control

```python
# Limit CPU threads on low-end devices
import torch
torch.set_num_threads(max(1, os.cpu_count() // 2))  # Use half of available cores
```

---

## 2. FFmpeg Processing Optimization

### Browser-Side (FFmpeg WASM)

For simple operations (format conversion, audio cutting), avoid server round-trips:

```typescript
// hooks/useFFmpeg.ts
const ffmpeg = new FFmpeg();

// Load WASM only once, cache in memory
await ffmpeg.load({
  coreURL: '/ffmpeg/ffmpeg-core.js',
  wasmURL: '/ffmpeg/ffmpeg-core.wasm',
  workerURL: '/ffmpeg/ffmpeg-core.worker.js',
});

// Run in Web Worker (doesn't block UI thread)
await ffmpeg.exec([
  '-i', 'input.mp3',
  '-b:a', '320k',
  'output.flac'
]);
```

**When to use WASM vs Server:**
| Operation | WASM (browser) | Server (FFmpeg native) |
|-----------|---------------|----------------------|
| Format conversion (<50MB) | Yes | Fallback |
| Audio cutting | Yes | Fallback |
| Audio extraction from video (<100MB) | Yes | Fallback |
| Format conversion (>50MB) | No (too slow) | Yes |
| Audio separation | No | Yes (Python) |
| Video export | No | Yes |

### Server-Side (Native FFmpeg)

```typescript
// Use stream processing for large files
ffmpeg()
  .input(inputPath)
  .outputOptions([
    '-threads', String(Math.max(1, os.cpus().length - 1)),  // Leave 1 core for OS
    '-preset', 'fast',  // Balance speed vs quality
  ])
  .output(outputPath);
```

---

## 3. Waveform Rendering Optimization

### Progressive Loading

```typescript
// Step 1: Generate low-res peaks (fast, small data)
const lowResPeaks = generatePeaks(audioBuffer, 128);  // 128 samples per pixel
// Render immediately

// Step 2: When user zooms in, generate high-res peaks on demand
const highResPeaks = generatePeaks(audioBuffer, 512);  // 512 samples per pixel
// Re-render at zoom level

// Step 3: Full resolution only for the visible viewport
const viewportPeaks = generatePeaks(audioBuffer, pixelsInViewport);
```

### Canvas Rendering Optimization

```typescript
// Use OffscreenCanvas in Web Worker for waveform generation
const worker = new Worker('waveform-worker.js');

// Only redraw visible portion on scroll/zoom
function drawWaveform(peaks: Float32Array, startIndex: number, endIndex: number) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const visiblePeaks = peaks.slice(startIndex, endIndex);
  // Draw only visible bars
}

// Use requestAnimationFrame for smooth updates
// Debounce zoom changes
```

---

## 4. Video Editor Optimization

### Preview Rendering

```typescript
// 1. Use requestVideoFrameCallback for efficient video-to-canvas sync
video.requestVideoFrameCallback((now, metadata) => {
  ctx.drawImage(video, 0, 0);
  // This fires only when a new video frame is available
  // Much more efficient than rAF for video
});

// 2. Skip frames during fast scrubbing
let lastRenderedTime = 0;
function onSeek(time: number) {
  if (Math.abs(time - lastRenderedTime) < 0.033) return;  // Skip if <1 frame apart
  renderFrame(time);
  lastRenderedTime = time;
}

// 3. Use OffscreenCanvas in Web Worker
const offscreen = canvas.transferControlToOffscreen();
worker.postMessage({ canvas: offscreen, type: 'init' }, [offscreen]);

// 4. Lower preview resolution during playback
// Full res: 1920x1080 (when paused)
// Playback res: 960x540 (when playing, for performance)

// 5. Thumbnail strip for timeline clips
// Pre-generate thumbnails at import time (every 5 seconds)
// Use these instead of live rendering on timeline
```

### Memory Management

```typescript
// 1. Lazy load media files (only when needed for playback)
// Don't load all imported media into memory at once

// 2. Release video elements when not visible
// If a clip is scrolled off the timeline, release its <video> element

// 3. Use object URLs and revoke when done
const url = URL.createObjectURL(file);
// ... use url ...
URL.revokeObjectURL(url);  // Free memory

// 4. Limit undo history
const MAX_UNDO_STEPS = 100;  // Don't keep unlimited history
```

### Timeline Rendering

```typescript
// 1. Virtualize tracks and clips
// Only render tracks visible in the viewport
// Use intersection observer or manual viewport calculation

// 2. Throttle mousemove events during drag
// Use requestAnimationFrame to batch drag updates

// 3. Cache clip thumbnail strips
// Generate once on import, store as image data
// Re-use across zoom levels (scale, don't regenerate)
```

---

## 5. Network Optimization

### File Upload

```typescript
// 1. Chunked upload for large files (>10MB)
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
async function uploadChunked(file: File) {
  const chunks = Math.ceil(file.size / CHUNK_SIZE);
  for (let i = 0; i < chunks; i++) {
    const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await api.post(`/upload/chunk`, { chunk, index: i, total: chunks });
  }
}

// 2. Show upload progress
const onUploadProgress = (event: AxiosProgressEvent) => {
  const percent = Math.round((event.loaded / event.total!) * 100);
  setUploadProgress(percent);
};
```

### API Requests

```typescript
// 1. React Query caching
// Default stale time: 5 minutes for audio files list
// Job status: refetch every 2 seconds while processing

// 2. Optimistic updates for UI responsiveness
// Update state immediately, roll back on error

// 3. Debounce auto-save (video editor)
const debouncedSave = debounce(saveProject, 3000);  // Save 3s after last change
```

---

## 6. Electron Desktop Optimization

### Startup Performance

```typescript
// 1. Lazy window creation
// Show splash screen immediately
// Load heavy modules in background

// 2. Preload FFmpeg binary path resolution
// Don't spawn FFmpeg on startup, just resolve the path

// 3. Background Python environment check
// Check if Python + Demucs are installed in background
// Only show setup wizard if missing
```

### Local Processing

```typescript
// 1. Use child_process with stdio: 'pipe' for progress monitoring
// Don't buffer entire output, stream it

// 2. Worker threads for CPU-intensive tasks
// waveform generation, thumbnail generation

// 3. File system operations
// Use async fs operations everywhere
// Stream large files instead of reading into memory
```

---

## 7. Bundle Size Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large libraries into separate chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-audio': ['wavesurfer.js', 'tone'],
          'vendor-video': ['fabric'],
          'vendor-motion': ['framer-motion'],
          'vendor-ffmpeg': ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
        },
      },
    },
  },
});

// Lazy load pages
const VideoEditor = lazy(() => import('./pages/VideoEditor'));
const AudioSeparator = lazy(() => import('./pages/AudioSeparator'));
```

---

## 8. Performance Budgets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Bundle size (initial) | < 500KB gzipped |
| Waveform render (3min audio) | < 500ms |
| Audio format conversion (5MB) | < 5s (WASM) |
| Audio cutting | < 2s (WASM) |
| Video preview FPS | 30fps (1080p), 60fps (720p) |
| Memory usage (web) | < 500MB |
| Memory usage (Electron) | < 1GB |
