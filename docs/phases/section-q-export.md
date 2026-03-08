# Section Q: Video Editor - Export (Phases 168-177)

## Progress Checklist
- [x] Phase 168 - VideoProject Mongoose Model
- [x] Phase 169 - Project Save API (POST, PUT)
- [x] Phase 170 - Project Load API (GET, DELETE)
- [x] Phase 171 - Auto-Save (debounced save on changes)
- [x] Phase 172 - ExportDialog UI (resolution, format, quality)
- [x] Phase 173 - FFmpeg Filter Graph Builder (timeline to FFmpeg)
- [x] Phase 174 - Export Worker (BullMQ background rendering)
- [x] Phase 175 - ExportProgress UI (progress bar, cancel, download)
- [x] Phase 176 - Electron Local Export (local FFmpeg rendering)
- [x] Phase 177 - Export Presets (YouTube, Instagram, TikTok, etc.)

---

## Phase 168 - VideoProject Mongoose Model
**Status:** Pending

### Tasks:
1. Create `apps/server/src/models/VideoProject.ts`:
   - Full schema from docs/03-database-schema.md
   - userId ref, name, resolution, fps, aspectRatio, duration
   - timeline: nested tracks and clips (stored as JSON)
   - mediaFiles: references to uploaded media
   - Indexes: { userId: 1 }, { userId: 1, updatedAt: -1 }

---

## Phase 169 - Project Save API
**Status:** Pending

### Tasks:
1. Create `apps/server/src/controllers/video.controller.ts`:
   - `createProject`: create new VideoProject with defaults
   - `updateProject`: update full project data (timeline, settings)
2. Create `apps/server/src/routes/video.routes.ts`:
   - POST /api/video/projects → auth → createProject
   - PUT /api/video/projects/:id → auth → updateProject
3. Mount in index.ts

---

## Phase 170 - Project Load API
**Status:** Pending

### Tasks:
1. Add to video controller:
   - `getProjects`: list user's projects (name, thumbnail, updatedAt) - no full timeline
   - `getProject`: get single project with full timeline data
   - `deleteProject`: remove project and associated files
2. Add routes:
   - GET /api/video/projects → auth → getProjects
   - GET /api/video/projects/:id → auth → getProject
   - DELETE /api/video/projects/:id → auth → deleteProject

---

## Phase 171 - Auto-Save
**Status:** Pending

### Tasks:
1. Update videoEditorStore.ts:
   - Debounced save: after any timeline change, wait 3 seconds of inactivity, then save
   - Use TanStack React Query mutation for save
   - Show save indicator in top bar: "Saving...", "Saved", "Error saving"
   - Queue saves: if a save is in progress, queue the next one
   - Don't save during playback (wait until pause)

---

## Phase 172 - ExportDialog UI
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/Export/ExportDialog.tsx`:
   - Modal dialog opened by Export button in top bar
   - Resolution picker: 720p, 1080p, 1440p, 4K, Custom
   - Format selector: MP4 (H.264), WebM (VP9), MOV
   - Quality: Low, Medium, High, Ultra (maps to CRF values)
   - FPS: 24, 30, 60
   - Audio: AAC bitrate (128k, 192k, 256k, 320k)
   - Estimated file size display
   - Export button → start export job

---

## Phase 173 - FFmpeg Filter Graph Builder
**Status:** Pending

### Tasks:
1. Create `apps/server/src/services/videoExport.service.ts`:
   - `buildExportCommand(project, settings)`:
     - Convert timeline JSON to FFmpeg complex filter graph
     - Each clip → FFmpeg input (-i)
     - Video clips: trim, setpts, scale, overlay
     - Position/transform: overlay filter with x, y coordinates
     - Effects: eq (brightness/contrast), boxblur, chromakey filters
     - Transitions: xfade filter between adjacent clips
     - Text: drawtext filter with font, size, color, position
     - Audio: atrim, volume, amix, concat for audio tracks
     - Output: -c:v libx264/libvpx-vp9, -c:a aac, resolution, fps
   - Return complete ffmpeg command as string array

---

## Phase 174 - Export Worker
**Status:** Pending

### Tasks:
1. Create `apps/server/src/workers/exportWorker.ts`:
   - BullMQ Worker on "video-export" queue
   - Job data: { projectId, userId, exportSettings }
   - Process:
     1. Load project from DB
     2. Build FFmpeg command via videoExport.service
     3. Spawn FFmpeg process
     4. Parse progress from FFmpeg output (frame count / total frames)
     5. Update ProcessingJob progress in DB
     6. Emit Socket.IO events
     7. On completion: update status, store output path

---

## Phase 175 - ExportProgress UI
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/Export/ExportProgress.tsx`:
   - Replace ExportDialog after export starts
   - Large progress bar with percentage
   - Elapsed time display
   - Estimated remaining time
   - Current step text ("Rendering frame 450/1800...")
   - Cancel button (sends cancel signal to worker)
   - On completion: download button + preview player

---

## Phase 176 - Electron Local Export
**Status:** Pending

### Tasks:
1. Create `apps/desktop/src/main/videoExport.ts`:
   - Receive project timeline data via IPC
   - Build FFmpeg command locally (same logic as server)
   - Use bundled FFmpeg binary
   - Spawn FFmpeg process
   - Stream progress to renderer via IPC
   - Save dialog for output file location
   - No server needed for export

---

## Phase 177 - Export Presets
**Status:** Pending

### Tasks:
1. Add preset buttons to ExportDialog:
   - "YouTube 1080p": 1920x1080, MP4 H.264, 30fps, High quality
   - "Instagram Reel": 1080x1920 (9:16), MP4, 30fps, Medium
   - "TikTok": 1080x1920, MP4, 30fps, Medium
   - "Twitter/X": 1280x720, MP4, 30fps, Medium
   - "Custom": all fields editable
2. Clicking preset auto-fills all export settings

### Section Q Verification:
- Create video project with multiple clips, text, transitions
- Save project → close → reopen → all data intact
- Auto-save indicator shows "Saved" after changes
- Click Export → select "YouTube 1080p" preset
- Export processes → progress bar updates
- Download exported MP4 → verify it plays correctly
- All clips, effects, transitions, text appear in output
- Audio is synced correctly in output
- Electron: export works locally without server
