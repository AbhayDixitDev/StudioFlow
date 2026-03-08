# Section A: Project Setup (Phases 001-010)

## Progress Checklist
- [x] Phase 001 - Init Monorepo (package.json, .gitignore, .env.example)
- [x] Phase 002 - Turborepo Setup (turbo.json)
- [x] Phase 003 - Shared Package Scaffold (packages/shared structure)
- [x] Phase 004 - Shared Types: Audio (adapted to JS - no type files)
- [x] Phase 005 - Shared Types: Video & User (adapted to JS - no type files)
- [x] Phase 006 - Shared Types: API (adapted to JS - no type files)
- [x] Phase 007 - Shared Constants (formats.js, effects.js, config.js)
- [x] Phase 008 - Shared Utils (time.js, file.js, validation.js)
- [x] Phase 009 - Prettier Config (.prettierrc)
- [x] Phase 010 - Verify Setup (npm install + turbo build passes)

> NOTE: Converted to plain JavaScript per user request. TypeScript type-only files removed. Constants and utils kept as .js.

---

## Phase 001 - Init Monorepo
**Status:** Pending
**Goal:** Create the root project with npm workspaces.

### Tasks:
1. Create root `package.json` with:
   - `name`: "audio-separator"
   - `private`: true
   - `workspaces`: ["packages/*", "apps/*"]
   - Scripts: `dev`, `build`, `lint`
2. Create `.gitignore` with rules for: node_modules, dist, .env, data/, ml/models/, ml/venv/, *.exe
3. Create `.env.example` with all environment variables (see docs/09-deployment.md)
4. Run `git init`

### Files Created:
- `package.json`
- `.gitignore`
- `.env.example`

### Verification:
- `npm --version` outputs 10+
- `package.json` is valid JSON

---

## Phase 002 - Turborepo Setup
**Status:** Pending
**Goal:** Configure Turborepo for build orchestration.

### Tasks:
1. Install turbo as root devDependency: `npm install turbo -D`
2. Create `turbo.json` with pipelines:
   - `build`: depends on `^build` (topological)
   - `dev`: persistent, no cache
   - `lint`: no dependencies
3. Create `tsconfig.base.json` with shared TypeScript settings:
   - target: ES2022
   - module: ESNext
   - moduleResolution: bundler
   - strict: true
   - jsx: react-jsx

### Files Created:
- `turbo.json`
- `tsconfig.base.json`

### Verification:
- `npx turbo build` runs (may have no packages yet)

---

## Phase 003 - Shared Types Package Scaffold
**Status:** Pending
**Goal:** Create the `packages/shared` package structure.

### Tasks:
1. Create `packages/shared/package.json`:
   - name: "@audio-sep/shared"
   - main: "dist/index.js"
   - types: "dist/index.d.ts"
   - scripts: build (tsc)
2. Create `packages/shared/tsconfig.json` extending base
3. Create directory structure: `src/types/`, `src/constants/`, `src/utils/`
4. Create `src/index.ts` barrel export

