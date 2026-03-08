# Section J: Electron Desktop App (Phases 099-110)

## Progress Checklist
- [x] Phase 099 - Electron Scaffold (package.json, folder structure)
- [x] Phase 100 - Main Process Entry (BrowserWindow)
- [x] Phase 101 - Preload Script (contextBridge API)
- [x] Phase 102 - Application Menu (File, Edit, View, Help)
- [x] Phase 103 - Bundle FFmpeg (ffmpeg.exe, path resolution)
- [x] Phase 104 - Local FFmpeg IPC (convert, cut, extract handlers)
- [x] Phase 105 - Python Environment Manager (venv, install Demucs)
- [x] Phase 106 - Local Separation IPC (spawn Demucs locally)
- [x] Phase 107 - Electron Detection (isElectron, IPC routing)
- [x] Phase 108 - Electron Store (persistent settings)
- [x] Phase 109 - Electron Builder Config (NSIS installer)
- [x] Phase 110 - Build Windows EXE (package and test)

---

## Phase 099 - Electron Scaffold
**Status:** Pending

### Tasks:
1. Create `apps/desktop/package.json`:
   - name: "@audio-sep/desktop"
   - main: "dist/main/index.js"
   - dependencies: electron-store
   - devDependencies: electron, electron-builder, typescript
   - scripts: dev, build, package
2. Create `apps/desktop/tsconfig.json`
3. Create folder structure: src/main/, src/preload/, resources/

---

## Phase 100 - Main Process Entry
**Status:** Pending

### Tasks:
1. Create `apps/desktop/src/main/index.ts`:
   - Create BrowserWindow (1280x800, min 800x600)
   - Load web app URL in dev: http://localhost:5173
   - Load built web app in prod: file://dist/renderer/index.html
   - Window settings: frame, title bar, icon
   - App lifecycle: ready, window-all-closed, activate

---

## Phase 101 - Preload Script
**Status:** Pending

### Tasks:
1. Create `apps/desktop/src/preload/index.ts`:
   - contextBridge.exposeInMainWorld('electronAPI', { ... })
   - Exposed methods:
     - `openFileDialog(filters)`: open native file picker
     - `saveFileDialog(defaultName)`: save dialog
     - `convertAudio(input, output, options)`: local FFmpeg conversion
     - `cutAudio(input, output, options)`: local FFmpeg cut
     - `extractAudio(input, output, format)`: local FFmpeg extract
     - `separateAudio(input, output, model)`: local Python Demucs
     - `onProgress(callback)`: receive progress updates
     - `getAppVersion()`: return app version
     - `getPlatform()`: return 'electron'

---

## Phase 102 - Application Menu
**Status:** Pending

### Tasks:
1. Create `apps/desktop/src/main/menu.ts`:
   - File menu: Open File, Save, Exit
   - Edit menu: Undo, Redo, Cut, Copy, Paste
   - View menu: Toggle DevTools, Reload, Zoom In/Out, Fullscreen
   - Help menu: About, Check for Updates

---

## Phase 103 - Bundle FFmpeg
**Status:** Pending

### Tasks:
1. Download FFmpeg static build for Windows (ffmpeg.exe)
2. Place in `apps/desktop/resources/ffmpeg/ffmpeg.exe`
3. Create `apps/desktop/src/main/ffmpeg.ts`:
   - `getFFmpegPath()`: resolve path to bundled FFmpeg binary
   - In dev: use system FFmpeg
   - In prod: use bundled binary from app resources directory
   - Verify binary exists and is executable

---

## Phase 104 - Local FFmpeg IPC
**Status:** Pending

### Tasks:
1. Update `apps/desktop/src/main/ipc.ts`:
   - IPC handler: `convert-audio` → spawn FFmpeg, stream progress, return output path
   - IPC handler: `cut-audio` → spawn FFmpeg with trim options
   - IPC handler: `extract-audio` → spawn FFmpeg with -vn flag
   - All handlers: parse FFmpeg progress output, send to renderer via IPC

---

## Phase 105 - Python Environment Manager
**Status:** Pending

### Tasks:
1. Create `apps/desktop/src/main/demucs.ts`:
   - `checkPythonInstalled()`: check if python3 is in PATH
   - `checkDemucsInstalled()`: check if demucs package is installed
   - `setupVirtualEnv()`: create Python venv in app data directory
   - `installDemucs()`: pip install demucs + dependencies in venv
   - `getSetupStatus()`: return { pythonInstalled, demucsInstalled, venvPath }
   - First-run wizard: prompt user to install Python if missing, auto-install Demucs

---

## Phase 106 - Local Separation IPC
**Status:** Pending

### Tasks:
1. Add to IPC handlers:
   - `separate-audio`: spawn Python process with Demucs
   - Use venv Python path (from demucs.ts)
   - Stream PROGRESS:N to renderer
   - Return stem file paths on completion
   - Handle errors (Python not installed, model download, etc.)

---

## Phase 107 - Electron Detection
**Status:** Pending

### Tasks:
1. Update `apps/web/src/services/api.ts`:
   - Add `isElectron()` check: `window.electronAPI !== undefined`
   - If Electron: route processing calls through IPC instead of HTTP
   - Create `electronApi.ts` service that wraps window.electronAPI calls
   - Auth: in Electron local mode, skip auth (single user, local files)

---

## Phase 108 - Electron Store
**Status:** Pending

### Tasks:
1. Add electron-store for persistent settings:
   - Theme preference
   - Default output format
   - Default separation model
   - Last used directories
   - Window position and size
2. IPC handlers to get/set settings

---

## Phase 109 - Electron Builder Config
**Status:** Pending

### Tasks:
1. Create `apps/desktop/electron-builder.yml`:
   - Windows NSIS installer
   - App ID, product name, icon
   - Include bundled FFmpeg in extraResources
   - File associations: .mp3, .wav, .flac (optional)
   - Auto-updater config (for future)
   - Installer options: per-user install, desktop shortcut

---

## Phase 110 - Build Windows EXE
**Status:** Pending

### Tasks:
1. Build web app: `npm run build --workspace=apps/web`
2. Copy web app build output to desktop renderer directory
3. Build Electron: `npm run build --workspace=apps/desktop`
4. Package: `npm run package --workspace=apps/desktop`
5. Test installer: run the .exe installer
6. Test installed app: open, separate audio, verify offline works

### Section J Verification:
- Built .exe installs on Windows
- App opens with proper icon and title
- Theme toggle works
- Open file dialog works
- Upload audio → separate → stems play → download
- All processing works offline (no server needed)
- Convert audio format works locally
- Cut audio works locally
- Settings persist across app restarts
