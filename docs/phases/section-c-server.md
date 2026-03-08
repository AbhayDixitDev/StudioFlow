# Section C: Express API Server (Phases 026-040)

## Progress Checklist
- [x] Phase 026 - Server Scaffold (Express app, package.json)
- [x] Phase 027 - Env + Config (zod env validation)
- [x] Phase 028 - MongoDB Connection (Mongoose connect)
- [x] Phase 029 - Storage Config (directory paths, helpers)
- [x] Phase 030 - User Model (Mongoose schema, bcrypt)
- [x] Phase 031 - AudioFile Model (Mongoose schema)
- [x] Phase 032 - SeparationJob Model (Mongoose schema)
- [x] Phase 033 - ProcessingJob Model (Mongoose schema)
- [x] Phase 034 - Auth Middleware (JWT verification)
- [x] Phase 035 - Upload Middleware (Multer config)
- [x] Phase 036 - Error Handler (AppError class, global handler)
- [x] Phase 037 - Security Middleware (CORS, helmet, rate-limit)
- [x] Phase 038 - Auth Routes + Controller (register, login, refresh, me)
- [x] Phase 039 - Storage Service (file save/delete/stream)
- [x] Phase 040 - Audio Upload Route (POST /api/audio/upload)

---

## Phase 026 - Server Scaffold
**Status:** Pending
**Goal:** Create the Express.js server package.

### Tasks:
1. Create `apps/server/package.json`:
   - name: "@audio-sep/server"
   - dependencies: express, mongoose, cors, helmet, dotenv
   - devDependencies: tsx, nodemon, @types/express, typescript
   - scripts: dev (nodemon + tsx), build (tsc), start (node dist/index.js)
2. Create `apps/server/tsconfig.json` extending base
3. Create `apps/server/nodemon.json`: watch src/, ext ts
4. Create `apps/server/src/index.ts`:
   - Import express, create app
   - Basic middleware (json, urlencoded)
   - Health check route: GET /api/health
   - Listen on PORT from env

---

## Phase 027 - Env + Config
**Status:** Pending

### Tasks:
1. Create `apps/server/src/config/env.ts`:
   - Use zod to define and validate env schema
   - Required: PORT, MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET
   - Optional with defaults: UPLOAD_DIR, OUTPUT_DIR, MAX_FILE_SIZE, CORS_ORIGIN
   - Parse process.env and export typed config object

---

## Phase 028 - MongoDB Connection
**Status:** Pending

### Tasks:
1. Create `apps/server/src/config/db.ts`:
   - `connectDB()` async function
   - Mongoose.connect with retry logic (3 attempts)
   - Log connection success/failure
   - Handle connection events (error, disconnected)
   - Call from index.ts on startup

---

## Phase 029 - Storage Config
**Status:** Pending

### Tasks:
1. Create `apps/server/src/config/storage.ts`:
   - Define directory paths: uploads, outputs, converted, cut, exports, thumbnails
   - `ensureDirectories()` function: create all dirs if not exist
   - `getUploadPath(userId)`: returns upload directory for user
   - `getOutputPath(userId, jobId)`: returns output directory for job

---

## Phase 030 - User Model
**Status:** Pending

### Tasks:
1. Create `apps/server/src/models/User.ts`:
   - Mongoose schema matching docs/03-database-schema.md
   - Email: unique, lowercase, trimmed, regex validated
   - passwordHash: required
   - displayName: required, max 50
   - preferences: sub-document with defaults
   - timestamps: true
   - Index on email
   - Pre-save hook: hash password if modified (bcrypt, 12 rounds)
   - Instance method: `comparePassword(candidate): Promise<boolean>`

---

## Phase 031 - AudioFile Model
**Status:** Pending

### Tasks:
1. Create `apps/server/src/models/AudioFile.ts`:
   - Schema with all fields from database docs
   - userId: ref to User, indexed
   - Compound index: { userId: 1, createdAt: -1 }
   - Virtual for download URL

---

## Phase 032 - SeparationJob Model
**Status:** Pending

### Tasks:
1. Create `apps/server/src/models/SeparationJob.ts`:
   - Schema with status enum, progress (0-100), stems array
   - Indexes: { userId: 1 }, { status: 1 }, { audioFileId: 1 }
   - Virtual for isComplete

