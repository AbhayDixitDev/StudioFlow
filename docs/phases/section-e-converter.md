# Section E: Audio Format Converter (Phases 056-063)

## Progress Checklist
- [x] Phase 056 - FFmpeg Service Init (fluent-ffmpeg, probeFile)
- [x] Phase 057 - FFmpeg Convert Method (convertAudio)
- [x] Phase 058 - Convert API Endpoint (POST /api/audio/convert)
- [x] Phase 059 - Download Endpoint (GET /api/audio/download/:jobId)
- [x] Phase 060 - FormatPicker Component (format grid UI)
- [x] Phase 061 - QualitySettings Component (bitrate, sample rate)
- [x] Phase 062 - FormatChanger Page (full flow)
- [x] Phase 063 - FFmpeg WASM Hook (browser-side conversion)

---

## Phase 056 - FFmpeg Service Init
**Status:** Pending
**Goal:** Create the FFmpeg service wrapper.

### Tasks:
1. Install `fluent-ffmpeg` and `@types/fluent-ffmpeg` in apps/server
2. Create `apps/server/src/services/ffmpeg.service.ts`:
   - Detect FFmpeg binary path (system PATH or bundled)
   - Set ffmpeg and ffprobe paths
   - `probeFile(filePath)`: get metadata (duration, format, channels, sampleRate, bitrate)
   - Export singleton instance

---

## Phase 057 - FFmpeg Convert Method
**Status:** Pending

### Tasks:
1. Add to `ffmpeg.service.ts`:
   - `convertAudio(inputPath, outputPath, options)`:
     - options: { format, bitrate, sampleRate, channels }
     - Returns Promise that resolves on completion
     - Emits progress events (percentage)
     - Handles errors (invalid format, corrupt file)

---

## Phase 058 - Convert API Endpoint
**Status:** Pending

### Tasks:
1. Add to `apps/server/src/controllers/audio.controller.ts`:
   - `convert`: validate request (fileId, targetFormat, bitrate), find AudioFile, create ProcessingJob, run FFmpeg conversion, update job status, return job info
2. Add route: POST /api/audio/convert → auth → convert

---

## Phase 059 - Download Endpoint
**Status:** Pending

### Tasks:
1. Add to audio controller:
   - `download`: find job by ID, verify ownership, stream output file
   - Set Content-Disposition header for filename
   - Set Content-Type based on format
2. Add route: GET /api/audio/download/:jobId → auth → download

---

## Phase 060 - FormatPicker Component
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/converter/FormatPicker.tsx`:
   - Grid of format buttons: MP3, WAV, FLAC, OGG, AAC, WMA
   - Each button: icon/label, selected state (accent border + glow)
   - Single selection mode
   - Props: selectedFormat, onSelect

---

## Phase 061 - QualitySettings Component
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/converter/QualitySettings.tsx`:
   - Bitrate slider: 64k, 128k, 192k, 256k, 320k (for lossy formats)
   - Sample rate selector: 22050, 44100, 48000, 96000
   - Show/hide based on format (no bitrate for WAV/FLAC)
   - Display estimated file size based on duration + settings

---

## Phase 062 - FormatChanger Page
**Status:** Pending

### Tasks:
1. Update `apps/web/src/pages/FormatChanger.tsx`:
   - FileDropzone to upload audio file
   - After upload: show file info (name, format, duration, size)
   - FormatPicker to select target format
   - QualitySettings for bitrate/sample rate
   - Convert button → call API → show progress → download link
   - Full flow with loading states and error handling

---

## Phase 063 - FFmpeg WASM Hook
**Status:** Pending

### Tasks:
1. Create `apps/web/src/hooks/useFFmpeg.ts`:
   - Load @ffmpeg/ffmpeg WASM (lazy, first use)
   - `convert(file, targetFormat, options)`: run conversion in browser
   - Progress callback support
   - Return output as Blob for download
   - Error handling for unsupported operations
   - Detect if running in Electron → skip WASM, use IPC

### Section E Verification:
- Upload an MP3 file
- Select WAV format
- Click Convert
- Progress bar shows conversion progress
- Download the converted WAV file
- Verify file plays correctly
- Test batch: upload 3 files, convert all to FLAC
