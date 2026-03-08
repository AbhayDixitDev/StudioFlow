# Dependencies & Libraries

Complete list of every npm package and Python dependency used across the project.

---

## Root (`package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `turbo` | ^2.3 | Monorepo build orchestration (pipelines, caching) |
| `typescript` | ^5.5 | Type safety across all packages |
| `eslint` | ^9 | Code linting (flat config) |
| `prettier` | ^3.4 | Code formatting |
| `@typescript-eslint/eslint-plugin` | ^8 | TypeScript-specific lint rules |
| `@typescript-eslint/parser` | ^8 | TypeScript parser for ESLint |
| `eslint-plugin-react` | ^7 | React-specific lint rules |
| `eslint-plugin-react-hooks` | ^5 | React hooks lint rules |
| `eslint-config-prettier` | ^9 | Disable ESLint rules conflicting with Prettier |

---

## `packages/shared`

| Package | Version | Purpose |
|---------|---------|---------|
| `zod` | ^3.23 | Runtime type validation, schema definition |
| `typescript` | ^5.5 | (devDep) Compilation |

---

## `packages/ui`

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19 | UI framework |
| `react-dom` | ^19 | DOM rendering |
| `tailwindcss` | ^4 | Utility-first CSS framework |
| `framer-motion` | ^12 | Animations: page transitions, hover effects, mount animations |
| `lucide-react` | ^0.460 | Icon library (400+ icons, tree-shakeable) |
| `clsx` | ^2.1 | Conditional className construction |
| `tailwind-merge` | ^2.6 | Merge Tailwind classes without conflicts |

---

## `apps/web`

| Package | Version | Purpose |
|---------|---------|---------|
| **Build** | | |
| `vite` | ^6 | Build tool, dev server, HMR |
| `@vitejs/plugin-react` | ^4 | React Fast Refresh for Vite |
| `postcss` | ^8 | CSS processing (Tailwind) |
| **Routing** | | |
| `react-router` | ^7 | Client-side routing |
| `react-router-dom` | ^7 | DOM bindings for React Router |
| **State** | | |
| `zustand` | ^5 | Lightweight state management |
| `@tanstack/react-query` | ^5 | Server state, caching, polling, mutations |
| **HTTP** | | |
| `axios` | ^1.7 | HTTP client with interceptors |
| `socket.io-client` | ^4.8 | WebSocket client for real-time job progress |
| **Audio** | | |
| `wavesurfer.js` | ^7 | Waveform rendering and audio playback |
| `tone.js` | ^15 | Web Audio API helpers for multi-track stem playback |
| **Video (WASM)** | | |
| `@ffmpeg/ffmpeg` | ^0.12 | FFmpeg compiled to WebAssembly |
| `@ffmpeg/util` | ^0.12 | FFmpeg WASM utilities |
| **Video Editor** | | |
| `react-dnd` | ^16 | Drag and drop (timeline clips, media bin) |
| `react-dnd-html5-backend` | ^16 | HTML5 drag-and-drop backend |
| `fabric` | ^6 | Canvas rendering (video preview compositor) |
| `uuid` | ^10 | Generate unique IDs for clips, tracks, effects |
| **UI Utils** | | |
| `react-hot-toast` | ^2.4 | Toast notifications |
| `react-helmet-async` | ^2 | SEO meta tags |
| `@radix-ui/react-dialog` | ^1 | Accessible modal primitives (optional) |
| `@radix-ui/react-tooltip` | ^1 | Accessible tooltip primitives (optional) |

---

## `apps/server`

