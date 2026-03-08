# Project Overview - Audio Separator

## Vision

A comprehensive, all-in-one multimedia processing platform that empowers users to manipulate audio and video with professional-grade tools, all running locally on their device. The app prioritizes speed, ease of use, and a futuristic interface that works across web, desktop, and mobile.

## Product Name

**Audio Separator** (working title - encompasses all tools)

## Core Features

### 1. Audio Separator (Primary Feature)
- Accept audio files (mp3, wav, flac, ogg, aac, wma, m4a)
- Accept video files (mp4, mkv, avi, mov, webm) - auto-extract audio
- Accept video URLs (YouTube, Vimeo, direct links) - auto-download and extract
- Separate audio into individual stems using ML:
  - **4-stem mode**: vocals, drums, bass, other
  - **6-stem mode**: vocals, drums, bass, guitar, piano, other
- Interactive multi-track player with per-stem mute/solo/volume
- Download individual stems or selected combination as zip
- Output formats: wav, mp3, flac

### 2. Video to Audio Converter
- Upload video file or paste video URL
- Extract audio track from any video format
- Choose output audio format and quality
- Display video metadata (duration, resolution, codec)
- Support batch extraction

### 3. Audio Cutter
- Upload audio file
- Interactive waveform visualization with zoom
- Draggable region handles for precise selection
- Time input fields (HH:MM:SS.ms) for exact positioning
- Fade-in and fade-out controls
- Multi-region cutting (split into multiple segments)
- Real-time playback preview of selected region
- Browser-side cutting via FFmpeg WASM (instant, no upload needed)

### 4. Audio Format Changer
- Convert between audio formats: mp3, wav, flac, ogg, aac, wma, m4a
- Quality controls: bitrate (64k-320k), sample rate (22050-96000), channels
- Batch conversion (multiple files at once)
- Browser-side conversion via FFmpeg WASM for simple conversions

### 5. Video Creator (KineMaster-level Editor)
- **Timeline**: Multi-track timeline with video, audio, text, and image tracks
- **Media**: Import videos, images, audio files into media bin
- **Editing**: Cut, trim, split, duplicate, move clips on timeline
- **Text**: Text overlays with fonts, colors, stroke, shadow, animation presets
- **Transitions**: Crossfade, slide, wipe, zoom between clips
- **Effects**: Brightness, contrast, blur, saturation, chroma key, color grading
- **Audio**: Volume control, fade, mute/solo, background music
- **Export**: MP4, WebM, MOV at various resolutions (720p-4K), frame rates (24-60fps)
- **Advanced**: Speed control, crop, picture-in-picture, Ken Burns effect, stickers
- **Projects**: Save/load projects, auto-save, project templates

## Target Platforms

| Platform | Technology | Distribution |
|----------|-----------|-------------|
| Web | React (Vite) | URL / hosted |
| Desktop (Windows) | Electron | .exe installer (NSIS) |
| Mobile (Android) | React Native | APK / Play Store |
| Mobile (iOS) | React Native | App Store (future) |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Framer Motion |
| State Management | Zustand 5 |
| Server State | TanStack React Query 5 |
| Backend API | Express.js 5, TypeScript |
| Database | MongoDB with Mongoose 8 |
| Job Queue | BullMQ + Redis |
| ML/AI | Python, Meta Demucs (htdemucs / htdemucs_6s) |
| A/V Processing | FFmpeg (native binary + WASM for browser) |
| URL Downloads | yt-dlp (via yt-dlp-wrap) |
| Desktop | Electron 34 + electron-builder |
| Mobile | React Native 0.77 + React Navigation |
| Monorepo | npm workspaces + Turborepo |
| Real-time | Socket.IO |

## UI/UX Design Principles

### Themes
- **Dark Theme**: Glassmorphism (frosted glass cards, backdrop-blur), neon accent colors (cyan/purple/pink glow), deep dark backgrounds (#0a0a0f), smooth animations
- **Light Theme**: Clean whites (#fafafa), subtle gray borders, minimal shadows, bright accent colors, airy spacing

### Design Goals
- Futuristic and modern aesthetic
- Responsive across all screen sizes
- Smooth animations and micro-interactions
- Clear visual hierarchy and information flow
- Minimal clutter, maximum functionality
- Consistent design language across all tools
- Accessible (keyboard navigation, screen readers, ARIA labels)

## Processing Philosophy

- **Local-first**: All processing happens on the user's device
- **Offline-capable**: Desktop app works without internet
- **Low-end friendly**: Optimized for devices with limited RAM/CPU
- **Fast**: Use WebAssembly for browser, native binaries for desktop
- **Queue-based**: Long tasks run in background with progress tracking