### Files Created:
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/index.ts`

---

## Phase 004 - Shared Types: Audio
**Status:** Pending
**Goal:** Define all audio-related TypeScript types.

### Tasks:
1. Create `packages/shared/src/types/audio.ts` with:
   - `AudioFormat` type: 'mp3' | 'wav' | 'flac' | 'ogg' | 'aac' | 'm4a' | 'wma'
   - `StemName` type: 'vocals' | 'drums' | 'bass' | 'guitar' | 'piano' | 'other'
   - `SeparationModel` type: 'htdemucs' | 'htdemucs_6s' | 'mdx_extra'
   - `JobStatus` type: 'queued' | 'processing' | 'completed' | 'failed'
   - `AudioFile` interface (matches MongoDB schema)
   - `Stem` interface: { name, storagePath, fileSize, format }
   - `SeparationJob` interface (matches MongoDB schema)
   - `ProcessingJob` interface
2. Create `packages/shared/src/types/index.ts` re-exporting all

### Files Created:
- `packages/shared/src/types/audio.ts`
- `packages/shared/src/types/index.ts`

---

## Phase 005 - Shared Types: Video & User
**Status:** Pending
**Goal:** Define video project and user types.

### Tasks:
1. Create `packages/shared/src/types/video.ts` with:
   - `TrackType`: 'video' | 'audio' | 'text' | 'image'
   - `TransitionType`: 'crossfade' | 'slideLeft' | ... etc
   - `EffectType`: 'brightness' | 'contrast' | ... etc
   - `Track` interface
   - `Clip` interface (all properties from DB schema)
   - `Timeline` interface: { tracks: Track[] }
   - `VideoProject` interface
   - `ExportSettings` interface
2. Create `packages/shared/src/types/user.ts` with:
   - `UserPreferences` interface
   - `User` interface
   - `Session` interface: { user, token, refreshToken }

### Files Created:
- `packages/shared/src/types/video.ts`
- `packages/shared/src/types/user.ts`

---

## Phase 006 - Shared Types: API
**Status:** Pending
**Goal:** Define API request/response types.

### Tasks:
1. Create `packages/shared/src/types/api.ts` with:
   - `ApiResponse<T>`: { success: true, data: T }
   - `ApiError`: { success: false, error: { code, message, details? } }
   - `PaginatedResponse<T>`: ApiResponse with pagination metadata
   - `LoginRequest`, `LoginResponse`
   - `RegisterRequest`, `RegisterResponse`
   - `SeparateRequest`, `ConvertRequest`, `CutRequest`
   - `ExtractRequest`, `FromUrlRequest`
   - `JobStatusResponse`
   - `ExportRequest`

### Files Created:
- `packages/shared/src/types/api.ts`

---

## Phase 007 - Shared Constants
**Status:** Pending
**Goal:** Define app-wide constants.

### Tasks:
1. Create `packages/shared/src/constants/formats.ts`:
   - `AUDIO_FORMATS`: array of { extension, mimeType, label }
   - `VIDEO_FORMATS`: array of { extension, mimeType, label }
   - `SUPPORTED_UPLOAD_TYPES`: combined MIME types for file validation
   - `MAX_FILE_SIZE`: 500MB in bytes
2. Create `packages/shared/src/constants/effects.ts`:
   - `EFFECT_TYPES`: array of effect definitions
   - `TRANSITION_TYPES`: array of transition definitions
   - `TEXT_ANIMATIONS`: array of text animation presets
3. Create `packages/shared/src/constants/config.ts`:
   - `DEFAULT_BITRATE`: '192k'
   - `DEFAULT_SAMPLE_RATE`: 44100
   - `MODEL_OPTIONS`: array of { id, name, stems, description }
   - `EXPORT_PRESETS`: predefined export settings
4. Create `packages/shared/src/constants/index.ts` re-export

### Files Created:
- `packages/shared/src/constants/formats.ts`
- `packages/shared/src/constants/effects.ts`
- `packages/shared/src/constants/config.ts`
- `packages/shared/src/constants/index.ts`

---

## Phase 008 - Shared Utils
**Status:** Pending
**Goal:** Create shared utility functions.

### Tasks:
1. Create `packages/shared/src/utils/time.ts`:
   - `formatDuration(seconds: number): string` → "3:45" or "1:02:30"
   - `parseTimecode(timecode: string): number` → seconds
   - `secondsToHMS(seconds: number): { h, m, s, ms }`
   - `formatTimecode(seconds: number): string` → "00:03:45.500"
2. Create `packages/shared/src/utils/file.ts`:
   - `formatFileSize(bytes: number): string` → "5.2 MB"
   - `getExtension(filename: string): string` → "mp3"
   - `isAudioFile(filename: string): boolean`
   - `isVideoFile(filename: string): boolean`
   - `isImageFile(filename: string): boolean`
3. Create `packages/shared/src/utils/validation.ts`:
   - `isValidUrl(url: string): boolean`
   - `isYouTubeUrl(url: string): boolean`
   - `isVimeoUrl(url: string): boolean`
   - `isDirectVideoUrl(url: string): boolean`
   - `validateEmail(email: string): boolean`
4. Create `packages/shared/src/utils/index.ts` re-export

### Files Created:
- `packages/shared/src/utils/time.ts`
- `packages/shared/src/utils/file.ts`
- `packages/shared/src/utils/validation.ts`
- `packages/shared/src/utils/index.ts`

---

## Phase 009 - ESLint + Prettier
**Status:** Pending
**Goal:** Configure code quality tools.

### Tasks:
1. Install at root: eslint, prettier, @typescript-eslint/*, eslint-plugin-react, eslint-plugin-react-hooks, eslint-config-prettier
2. Create `.eslintrc.js` (flat config) with:
   - TypeScript rules (strict)
   - React rules
   - React hooks rules
   - Prettier integration
3. Create `.prettierrc`:
   - singleQuote: true
   - semi: true
   - tabWidth: 2
   - trailingComma: 'es5'
   - printWidth: 100
4. Add `lint` script to root package.json

### Files Created:
- `.eslintrc.js`
- `.prettierrc`

---

## Phase 010 - Verify Setup
**Status:** Pending
**Goal:** Verify everything compiles and works together.

### Tasks:
1. Run `npm install` from root
2. Run `npm run build` (Turborepo builds packages/shared)
3. Verify `packages/shared/dist/` contains compiled JS + type definitions
4. Verify types can be imported: create a quick test import

### Verification:
- `npm run build` exits with code 0
- `packages/shared/dist/index.js` exists
- `packages/shared/dist/index.d.ts` exists
- No TypeScript errors