| Package | Version | Purpose |
|---------|---------|---------|
| **Framework** | | |
| `express` | ^5 | HTTP server framework |
| `cors` | ^2.8 | Cross-Origin Resource Sharing |
| `helmet` | ^8 | Security headers (CSP, HSTS, etc.) |
| `express-rate-limit` | ^7 | Rate limiting middleware |
| **Database** | | |
| `mongoose` | ^8 | MongoDB ODM (schemas, validation, queries) |
| **Auth** | | |
| `jsonwebtoken` | ^9 | JWT token creation and verification |
| `bcrypt` | ^5 | Password hashing |
| **File Upload** | | |
| `multer` | ^1.4 | Multipart form-data file upload handling |
| **Job Queue** | | |
| `bullmq` | ^5 | Redis-backed job queue (separation, export jobs) |
| `ioredis` | ^5 | Redis client for BullMQ |
| **A/V Processing** | | |
| `fluent-ffmpeg` | ^2.1 | Node.js FFmpeg wrapper (convert, cut, extract, export) |
| `yt-dlp-wrap` | ^2 | yt-dlp wrapper for downloading from YouTube/video URLs |
| **Real-time** | | |
| `socket.io` | ^4.8 | WebSocket server for real-time progress events |
| **Validation** | | |
| `zod` | ^3.23 | Request body/query validation |
| **Dev** | | |
| `tsx` | ^4 | TypeScript execution (dev server) |
| `nodemon` | ^3 | Auto-restart on file changes |
| `@types/express` | ^5 | Express type definitions |
| `@types/multer` | ^1 | Multer type definitions |
| `@types/bcrypt` | ^5 | Bcrypt type definitions |
| `@types/jsonwebtoken` | ^9 | JWT type definitions |

---

## `apps/desktop`

| Package | Version | Purpose |
|---------|---------|---------|
| `electron` | ^34 | Desktop app shell (Chromium + Node.js) |
| `electron-builder` | ^25 | Package as Windows .exe (NSIS installer) |
| `electron-store` | ^10 | Local key-value settings persistence |
| `electron-updater` | ^6 | Auto-update support (future) |

**Bundled binaries:**
- `ffmpeg.exe` - FFmpeg binary for Windows (included in resources/)
- Python 3.11+ - User must have installed, or we bundle embedded Python

---

## `apps/mobile`

| Package | Version | Purpose |
|---------|---------|---------|
| `react-native` | ^0.77 | Mobile framework |
| `@react-navigation/native` | ^7 | Navigation framework |
| `@react-navigation/bottom-tabs` | ^7 | Bottom tab navigator |
| `@react-navigation/stack` | ^7 | Stack navigator |
| `react-native-document-picker` | ^9 | Native file picker dialog |
| `react-native-fs` | ^2.20 | File system access (read/write/delete) |
| `expo-av` | ^14 | Audio playback |
| `react-native-safe-area-context` | ^4 | Safe area insets |
| `react-native-screens` | ^4 | Native screen containers |
| `react-native-gesture-handler` | ^2 | Touch gestures |
| `axios` | ^1.7 | HTTP client |
| `zustand` | ^5 | State management (shared patterns with web) |

---

## `ml/` (Python)

| Package | Version | Purpose |
|---------|---------|---------|
| `demucs` | latest | Meta's audio source separation model |
| `torch` | ^2.4 | PyTorch (Demucs dependency, GPU acceleration) |
| `torchaudio` | ^2.4 | Audio I/O for PyTorch |
| `soundfile` | ^0.12 | Read/write audio files (wav, flac, ogg) |
| `numpy` | ^1.26 | Numerical operations (Demucs dependency) |
| `fastapi` | ^0.115 | HTTP API server (optional mode) |
| `uvicorn` | ^0.32 | ASGI server for FastAPI |
| `pydantic` | ^2.9 | Data validation for FastAPI |

**System dependencies:**
- Python 3.10+
- FFmpeg binary (system-wide or bundled)
- CUDA toolkit (optional, for GPU acceleration)

---

## External Tools (System-Level)

| Tool | Purpose |
|------|---------|
| FFmpeg | Audio/video conversion, cutting, extraction, video export |
| yt-dlp | Download videos/audio from YouTube and other sites |
| Redis | Job queue backend for BullMQ (server mode) |
| MongoDB | Primary database |

---

## Version Pinning Strategy

- Major versions pinned with caret (`^`): allows minor/patch updates
- Lock file (`package-lock.json`) committed for reproducible installs
- Python `requirements.txt` uses `>=` with upper bounds for safety
- Electron version critical: test thoroughly before upgrading
