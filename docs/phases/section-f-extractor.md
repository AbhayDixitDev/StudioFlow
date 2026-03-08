# Section F: Video to Audio Extractor (Phases 064-070)

## Progress Checklist
- [x] Phase 064 - FFmpeg Extract Audio (extractAudio method)
- [x] Phase 065 - Extract API Endpoint (POST /api/audio/extract)
- [x] Phase 066 - YouTube Service (yt-dlp-wrap)
- [x] Phase 067 - URL Download Endpoint (POST /api/audio/from-url)
- [x] Phase 068 - URL Validation Utils (improved validators)
- [x] Phase 069 - VideoToAudio Page UI (upload + URL tabs)
- [x] Phase 070 - VideoToAudio Flow (progress, download, preview)

---

## Phase 064 - FFmpeg Extract Audio
**Status:** Pending

### Tasks:
1. Add to `apps/server/src/services/ffmpeg.service.ts`:
   - `extractAudio(videoPath, outputPath, options)`:
     - options: { format, bitrate }
     - Uses FFmpeg to extract audio track from video
     - `-vn` flag to strip video
     - Returns Promise with output file info

---

## Phase 065 - Extract API Endpoint
**Status:** Pending

### Tasks:
1. Add to audio controller:
   - `extract`: receive video file ID, extract audio via FFmpeg, create AudioFile doc for extracted audio, return new audio file info
2. Add route: POST /api/audio/extract → auth → extract

---

## Phase 066 - YouTube Service
**Status:** Pending

### Tasks:
1. Create `apps/server/src/services/youtube.service.ts`:
   - Install `yt-dlp-wrap`
   - `downloadAudio(url, outputDir, format)`:
     - Use yt-dlp to download audio-only from URL
     - Support YouTube, Vimeo, and generic video URLs
     - Return download path and metadata (title, duration)
     - Progress reporting via stdout parsing
   - `getVideoInfo(url)`:
     - Get video metadata without downloading (title, duration, thumbnail)

---

## Phase 067 - URL Download Endpoint
**Status:** Pending

### Tasks:
1. Add to audio controller:
   - `fromUrl`: validate URL, download via youtube.service, create AudioFile doc, return file info
   - Handle errors: invalid URL, video not found, download failed
2. Add route: POST /api/audio/from-url → auth → fromUrl

---

## Phase 068 - URL Validation Utils
**Status:** Pending

### Tasks:
1. Update `packages/shared/src/utils/validation.ts`:
   - Improve `isYouTubeUrl`: handle youtube.com/watch, youtu.be, youtube.com/shorts
   - Improve `isVimeoUrl`: handle vimeo.com/123456
   - Add `extractVideoId(url)`: extract video ID from YouTube URLs
   - Add `isSupportedVideoUrl(url)`: check if URL is from a supported platform

---

## Phase 069 - VideoToAudio Page UI
**Status:** Pending

### Tasks:
1. Update `apps/web/src/pages/VideoToAudio.tsx`:
   - Tab bar: "Upload File" | "Paste URL"
   - Upload tab: FileDropzone accepting video formats
   - URL tab: Input field with paste button, URL validation feedback
   - Format selector (output audio format)
   - Quality settings (bitrate)

---

## Phase 070 - VideoToAudio Flow
**Status:** Pending

### Tasks:
1. Complete the VideoToAudio page:
   - After upload/URL entry: show metadata (video title, duration, thumbnail for URLs)
   - Extract/Download button
   - Progress bar during processing
   - Completion: download button for extracted audio
   - Error handling: show user-friendly messages
   - Audio preview: play extracted audio before download

### Section F Verification:
- Upload an MP4 video → extract audio → download MP3
- Paste a YouTube URL → download audio
- Paste a Vimeo URL → download audio
- Verify extracted audio plays correctly
- Invalid URL shows proper error message
