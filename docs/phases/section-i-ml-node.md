# Section I: Audio Separator - Node Integration (Phases 089-098)

## Progress Checklist
- [x] Phase 089 - Demucs Service (spawn Python, parse progress)
- [x] Phase 090 - BullMQ Setup (queues, Redis connection)
- [x] Phase 091 - Separation Worker (BullMQ worker)
- [x] Phase 092 - Separate API Endpoint (POST /api/audio/separate)
- [x] Phase 093 - Job Status Endpoint (GET /api/jobs/:id)
- [x] Phase 094 - Socket.IO Progress (real-time updates)
- [x] Phase 095 - StemSelector Component (model picker UI)
- [x] Phase 096 - StemPlayer Component (multi-track player)
- [x] Phase 097 - DownloadPanel Component (stem download UI)
- [x] Phase 098 - AudioSeparator Page (full flow)

---

## Phase 089 - Demucs Service
**Status:** Pending

### Tasks:
1. Create `apps/server/src/services/demucs.service.ts`:
   - `separate(inputPath, outputDir, model)`:
     - Spawn: `child_process.spawn('python', ['ml/src/separate.py', '--input', inputPath, '--output', outputDir, '--model', model])`
     - Parse stdout lines for `PROGRESS:N` → emit progress events
     - Parse stderr for errors
     - On exit code 0: read output directory, return stem file list
     - On exit code 1: throw error with message
     - Return Promise<StemResult[]>
   - `isAvailable()`: check if Python + Demucs are installed
   - `getModels()`: return available models

---

## Phase 090 - BullMQ Setup
**Status:** Pending

### Tasks:
1. Install `bullmq` and `ioredis` in apps/server
2. Create queue configuration:
   - `separationQueue`: queue name "audio-separation"
   - `processingQueue`: queue name "audio-processing"
   - Redis connection from env (REDIS_URL)
   - Default job options: attempts 1, timeout 30min
3. Initialize queues in server startup

---

## Phase 091 - Separation Worker
**Status:** Pending

### Tasks:
1. Create `apps/server/src/workers/separationWorker.ts`:
   - BullMQ Worker listening on "audio-separation" queue
   - Job data: { jobId, audioFilePath, outputDir, model, userId }
   - Process:
     1. Update SeparationJob status → "processing"
     2. Call demucs.service.separate()
     3. On progress: update job.progress in DB
     4. On completion: update status → "completed", store stem paths
     5. On error: update status → "failed", store error
   - Emit Socket.IO events for real-time progress

---

## Phase 092 - Separate API Endpoint
**Status:** Pending

### Tasks:
1. Add to audio controller:
   - `separate`: validate request (audioFileId, model), find AudioFile, create SeparationJob (status: queued), enqueue job in BullMQ, return job ID
2. Add route: POST /api/audio/separate → auth → separate

---

## Phase 093 - Job Status Endpoint
**Status:** Pending

### Tasks:
1. Create `apps/server/src/controllers/jobs.controller.ts`:
   - `getJobStatus`: find job by ID (check both SeparationJob and ProcessingJob), verify ownership, return status/progress/results
2. Create `apps/server/src/routes/jobs.routes.ts`:
   - GET /api/jobs/:id → auth → getJobStatus
3. Mount in index.ts

---

## Phase 094 - Socket.IO Progress
**Status:** Pending

### Tasks:
1. Add Socket.IO to `apps/server/src/index.ts`:
   - Create socket.io server attached to HTTP server
   - Auth middleware: verify JWT from socket handshake
   - Room-based: client joins `job:{jobId}` room
   - Events emitted by worker: `job:progress`, `job:completed`, `job:failed`
2. Update separation worker to emit Socket.IO events

---

## Phase 095 - StemSelector Component
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/separator/StemSelector.tsx`:
   - Card-style selector for model choice:
     - htdemucs (4 stems): vocals, drums, bass, other
     - htdemucs_6s (6 stems): vocals, drums, bass, guitar, piano, other
   - Each option shows: model name, stem count, stem names, quality description
   - Selected state with accent border

---

## Phase 096 - StemPlayer Component
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/separator/StemPlayer.tsx`:
   - Master controls at top: play/pause button, seek bar, time display, master volume
   - For each stem (vertical list):
     - Stem name (icon + label)
     - Mini waveform visualization
     - Solo button (S) - solo this stem
     - Mute button (M) - mute this stem
     - Volume slider
   - All stems play synchronized
   - Use Web Audio API (Tone.js) for multi-track playback
   - Visual: accent colors per stem type

---

## Phase 097 - DownloadPanel Component
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/separator/DownloadPanel.tsx`:
   - Checkbox per stem: select which stems to download
   - "Select All" / "Deselect All" buttons
   - Output format picker: WAV (lossless), MP3 (compressed), FLAC
   - Download button:
     - Single stem selected → download individual file
     - Multiple stems → download as ZIP
   - File size estimates per stem

---

## Phase 098 - AudioSeparator Page
**Status:** Pending

### Tasks:
1. Update `apps/web/src/pages/AudioSeparator.tsx`:
   - Input section:
     - Tab bar: "Upload File" | "Paste URL"
     - FileDropzone (accepts audio + video files)
     - URL input field
     - StemSelector (model picker)
     - "Separate" button
   - Processing section (shown during separation):
     - Large animated progress ring/bar
     - Percentage text
     - Status text ("Loading model...", "Separating vocals...", etc.)
     - Socket.IO connection for real-time progress
   - Results section (shown after completion):
     - StemPlayer (full multi-track player)
     - DownloadPanel
   - History section: list of recent separation jobs with re-download

### Section I Verification:
- Upload a song (MP3)
- Select htdemucs_6s model
- Click Separate
- See real-time progress (0% → 100%)
- After completion: see 6 stems in player
- Play all stems together (sounds like original)
- Solo vocals → hear only vocals
- Mute drums → hear everything except drums
- Select vocals + bass → download as ZIP
- Verify downloaded files play correctly
