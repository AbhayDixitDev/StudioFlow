# Database Schema (MongoDB / Mongoose)

## Collection: users

```typescript
interface IUser {
  _id: ObjectId;
  email: string;                    // unique, indexed, lowercase
  passwordHash: string;             // bcrypt hash (12 rounds)
  displayName: string;              // max 50 chars
  avatar?: string;                  // URL or local path to avatar image
  preferences: {
    theme: 'dark' | 'light';        // default: 'dark'
    defaultOutputFormat: string;    // default: 'mp3'
    defaultSeparationModel: string; // default: 'htdemucs'
    autoSave: boolean;              // default: true (video editor)
  };
  createdAt: Date;                  // auto (timestamps: true)
  updatedAt: Date;                  // auto (timestamps: true)
}

// Indexes:
// { email: 1 } unique
```

### Mongoose Schema

```typescript
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[\w.-]+@[\w.-]+\.\w{2,}$/
  },
  passwordHash: { type: String, required: true },
  displayName: { type: String, required: true, maxlength: 50 },
  avatar: String,
  preferences: {
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    defaultOutputFormat: { type: String, default: 'mp3' },
    defaultSeparationModel: { type: String, default: 'htdemucs' },
    autoSave: { type: Boolean, default: true }
  }
}, { timestamps: true });
```

---

## Collection: audiofiles

```typescript
interface IAudioFile {
  _id: ObjectId;
  userId: ObjectId;                 // ref: 'User'
  originalName: string;             // original filename: "my_song.mp3"
  storagePath: string;              // disk path: "uploads/{userId}/{uuid}.mp3"
  format: string;                   // "mp3", "wav", "flac", "ogg", "aac", "m4a"
  duration: number;                 // seconds (float)
  sampleRate: number;               // Hz: 44100, 48000, etc.
  channels: number;                 // 1 (mono), 2 (stereo)
  fileSize: number;                 // bytes
  bitrate?: number;                 // kbps (for compressed formats)
  source: 'upload' | 'youtube' | 'video-extract';
  sourceUrl?: string;               // YouTube/video URL if applicable
  waveformData?: number[];          // Pre-computed peaks array (optional, for visualization)
  metadata?: {
    title?: string;
    artist?: string;
    album?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Indexes:
// { userId: 1 }
// { userId: 1, createdAt: -1 }
```

---

## Collection: separationjobs

```typescript
interface ISeparationJob {
  _id: ObjectId;
  userId: ObjectId;                 // ref: 'User'
  audioFileId: ObjectId;            // ref: 'AudioFile'
  model: 'htdemucs' | 'htdemucs_6s' | 'mdx_extra';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;                 // 0-100 (integer)
  stems: Array<{
    name: string;                   // "vocals", "drums", "bass", "guitar", "piano", "other"
    storagePath: string;            // "outputs/{userId}/{jobId}/vocals.wav"
    fileSize: number;               // bytes
    format: string;                 // "wav" (default output)
  }>;
  error?: string;                   // Error message if status === 'failed'
  processingTime?: number;          // milliseconds (how long separation took)
  startedAt?: Date;                 // When worker picked up job
  completedAt?: Date;               // When job finished/failed
  createdAt: Date;
  updatedAt: Date;
}

// Indexes:
// { userId: 1 }
// { userId: 1, status: 1 }
// { status: 1 }  (for worker queue)
// { audioFileId: 1 }
```

---

## Collection: processingjobs

Generic job model for convert, cut, and video export operations.

```typescript
interface IProcessingJob {
  _id: ObjectId;
  userId: ObjectId;                 // ref: 'User'
  type: 'convert' | 'cut' | 'video-export';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;                 // 0-100

  // Input parameters (varies by type)
  input: {
    fileId?: ObjectId;              // ref: 'AudioFile' (for convert/cut)
    projectId?: ObjectId;           // ref: 'VideoProject' (for video-export)

    // Convert-specific
    targetFormat?: string;          // "flac", "wav", "mp3", etc.
    bitrate?: string;               // "320k", "192k", etc.
    sampleRate?: number;            // 44100, 48000, etc.

    // Cut-specific
    startTime?: number;             // seconds (float)
    endTime?: number;               // seconds (float)
    fadeInDuration?: number;        // seconds
    fadeOutDuration?: number;       // seconds
    outputFormat?: string;          // output format for cut

    // Video export-specific
    resolution?: { width: number; height: number };  // { width: 1920, height: 1080 }
    fps?: number;                   // 30, 60
    videoFormat?: string;           // "mp4", "webm", "mov"
    quality?: 'low' | 'medium' | 'high' | 'ultra';
  };

  outputPath?: string;             // Path to output file
  outputFileSize?: number;         // bytes
  error?: string;
  processingTime?: number;         // milliseconds
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Indexes:
// { userId: 1, type: 1 }
// { status: 1 }
// { userId: 1, createdAt: -1 }
```

---

## Collection: videoProjects