---

## Phase 033 - ProcessingJob Model
**Status:** Pending

### Tasks:
1. Create `apps/server/src/models/ProcessingJob.ts`:
   - Schema with type enum (convert/cut/video-export)
   - Flexible input sub-document for type-specific params
   - Indexes: { userId: 1, type: 1 }, { status: 1 }

---

## Phase 034 - Auth Middleware
**Status:** Pending

### Tasks:
1. Create `apps/server/src/middleware/auth.ts`:
   - Extract Bearer token from Authorization header
   - Verify JWT using jsonwebtoken
   - Find user by decoded ID
   - Attach user to req object (`req.user`)
   - Return 401 if token missing/invalid/expired
   - TypeScript: extend Express Request type with user property

---

## Phase 035 - Upload Middleware
**Status:** Pending

### Tasks:
1. Create `apps/server/src/middleware/upload.ts`:
   - Configure Multer with:
     - Storage: disk storage, destination based on userId
     - Filename: UUID + original extension
     - File filter: whitelist audio + video MIME types
     - Limits: MAX_FILE_SIZE from env
   - Export configured middleware for single and array uploads

---

## Phase 036 - Error Handler
**Status:** Pending

### Tasks:
1. Create `apps/server/src/middleware/errorHandler.ts`:
   - `AppError` class extending Error: statusCode, code, isOperational
   - Pre-defined errors: ValidationError, NotFoundError, UnauthorizedError, etc.
   - Global error handler middleware (4-arg function)
   - In dev: full stack trace
   - In prod: clean error message only
   - Handle Mongoose validation errors
   - Handle Multer errors (file too large, etc.)

---

## Phase 037 - Security Middleware
**Status:** Pending

### Tasks:
1. Update `apps/server/src/index.ts` to add:
   - `cors({ origin: CORS_ORIGIN, credentials: true })`
   - `helmet()` with sensible defaults
   - `rateLimit({ windowMs: 15*60*1000, max: 100 })` from express-rate-limit
2. Create `apps/server/src/middleware/rateLimit.ts`:
   - Default rate limiter
   - Strict rate limiter for auth routes (20 req/15min)
   - Relaxed rate limiter for file download (200 req/15min)

---

## Phase 038 - Auth Routes + Controller
**Status:** Pending

### Tasks:
1. Create `apps/server/src/controllers/auth.controller.ts`:
   - `register`: validate input, check email uniqueness, create user, generate tokens
   - `login`: find user by email, compare password, generate tokens
   - `refreshToken`: verify refresh token, generate new token pair
   - `getMe`: return current user (from req.user)
   - Token generation: JWT with userId, exp (access: 7d, refresh: 30d)
2. Create `apps/server/src/routes/auth.routes.ts`:
   - POST /register → register
   - POST /login → login
   - POST /refresh → refreshToken
   - GET /me → auth middleware → getMe
3. Mount in index.ts: `app.use('/api/auth', authRoutes)`

---

## Phase 039 - Storage Service
**Status:** Pending

### Tasks:
1. Create `apps/server/src/services/storage.service.ts`:
   - `saveFile(userId, file, category)`: move uploaded file to correct directory
   - `getFilePath(userId, filename, category)`: resolve full path
   - `deleteFile(filePath)`: remove file from disk
   - `getFileStream(filePath)`: return ReadStream for download
   - `cleanupOldFiles(category, maxAgeHours)`: delete files older than N hours
   - `getDirectorySize(dirPath)`: calculate total size

---

## Phase 040 - Audio Upload Route
**Status:** Pending

### Tasks:
1. Create `apps/server/src/controllers/audio.controller.ts`:
   - `upload`: receive file via Multer, probe with FFmpeg for metadata (duration, sampleRate, channels), create AudioFile document, return response
2. Create `apps/server/src/routes/audio.routes.ts`:
   - POST /upload → auth + upload middleware → upload controller
3. Mount: `app.use('/api/audio', audioRoutes)`

### Section C Verification:
- `npm run dev --workspace=apps/server` starts without errors
- `POST /api/auth/register` creates user and returns token
- `POST /api/auth/login` returns token for valid credentials
- `POST /api/audio/upload` with file saves to disk and returns metadata
- `GET /api/health` returns { status: "ok" }
