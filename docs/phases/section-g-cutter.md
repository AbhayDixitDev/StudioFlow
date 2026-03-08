# Section G: Audio Cutter (Phases 071-080)

## Progress Checklist
- [x] Phase 071 - WaveformDisplay Integration (wavesurfer.js)
- [x] Phase 072 - WaveformEditor Component (zoom, scroll)
- [x] Phase 073 - Region Handles (draggable start/end)
- [x] Phase 074 - Time Input Fields (RegionSelector)
- [x] Phase 075 - Playback Controls (play, pause, loop)
- [x] Phase 076 - Fade In/Out UI (fade sliders)
- [x] Phase 077 - Cut API Endpoint (POST /api/audio/cut)
- [x] Phase 078 - FFmpeg Cut Method (cutAudio)
- [x] Phase 079 - AudioCutter Page (full flow)
- [x] Phase 080 - Browser-Side Cutting (FFmpeg WASM)

---

## Phase 071 - WaveformDisplay Integration
**Status:** Pending

### Tasks:
1. Install `wavesurfer.js` in apps/web
2. Update `packages/ui/src/components/WaveformDisplay.tsx`:
   - Integrate wavesurfer.js as the rendering engine
   - Accept audio blob or URL as source
   - Configure colors from current theme
   - Expose ref for external control (play, pause, seek)
   - Handle loading state (show skeleton while loading)

---

## Phase 072 - WaveformEditor Component
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/cutter/WaveformEditor.tsx`:
   - Full-width waveform using WaveformDisplay
   - Zoom controls (zoom in/out slider)
   - Horizontal scroll when zoomed
   - Overview bar (mini waveform showing full track with viewport indicator)
   - Current time display

---

## Phase 073 - Region Handles
**Status:** Pending

### Tasks:
1. Add to WaveformEditor:
   - Two draggable handles (start and end) overlaid on waveform
   - Highlighted region between handles (semi-transparent accent color)
   - Drag constraints: start handle can't go past end handle
   - Snap to nearest 0.1 second
   - Visual feedback on drag (handle color change, cursor change)
   - Double-click handle to reset to start/end of track

---

## Phase 074 - Time Input Fields
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/cutter/RegionSelector.tsx`:
   - Start time input (HH:MM:SS.ms format)
   - End time input (HH:MM:SS.ms format)
   - Duration display (computed: end - start)
   - Two-way binding: changing inputs moves handles, moving handles updates inputs
   - Validation: start < end, both within audio duration

---

## Phase 075 - Playback Controls
**Status:** Pending

### Tasks:
1. Add playback controls to cutter:
   - Play full audio button
   - Play selected region button
   - Pause button
   - Loop toggle (loop selected region)
   - Current time display

---

## Phase 076 - Fade In/Out UI
**Status:** Pending

### Tasks:
1. Add fade controls:
   - Fade-in duration slider (0-10 seconds)
   - Fade-out duration slider (0-10 seconds)
   - Visual representation on waveform (gradient overlay at start/end of region)
   - Preview fade effect during playback

---

## Phase 077 - Cut API Endpoint
**Status:** Pending

### Tasks:
1. Add to audio controller:
   - `cut`: validate params (fileId, startTime, endTime, fadeIn, fadeOut, format)
   - Create ProcessingJob
   - Call FFmpeg service
   - Return job info
2. Add route: POST /api/audio/cut → auth → cut

---

## Phase 078 - FFmpeg Cut Method
**Status:** Pending

### Tasks:
1. Add to `ffmpeg.service.ts`:
   - `cutAudio(inputPath, outputPath, options)`:
     - options: { startTime, endTime, fadeInDuration, fadeOutDuration, format }
     - Use -ss (seek) and -to (end time) for precise cutting
     - Apply afade filter for fade-in: `afade=t=in:st=0:d=${fadeIn}`
     - Apply afade filter for fade-out: `afade=t=out:st=${duration-fadeOut}:d=${fadeOut}`
     - Return Promise

---

## Phase 079 - AudioCutter Page
**Status:** Pending

### Tasks:
1. Update `apps/web/src/pages/AudioCutter.tsx`:
   - FileDropzone at top
   - After upload: render WaveformEditor with all controls
   - RegionSelector below waveform
   - ControlBar with playback + fade controls
   - Export bar: format picker + "Cut & Download" button
   - Full flow: upload → visualize → select region → cut → download
   - Loading/progress states

---

## Phase 080 - Browser-Side Cutting
**Status:** Pending

### Tasks:
1. Update `apps/web/src/hooks/useFFmpeg.ts`:
   - Add `cutAudio(file, startTime, endTime, fadeIn, fadeOut, format)` method
   - Run cutting operation in browser via FFmpeg WASM
   - No server round-trip needed for basic cuts
   - Fall back to server for complex operations
   - Detect Electron → use IPC instead

### Section G Verification:
- Upload a 5-minute audio file
- See interactive waveform with zoom
- Drag handles to select a 30-second region
- Set 1s fade-in and 2s fade-out
- Preview the selection (play selected region)
- Click Cut & Download
- Verify downloaded file is exactly the selected region with fades
- Test browser-side cutting (no server)