```typescript
interface IVideoProject {
  _id: ObjectId;
  userId: ObjectId;                 // ref: 'User'
  name: string;                     // Project name
  thumbnail?: string;               // Path to thumbnail image

  // Project settings
  resolution: {
    width: number;                  // default: 1920
    height: number;                 // default: 1080
  };
  fps: number;                      // default: 30
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';  // default: '16:9'
  duration: number;                 // Total project duration in seconds (computed)
  backgroundColor: string;         // default: '#000000'

  // Timeline data
  timeline: {
    tracks: Array<{
      id: string;                   // UUID
      type: 'video' | 'audio' | 'text' | 'image';
      name: string;                 // "Video 1", "Audio 1", "Text 1"
      locked: boolean;              // default: false
      visible: boolean;             // default: true
      muted: boolean;               // default: false (audio tracks)

      clips: Array<{
        id: string;                 // UUID

        // Source
        sourceFileId?: ObjectId;    // ref to uploaded media file (not for text clips)
        sourcePath?: string;        // Local path to source media
        sourceType: 'video' | 'audio' | 'image' | 'text';

        // Timeline position
        startTime: number;          // Position on timeline (seconds)
        duration: number;           // Visible duration on timeline (seconds)

        // Source trimming
        trimStart: number;          // In-point within source (seconds)
        trimEnd: number;            // Out-point within source (seconds)

        // Audio properties
        volume: number;             // 0.0 - 1.0 (default: 1.0)
        fadeInDuration: number;     // seconds (default: 0)
        fadeOutDuration: number;    // seconds (default: 0)

        // Visual properties
        opacity: number;            // 0.0 - 1.0 (default: 1.0)
        position: { x: number; y: number };  // pixel offset from center
        scale: { x: number; y: number };     // 1.0 = 100%
        rotation: number;           // degrees

        // Speed
        speed: number;              // 0.25 - 4.0 (default: 1.0)
        reversed: boolean;          // default: false

        // Crop
        crop?: {
          top: number;              // pixels
          right: number;
          bottom: number;
          left: number;
        };

        // Effects
        effects: Array<{
          id: string;               // UUID
          type: string;             // "brightness", "contrast", "blur", "saturation", "chromaKey", "hue", "temperature"
          enabled: boolean;         // default: true
          params: Record<string, number>;  // effect-specific params, e.g. { value: 0.5 }
          // Keyframes (optional)
          keyframes?: Array<{
            time: number;           // seconds relative to clip start
            params: Record<string, number>;
          }>;
        }>;

        // Transitions
        transitions: {
          in?: {
            type: string;           // "crossfade", "slideLeft", "slideRight", "wipeHorizontal", "zoom"
            duration: number;       // seconds
          };
          out?: {
            type: string;
            duration: number;
          };
        };

        // Text-specific properties (only for text clips)
        text?: string;
        fontFamily?: string;        // default: "Inter"
        fontSize?: number;          // default: 48
        fontWeight?: number;        // 400, 700
        fontColor?: string;         // hex color
        textAlign?: 'left' | 'center' | 'right';
        backgroundColor?: string;   // hex with alpha
        strokeColor?: string;
        strokeWidth?: number;
        shadowColor?: string;
        shadowBlur?: number;
        shadowOffset?: { x: number; y: number };
        textAnimation?: string;     // "fadeIn", "slideIn", "typewriter", "bounce", "none"
        textAnimationDuration?: number; // seconds
      }>;
    }>;
  };

  // Media files used in this project
  mediaFiles: Array<{
    fileId: ObjectId;
    originalName: string;
    type: 'video' | 'audio' | 'image';
    duration?: number;              // seconds (for video/audio)
    thumbnail?: string;             // path to thumbnail
  }>;

  createdAt: Date;
  updatedAt: Date;
}

// Indexes:
// { userId: 1 }
// { userId: 1, updatedAt: -1 }
```

---

## Relationships Diagram

```
User (1) ──── (N) AudioFile
  │
  ├──── (N) SeparationJob ──── (1) AudioFile
  │
  ├──── (N) ProcessingJob ──── (1) AudioFile or VideoProject
  │
  └──── (N) VideoProject
```

## Storage Paths Convention

```
data/
├── uploads/
│   └── {userId}/
│       ├── {uuid}.mp3              # Uploaded audio files
│       ├── {uuid}.mp4              # Uploaded video files
│       └── {uuid}.png              # Uploaded images
├── outputs/
│   └── {userId}/
│       └── {jobId}/
│           ├── vocals.wav          # Separated stems
│           ├── drums.wav
│           ├── bass.wav
│           └── ...
├── converted/
│   └── {userId}/
│       └── {jobId}.flac            # Converted files
├── cut/
│   └── {userId}/
│       └── {jobId}.mp3             # Cut audio files
├── exports/
│   └── {userId}/
│       └── {jobId}.mp4             # Exported videos
└── thumbnails/
    └── {projectId}.png             # Video project thumbnails
```
