# Complete Folder Structure

Every file and directory in the monorepo with its purpose.

```
Audio Seperator/
│
├── package.json                          # Root monorepo config (npm workspaces)
├── turbo.json                            # Turborepo build pipeline config
├── tsconfig.base.json                    # Base TypeScript config shared by all packages
├── .gitignore                            # Git ignore rules
├── .env.example                          # Environment variable template
├── .eslintrc.js                          # Root ESLint config (flat config)
├── .prettierrc                           # Prettier code formatting rules
│
├── docs/                                 # Project documentation (this folder)
│   ├── 00-project-overview.md
│   ├── 01-architecture.md
│   ├── 02-folder-structure.md
│   ├── 03-database-schema.md
│   ├── 04-api-reference.md
│   ├── 05-ui-components.md
│   ├── 06-libraries.md
│   ├── 07-video-editor-architecture.md
│   ├── 08-optimization.md
│   ├── 09-deployment.md
│   └── phases/
│       ├── section-a-setup.md
│       ├── section-b-ui.md
│       ├── section-c-server.md
│       ├── section-d-webapp.md
│       ├── section-e-converter.md
│       ├── section-f-extractor.md
│       ├── section-g-cutter.md
│       ├── section-h-ml-python.md
│       ├── section-i-ml-node.md
│       ├── section-j-electron.md
│       ├── section-k-timeline.md
│       ├── section-l-media-props.md
│       ├── section-m-effects.md
│       ├── section-n-text.md
│       ├── section-o-transitions.md
│       ├── section-p-audio-features.md
│       ├── section-q-export.md
│       ├── section-r-advanced.md
│       ├── section-s-mobile.md
│       └── section-t-polish.md
│
├── packages/
│   │
│   ├── shared/                           # Shared TypeScript types, constants, utilities
│   │   ├── package.json                  # Package config: name "@audio-sep/shared"
│   │   ├── tsconfig.json                 # Extends tsconfig.base.json
│   │   └── src/
│   │       ├── index.ts                  # Barrel export for all types/constants/utils
│   │       ├── types/
│   │       │   ├── index.ts              # Re-export all types
│   │       │   ├── audio.ts              # AudioFile, Stem, SeparationJob, AudioFormat, StemName
│   │       │   ├── video.ts              # VideoProject, Timeline, Track, Clip, Transition, Effect
│   │       │   ├── user.ts               # User, UserPreferences, Session
│   │       │   └── api.ts                # ApiResponse<T>, PaginatedResponse, ErrorResponse, all request/response DTOs
│   │       ├── constants/
│   │       │   ├── index.ts              # Re-export all constants
│   │       │   ├── formats.ts            # AUDIO_FORMATS, VIDEO_FORMATS, supported extensions/MIME types
│   │       │   ├── effects.ts            # EffectType enum, TransitionType enum, TextAnimation enum
│   │       │   └── config.ts             # MAX_FILE_SIZE, DEFAULT_BITRATE, MODEL_OPTIONS, etc.
│   │       └── utils/
│   │           ├── index.ts              # Re-export all utils
│   │           ├── time.ts               # formatDuration(), parseTimecode(), secondsToHMS()
│   │           ├── file.ts               # formatFileSize(), getExtension(), isAudioFile(), isVideoFile()
│   │           └── validation.ts         # isValidUrl(), isYouTubeUrl(), isVimeoUrl(), validateEmail()
│   │
│   └── ui/                               # Shared React component library
│       ├── package.json                  # Package config: name "@audio-sep/ui"
│       ├── tsconfig.json                 # Extends tsconfig.base.json, jsx: react-jsx
│       └── src/
│           ├── index.ts                  # Barrel export for all components/theme
│           ├── theme/
│           │   ├── index.ts              # Re-export theme
│           │   ├── dark.ts               # Dark theme tokens: colors, shadows, blur values, gradients
│           │   ├── light.ts              # Light theme tokens: colors, shadows, borders
│           │   ├── ThemeProvider.tsx      # React context provider, toggle, CSS var injection
│           │   └── animations.ts         # Framer Motion variant presets: fadeIn, slideUp, scaleIn, etc.
│           ├── components/
│           │   ├── index.ts              # Re-export all components
│           │   ├── Button.tsx            # Variants: primary, secondary, ghost, danger. Sizes: sm, md, lg. Loading state.
│           │   ├── Card.tsx              # Glassmorphism (dark), shadow (light). Hover lift animation.
│           │   ├── Modal.tsx             # Backdrop blur, animated entry/exit, sizes: sm, md, lg, full
│           │   ├── Slider.tsx            # Range input with custom track/thumb, accent color
│           │   ├── ProgressBar.tsx        # Determinate (percentage) + indeterminate (pulsing) modes
│           │   ├── Input.tsx             # Text input with label, error message, icon slots
│           │   ├── Select.tsx            # Dropdown select with custom styling
│           │   ├── FileDropzone.tsx       # Drag-and-drop zone with file validation, upload icon animation
│           │   ├── Tooltip.tsx           # Hover tooltip with arrow, placement options
│           │   ├── IconButton.tsx        # Icon-only button with tooltip
│           │   └── WaveformDisplay.tsx   # Canvas-based waveform renderer, accepts Float32Array peaks
│           └── layouts/
│               ├── index.ts              # Re-export layouts
│               ├── AppShell.tsx           # Sidebar (collapsible) + main content area, responsive
│               └── ToolPage.tsx           # Standard tool page: header (title, description) + content slot
│
├── apps/
│   │
│   ├── web/                              # React web application (Vite)
│   │   ├── package.json                  # name: "@audio-sep/web"
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts                # Aliases, proxy to API server, WASM support
│   │   ├── index.html                    # Entry HTML
│   │   ├── postcss.config.js             # PostCSS for Tailwind
│   │   ├── public/
│   │   │   ├── favicon.svg               # App icon
│   │   │   └── ffmpeg/                   # FFmpeg WASM core + worker files
│   │   │       ├── ffmpeg-core.js
│   │   │       ├── ffmpeg-core.wasm
│   │   │       └── ffmpeg-core.worker.js
│   │   └── src/
│   │       ├── main.tsx                  # React root render, QueryClientProvider, ThemeProvider
│   │       ├── App.tsx                   # AppShell + RouterOutlet
│   │       ├── router.tsx                # React Router v7 route config
│   │       ├── env.d.ts                  # Vite env type declarations
│   │       │
│   │       ├── stores/                   # Zustand state management
│   │       │   ├── themeStore.ts          # theme: dark|light, toggle()
│   │       │   ├── authStore.ts           # user, token, login(), logout(), isAuthenticated
│   │       │   ├── audioStore.ts          # currentAudioFile, uploadProgress, stems
│   │       │   ├── separatorStore.ts      # currentJob, progress, selectedModel
│   │       │   └── videoEditorStore.ts    # Wraps TimelineEngine, exposes React-friendly API
│   │       │
│   │       ├── hooks/
│   │       │   ├── useAudioContext.ts     # Create/manage Web Audio API AudioContext
│   │       │   ├── useWaveform.ts         # Extract waveform peaks from audio file
│   │       │   ├── useFFmpeg.ts           # Load FFmpeg WASM, convert/cut in browser
│   │       │   ├── useJobPolling.ts       # Poll GET /api/jobs/:id with interval
│   │       │   └── useMediaDragDrop.ts    # Drag-and-drop helpers for video editor
│   │       │
│   │       ├── pages/
│   │       │   ├── Home.tsx               # Landing page with tool cards
│   │       │   ├── AudioSeparator.tsx     # Audio separation tool page
│   │       │   ├── VideoToAudio.tsx       # Video to audio extraction page
│   │       │   ├── AudioCutter.tsx        # Audio cutting tool page
│   │       │   ├── FormatChanger.tsx      # Audio format conversion page
│   │       │   ├── VideoEditor.tsx        # Full video editor (4-panel layout)
│   │       │   ├── Settings.tsx           # User preferences page
│   │       │   └── Auth/
│   │       │       ├── Login.tsx           # Login form
│   │       │       └── Register.tsx        # Registration form
│   │       │
│   │       ├── features/
│   │       │   ├── separator/
│   │       │   │   ├── StemSelector.tsx       # Model/stem count selection
│   │       │   │   ├── SeparationProgress.tsx # Animated progress ring
│   │       │   │   ├── StemPlayer.tsx         # Multi-track audio player
│   │       │   │   └── DownloadPanel.tsx      # Stem selection + download
│   │       │   │
│   │       │   ├── cutter/
│   │       │   │   ├── WaveformEditor.tsx     # Full-width waveform with zoom
│   │       │   │   ├── RegionSelector.tsx     # Draggable region + time inputs
│   │       │   │   └── CutPreview.tsx         # Playback controls + fade controls
│   │       │   │
│   │       │   ├── converter/
│   │       │   │   ├── FormatPicker.tsx       # Grid of format buttons
│   │       │   │   ├── QualitySettings.tsx    # Bitrate/sample rate controls
│   │       │   │   └── BatchConverter.tsx     # Multi-file conversion UI
│   │       │   │
│   │       │   └── video-editor/
│   │       │       ├── engine/                # Pure TypeScript timeline engine (no React)
│   │       │       │   ├── TimelineEngine.ts
│   │       │       │   ├── ClipManager.ts
│   │       │       │   ├── PlaybackController.ts
│   │       │       │   ├── SelectionManager.ts
│   │       │       │   ├── UndoManager.ts
│   │       │       │   ├── SnapEngine.ts
│   │       │       │   ├── types.ts
│   │       │       │   └── effects/
│   │       │       │       ├── EffectRegistry.ts
│   │       │       │       ├── VideoEffect.ts     # Interface
│   │       │       │       ├── BrightnessEffect.ts
│   │       │       │       ├── ContrastEffect.ts
│   │       │       │       ├── BlurEffect.ts
│   │       │       │       ├── SaturationEffect.ts
│   │       │       │       └── ChromaKeyEffect.ts
│   │       │       │
│   │       │       ├── Timeline/
│   │       │       │   ├── Timeline.tsx
│   │       │       │   ├── TimelineTrack.tsx
│   │       │       │   ├── TimelineClip.tsx
│   │       │       │   ├── Playhead.tsx
│   │       │       │   └── TimeRuler.tsx
│   │       │       │
│   │       │       ├── Preview/
│   │       │       │   ├── VideoPreview.tsx
│   │       │       │   └── PreviewControls.tsx
│   │       │       │
│   │       │       ├── MediaBin/
│   │       │       │   ├── MediaBin.tsx
│   │       │       │   └── MediaThumbnail.tsx
│   │       │       │
│   │       │       ├── Properties/
│   │       │       │   ├── PropertiesPanel.tsx
│   │       │       │   ├── TextEditor.tsx
│   │       │       │   └── EffectControls.tsx
│   │       │       │
│   │       │       ├── Transitions/
│   │       │       │   ├── TransitionPicker.tsx
│   │       │       │   └── TransitionPreview.tsx
│   │       │       │
│   │       │       └── Export/
│   │       │           ├── ExportDialog.tsx
│   │       │           └── ExportProgress.tsx
│   │       │
│   │       ├── services/
│   │       │   ├── api.ts                 # Axios instance, base URL, auth interceptor, Electron detection
│   │       │   ├── audioApi.ts            # uploadAudio, separate, convert, cut, extract, fromUrl
│   │       │   ├── videoApi.ts            # saveProject, loadProject, exportVideo
│   │       │   └── authApi.ts             # login, register, refreshToken, getMe
│   │       │
│   │       └── styles/
│   │           └── globals.css            # Tailwind directives, custom utilities, font imports
│   │
│   ├── server/                           # Express.js API server
│   │   ├── package.json                  # name: "@audio-sep/server"
│   │   ├── tsconfig.json
│   │   ├── nodemon.json                  # Dev auto-restart config
│   │   └── src/
│   │       ├── index.ts                  # Express app, middleware stack, route mounting, Socket.IO
│   │       │
│   │       ├── config/
│   │       │   ├── db.ts                 # Mongoose connection with retry logic
│   │       │   ├── env.ts                # Zod-validated env vars (PORT, MONGO_URI, JWT_SECRET, etc.)
│   │       │   └── storage.ts            # Upload/output directory paths, file cleanup config
│   │       │
│   │       ├── middleware/
│   │       │   ├── auth.ts               # JWT Bearer token verification, req.user population
│   │       │   ├── upload.ts             # Multer config: file types, size limits, destination
│   │       │   ├── rateLimit.ts          # express-rate-limit config
│   │       │   └── errorHandler.ts       # Centralized error handler, AppError class
│   │       │
│   │       ├── models/
│   │       │   ├── User.ts               # email, passwordHash, displayName, preferences
│   │       │   ├── AudioFile.ts          # originalName, storagePath, format, duration, source
│   │       │   ├── SeparationJob.ts      # audioFileId, model, status, progress, stems[]
│   │       │   ├── ProcessingJob.ts      # type (convert/cut/export), status, input params, outputPath
│   │       │   └── VideoProject.ts       # name, resolution, fps, timeline JSON
│   │       │
│   │       ├── routes/
│   │       │   ├── auth.routes.ts        # POST register, login, refresh
│   │       │   ├── audio.routes.ts       # POST upload, separate, convert, cut, extract, from-url
│   │       │   ├── video.routes.ts       # CRUD projects, POST export
│   │       │   └── jobs.routes.ts        # GET :id status/progress
│   │       │
│   │       ├── controllers/
│   │       │   ├── auth.controller.ts    # register, login, refreshToken, getMe
│   │       │   ├── audio.controller.ts   # upload, separate, convert, cut, extract, fromUrl, download
│   │       │   ├── video.controller.ts   # createProject, getProject, updateProject, exportProject
│   │       │   └── jobs.controller.ts    # getJobStatus
│   │       │
│   │       ├── services/
│   │       │   ├── ffmpeg.service.ts     # convertAudio, cutAudio, extractAudio, buildFilterGraph
│   │       │   ├── demucs.service.ts     # spawnSeparation, parseProgress, getOutputPaths
│   │       │   ├── youtube.service.ts    # downloadFromUrl (yt-dlp wrapper)
│   │       │   ├── storage.service.ts    # saveFile, getFile, deleteFile, cleanupOldFiles
│   │       │   └── videoExport.service.ts # timelineToFFmpegCommand, assembleFilterGraph
│   │       │
│   │       └── workers/
│   │           ├── separationWorker.ts   # BullMQ worker for Demucs separation jobs
│   │           └── exportWorker.ts       # BullMQ worker for video export jobs
│   │
│   ├── desktop/                          # Electron desktop application
│   │   ├── package.json                  # name: "@audio-sep/desktop"
│   │   ├── electron-builder.yml          # Windows NSIS installer config
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── index.ts             # Electron main process: BrowserWindow, app lifecycle
│   │   │   │   ├── ipc.ts              # IPC handlers: file dialogs, local processing dispatch
│   │   │   │   ├── ffmpeg.ts           # Resolve bundled FFmpeg path, spawn FFmpeg
│   │   │   │   ├── demucs.ts           # Python venv management, Demucs installation, spawn separation
│   │   │   │   ├── menu.ts             # Application menu (File, Edit, View, Help)
│   │   │   │   └── videoExport.ts      # Local video export via FFmpeg
│   │   │   ├── preload/
│   │   │   │   └── index.ts            # contextBridge: expose IPC API to renderer
│   │   │   └── renderer/               # Points to apps/web (same codebase)
│   │   └── resources/
│   │       ├── icon.ico                 # Windows application icon
│   │       └── ffmpeg/                  # Bundled FFmpeg binary for Windows
│   │           └── ffmpeg.exe
│   │
│   └── mobile/                          # React Native mobile app
│       ├── package.json                 # name: "@audio-sep/mobile"
│       ├── app.json                     # React Native app config
│       ├── metro.config.js              # Metro bundler config (monorepo support)
│       ├── babel.config.js
│       ├── src/
│       │   ├── App.tsx                  # Root component
│       │   ├── navigation/
│       │   │   └── RootNavigator.tsx    # Bottom tab navigator
│       │   ├── screens/
│       │   │   ├── HomeScreen.tsx        # Tool cards grid
│       │   │   ├── SeparatorScreen.tsx   # Audio separator (file pick, upload, results)
│       │   │   ├── CutterScreen.tsx      # Audio cutter (waveform, trim)
│       │   │   ├── ConverterScreen.tsx   # Format converter
│       │   │   └── SettingsScreen.tsx    # Theme, server URL, cache
│       │   ├── components/              # Mobile-specific components
│       │   ├── theme/                   # Dark + light theme
│       │   └── services/
│       │       └── api.ts               # API client for Express server
│       ├── android/                     # Android native project
│       └── ios/                         # iOS native project
│
└── ml/                                  # Python ML backend
    ├── requirements.txt                 # demucs, torch, torchaudio, soundfile, fastapi, uvicorn
    ├── pyproject.toml                   # Python project metadata
    ├── Dockerfile                       # Container build (optional)
    ├── src/
    │   ├── __init__.py
    │   ├── separate.py                  # CLI: python separate.py --input <path> --output <dir> --model htdemucs_6s
    │   ├── server.py                    # FastAPI HTTP server (alternative to CLI)
    │   ├── config.py                    # Model paths, default params, output settings
    │   ├── models/
    │   │   ├── __init__.py
    │   │   └── demucs_wrapper.py        # Model loading, caching, inference, GPU/CPU fallback
    │   └── utils/
    │       ├── __init__.py
    │       ├── audio_io.py              # Load/save audio with soundfile, format conversion
    │       └── gpu_check.py             # CUDA detection, RAM check, model recommendation
    └── models/                          # Downloaded model weights (gitignored)
        └── .gitkeep
```
