# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│  ┌──────────────┐   ┌───────────────┐   ┌──────────────────┐   │
│  │   Web App    │   │   Electron    │   │   React Native   │   │
│  │   (Vite)     │   │   Desktop     │   │     Mobile       │   │
│  │              │   │               │   │                  │   │
│  │  React 19    │   │  React 19     │   │  React Native    │   │
│  │  Tailwind    │   │  (same web    │   │  0.77            │   │
│  │  Zustand     │   │   app in      │   │  React Nav       │   │
│  │  Router v7   │   │   renderer)   │   │                  │   │
│  └──────┬───────┘   └───────┬───────┘   └────────┬─────────┘   │
│         │                   │                     │             │
│         │ HTTP/WS           │ IPC + HTTP           │ HTTP        │
└─────────┼───────────────────┼─────────────────────┼─────────────┘
          │                   │                     │
          ▼                   ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API LAYER                                 │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Express.js 5 API Server                 │       │
│  │                                                      │       │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐   │       │
│  │  │Auth Routes │  │Audio Routes│  │ Video Routes │   │       │
│  │  │/api/auth/* │  │/api/audio/*│  │ /api/video/* │   │       │
│  │  └─────┬──────┘  └─────┬──────┘  └──────┬───────┘   │       │
│  │        │               │                │            │       │
│  │  ┌─────▼───────────────▼────────────────▼───────┐    │       │
│  │  │              Service Layer                    │    │       │
│  │  │                                               │    │       │
│  │  │  FFmpeg Service    │  Storage Service         │    │       │
│  │  │  Demucs Service    │  YouTube Service         │    │       │
│  │  └────────┬───────────────────┬──────────────────┘    │       │
│  └───────────┼───────────────────┼───────────────────────┘       │
│              │                   │                               │
│  ┌───────────▼──────┐  ┌────────▼─────────┐                     │
│  │     BullMQ       │  │    MongoDB       │                     │
│  │   Job Queue      │  │   (Mongoose)     │                     │
│  │   (Redis)        │  │                  │                     │
│  └────────┬─────────┘  └──────────────────┘                     │
└───────────┼─────────────────────────────────────────────────────┘
            │
            ▼  (child_process.spawn)
┌─────────────────────────────────────────────────────────────────┐
│                      ML LAYER (Python)                          │
│                                                                 │
│  ┌──────────────────────────────────────────────┐               │
│  │  separate.py (CLI) OR server.py (FastAPI)    │               │
│  │                                              │               │
│  │  ┌────────────────────────────────────┐      │               │
│  │  │       Demucs Model Engine          │      │               │
│  │  │                                    │      │               │
│  │  │  htdemucs    → 4 stems             │      │               │
│  │  │  htdemucs_6s → 6 stems             │      │               │
│  │  │  mdx_extra   → 4 stems (alt)      │      │               │
│  │  │                                    │      │               │
│  │  │  Outputs: vocals, drums, bass,    │      │               │
│  │  │  guitar, piano, other             │      │               │
│  │  └────────────────────────────────────┘      │               │
│  └──────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

## Communication Patterns

### 1. Web App to Server
- **REST API** over HTTP for all CRUD operations
- **File upload** via `multipart/form-data` using Multer
- **Real-time progress** via Socket.IO (separation jobs, video export)
- **Job polling** via `GET /api/jobs/:id` as fallback to WebSocket

### 2. Electron Desktop
Two operational modes:

**Local Mode (default, offline):**
```
Renderer Process (React app)
    │
    │ IPC (contextBridge)
    ▼
Main Process
    │
    ├── Spawns FFmpeg binary (bundled)
    │   └── Convert, cut, extract, export
    │
    └── Spawns Python process
        └── ml/src/separate.py --input <path> --output <dir>
```

**Server Mode (optional, online):**
```
Renderer Process (React app)
    │
    │ HTTP/WebSocket
    ▼
Express.js API Server (same as web)
```

### 3. Mobile to Server
- Same REST API as web
- File upload via multipart/form-data
- Job status polling (no WebSocket on mobile for simplicity)

### 4. Server to Python ML
```
Node.js (demucs.service.ts)
    │
    │ child_process.spawn('python', ['ml/src/separate.py', ...args])
    │
    │ Monitor stdout for: PROGRESS:45
    │ Monitor stderr for: errors
    │ Monitor exit code: 0 = success
    │
    ▼
Python (separate.py)
    │
    │ Load Demucs model (cached after first run)
    │ Process audio file
    │ Write stems to output directory
    │ Print PROGRESS:N to stdout
    │
    ▼
Output: /outputs/{jobId}/vocals.wav, drums.wav, bass.wav, ...
```

### 5. Job Queue Architecture
```
Client Request (POST /api/audio/separate)
    │
    ▼
Controller → Creates SeparationJob in MongoDB (status: "queued")
    │
    ▼
Enqueue job in BullMQ queue
    │
    ▼
separationWorker.ts picks up job
    │
    ├── Update status → "processing"
    ├── Spawn Python Demucs process
    ├── Parse PROGRESS:N → update job.progress in DB + emit via Socket.IO
    ├── On success → update status → "completed", store stem paths
    └── On error → update status → "failed", store error message
```

## Data Flow: Audio Separation (Complete Path)

```
1. User uploads audio file or pastes URL
    │
2. [URL path] youtube.service.ts downloads via yt-dlp
   [File path] multer saves upload to /uploads/{userId}/
    │
3. AudioFile document created in MongoDB
    │
4. POST /api/audio/separate { audioFileId, model: "htdemucs_6s" }
    │
5. SeparationJob created (status: queued)
    │
6. Job added to BullMQ queue
    │
7. Worker picks up job:
   - Reads audio file from /uploads/
   - Spawns: python separate.py --input /uploads/file.mp3 --output /outputs/jobId/
   - Monitors progress (PROGRESS:0 → PROGRESS:100)
   - Updates DB + emits Socket.IO events
    │
8. Python Demucs writes stems:
   /outputs/{jobId}/vocals.wav
   /outputs/{jobId}/drums.wav
   /outputs/{jobId}/bass.wav
   /outputs/{jobId}/guitar.wav
   /outputs/{jobId}/piano.wav
   /outputs/{jobId}/other.wav
    │
9. Worker marks job completed, stores stem file paths in SeparationJob doc
    │
10. Client receives completion event:
    - Fetches job details
    - Loads stems into multi-track audio player
    - User can mute/solo/adjust volume per stem
    - User selects stems → downloads as individual files or zip
```

## Data Flow: Video Editor Export

```
1. User builds project in timeline editor
    │
2. User clicks Export → selects resolution, format, quality
    │
3. POST /api/video/export { projectId, settings }
    │
4. ProcessingJob created (type: "video-export")
    │
5. Export worker converts timeline JSON to FFmpeg complex filter graph:
   - Each clip → FFmpeg input
   - Position/scale/rotation → overlay filters
   - Effects → eq, boxblur, chromakey filters
   - Transitions → xfade filter
   - Text → drawtext filter
   - Audio → amix, volume filters
    │
6. FFmpeg command assembled and executed
   - Progress monitored via FFmpeg's -progress pipe
   - Real-time updates via Socket.IO
    │
7. Output file written: /exports/{jobId}/output.mp4
    │
8. User downloads final video
```

## Security Architecture

```
┌─────────────────┐
│  Client Request  │
└────────┬────────┘
         │
    ┌────▼────┐
    │  CORS   │  Only allow configured origins
    └────┬────┘
         │
    ┌────▼────┐
    │ Helmet  │  Security headers (CSP, HSTS, etc.)
    └────┬────┘
         │
    ┌────▼────────┐
    │ Rate Limit  │  100 req/15min per IP (configurable)
    └────┬────────┘
         │
    ┌────▼────┐
    │  Auth   │  JWT verification (Bearer token)
    └────┬────┘
         │
    ┌────▼──────┐
    │  Multer   │  File type whitelist, size limit (500MB)
    └────┬──────┘
         │
    ┌────▼──────────┐
    │  Validation   │  Zod schema validation on all inputs
    └────┬──────────┘
         │
    ┌────▼──────────┐
    │  Controller   │  Business logic
    └───────────────┘
```
