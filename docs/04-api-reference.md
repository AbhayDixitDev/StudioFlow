# API Reference

Base URL: `http://localhost:5000/api`

All endpoints (except auth) require `Authorization: Bearer <token>` header.

---

## Authentication

### POST /api/auth/register
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "displayName": "John Doe",
      "preferences": { "theme": "dark", "defaultOutputFormat": "mp3" }
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):** Same as register response.

### POST /api/auth/refresh
Refresh an expired access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "newAccessToken...",
    "refreshToken": "newRefreshToken..."
  }
}
```

### GET /api/auth/me
Get current authenticated user.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "user@example.com",
    "displayName": "John Doe",
    "preferences": { ... }
  }
}
```

---

## Audio Operations

### POST /api/audio/upload
Upload an audio or video file.

**Request:** `multipart/form-data`
- `file` (required): Audio or video file (max 500MB)
- Accepted types: mp3, wav, flac, ogg, aac, m4a, wma, mp4, mkv, avi, mov, webm

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "originalName": "song.mp3",
    "format": "mp3",
    "duration": 245.3,
    "sampleRate": 44100,
    "channels": 2,
    "fileSize": 5242880,
    "source": "upload"
  }
}
```

### POST /api/audio/separate
Start audio separation job.

**Request:**
```json
{
  "audioFileId": "64a...",
  "model": "htdemucs_6s"
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "jobId": "64b...",
    "status": "queued",
    "model": "htdemucs_6s"
  }
}
```

### POST /api/audio/convert
Convert audio to different format.

**Request:**
```json
{
  "audioFileId": "64a...",
  "targetFormat": "flac",
  "bitrate": "320k",
  "sampleRate": 48000
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "jobId": "64b...",
    "status": "queued",
    "type": "convert"
  }
}
```

### POST /api/audio/cut
Cut/trim audio file.

**Request:**
```json
{
  "audioFileId": "64a...",
  "startTime": 30.5,
  "endTime": 120.0,
  "fadeInDuration": 1.0,
  "fadeOutDuration": 2.0,
  "outputFormat": "mp3"
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "jobId": "64b...",
    "status": "queued",
    "type": "cut"
  }
}
```

### POST /api/audio/extract
Extract audio from uploaded video file.

**Request:**
```json
{
  "audioFileId": "64a...",
  "outputFormat": "mp3",
  "bitrate": "192k"
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "jobId": "64b...",
    "status": "queued",
    "type": "convert"
  }
}
```

### POST /api/audio/from-url
Download audio from a video URL (YouTube, Vimeo, etc.).

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "outputFormat": "mp3"
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "jobId": "64b...",
    "status": "queued",
    "message": "Downloading and extracting audio..."
  }
}
```

### GET /api/audio/download/:jobId
Download processed file (converted, cut, or separated stem).

**Query params:**
- `stem` (optional): Stem name for separation jobs ("vocals", "drums", etc.)
- `format` (optional): Convert stem to format before download ("mp3", "flac")

**Response:** Binary file stream with appropriate Content-Type header.

### GET /api/audio/files
List user's uploaded audio files.

**Query params:**
- `page` (default: 1)
- `limit` (default: 20)
- `sort` (default: "-createdAt")

**Response (200):**
```json
{
  "success": true,
  "data": [ /* AudioFile objects */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

## Job Status

### GET /api/jobs/:id
Get job status and progress.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "64b...",
    "type": "separation",
    "status": "processing",
    "progress": 65,
    "model": "htdemucs_6s",
    "createdAt": "2024-01-15T10:30:00Z",
    "startedAt": "2024-01-15T10:30:05Z"
  }
}
```

**When completed (separation):**
```json
{
  "success": true,
  "data": {
    "_id": "64b...",
    "status": "completed",
    "progress": 100,
    "stems": [
      { "name": "vocals", "fileSize": 15728640, "format": "wav" },
      { "name": "drums", "fileSize": 12582912, "format": "wav" },
      { "name": "bass", "fileSize": 10485760, "format": "wav" },
      { "name": "guitar", "fileSize": 8388608, "format": "wav" },
      { "name": "piano", "fileSize": 7340032, "format": "wav" },
      { "name": "other", "fileSize": 6291456, "format": "wav" }
    ],
    "processingTime": 45000,
    "completedAt": "2024-01-15T10:30:50Z"
  }
}
```

---

## Video Projects

### POST /api/video/projects
Create a new video project.

**Request:**
```json
{
  "name": "My Vlog",
  "resolution": { "width": 1920, "height": 1080 },
  "fps": 30,
  "aspectRatio": "16:9"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "64c...",
    "name": "My Vlog",
    "resolution": { "width": 1920, "height": 1080 },
    "fps": 30,
    "timeline": { "tracks": [] }
  }
}
```

### GET /api/video/projects
List user's video projects.

**Response (200):** Array of VideoProject summaries (without full timeline).

### GET /api/video/projects/:id
Get full video project with timeline.

**Response (200):** Complete VideoProject object.

### PUT /api/video/projects/:id
Update video project (auto-save sends full timeline).

**Request:** Full or partial VideoProject object.

**Response (200):** Updated VideoProject.

### DELETE /api/video/projects/:id
Delete a video project and its associated files.

**Response (204):** No content.

### POST /api/video/projects/:id/export
Start video export job.

**Request:**
```json
{
  "resolution": { "width": 1920, "height": 1080 },
  "fps": 30,
  "format": "mp4",
  "quality": "high"
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "jobId": "64d...",
    "status": "queued",
    "type": "video-export"
  }
}
```

---

## WebSocket Events (Socket.IO)

### Client → Server
- `join:job:{jobId}` - Subscribe to job progress updates
- `leave:job:{jobId}` - Unsubscribe from job updates

### Server → Client
- `job:progress` - `{ jobId, progress: 65, status: "processing" }`
- `job:completed` - `{ jobId, status: "completed", result: { ... } }`
- `job:failed` - `{ jobId, status: "failed", error: "..." }`

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid audio format",
    "details": [ ... ]
  }
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request data |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| FILE_TOO_LARGE | 413 | File exceeds 500MB limit |
| UNSUPPORTED_FORMAT | 415 | File format not supported |
| RATE_LIMITED | 429 | Too many requests |
| PROCESSING_ERROR | 500 | FFmpeg or Demucs error |
| SERVER_ERROR | 500 | Internal server error |
