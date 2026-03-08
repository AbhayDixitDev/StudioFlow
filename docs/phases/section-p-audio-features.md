# Section P: Video Editor - Audio Features (Phases 161-167)

## Progress Checklist
- [x] Phase 161 - Audio Tracks on Timeline (waveform in clips)
- [x] Phase 162 - Audio Playback Sync (Web Audio API)
- [x] Phase 163 - Volume Envelope (per-clip volume, fade in/out)
- [x] Phase 164 - Audio Waveform on Clips (mini waveform render)
- [x] Phase 165 - Mute/Solo Tracks (M/S buttons per track)
- [x] Phase 166 - Background Music (add, loop, auto-volume)
- [x] Phase 167 - Audio from Separator (import stems into editor)

---

## Phase 161 - Audio Tracks on Timeline
**Status:** Pending

### Tasks:
1. Support audio-specific track rendering:
   - Audio tracks have green tint background
   - Audio clips show mini waveform visualization inside clip block
   - Generate waveform peaks on import (use Web Audio API decodeAudioData)
   - Cache waveform data per media file

---

## Phase 162 - Audio Playback Sync
**Status:** Pending

### Tasks:
1. Implement synchronized audio playback:
   - Use Web Audio API (AudioContext) for all audio
   - On play: create AudioBufferSourceNode for each audio clip active at currentTime
   - Calculate offset into each clip based on currentTime vs clip.startTime
   - Start all sources at the correct time offset
   - On pause: stop all sources
   - On seek: recreate sources at new position

---

## Phase 163 - Volume Envelope
**Status:** Pending

### Tasks:
1. Add per-clip volume controls:
   - Volume slider in PropertiesPanel (0% - 200%)
   - Fade-in duration (seconds) - volume ramps from 0 to clip volume
   - Fade-out duration (seconds) - volume ramps from clip volume to 0
   - Apply via GainNode in Web Audio API
   - Apply via volume/afade filters in FFmpeg export

---

## Phase 164 - Audio Waveform on Clips
**Status:** Pending

### Tasks:
1. Render waveform inside audio clip blocks on timeline:
   - Scale waveform to fit clip width
   - Color: lighter shade of track color
   - Update on zoom (re-sample peaks for visible resolution)
   - Performance: use cached peaks data, only draw visible portion

---

## Phase 165 - Mute/Solo Tracks
**Status:** Pending

### Tasks:
1. Add mute/solo buttons per track:
   - Mute (M): silence all audio on this track
   - Solo (S): play only this track's audio (mute all others)
   - Visual: muted tracks grayed out, solo track highlighted
   - Works in preview playback and exports
   - State stored in track data

---

## Phase 166 - Background Music
**Status:** Pending

### Tasks:
1. Add "Add Background Music" feature:
   - Quick action in timeline toolbar
   - Opens file picker for audio files
   - Creates new audio track with selected music
   - Auto-extends music to fill project duration (loop if needed)
   - Default volume: 30% (so it doesn't overpower main audio)
   - Fade-in at start, fade-out at end

---

## Phase 167 - Audio from Separator
**Status:** Pending

### Tasks:
1. Bridge audio separator with video editor:
   - In video editor MediaBin: "Import from Separator" option
   - Lists recent separation jobs
   - User can import individual stems (e.g., just vocals, just instrumentals)
   - Imported stems appear in MediaBin like regular audio files
   - Use case: separate song → import only vocals → overlay on video

### Section P Verification:
- Import video with audio → hear audio synced with video in preview
- Add separate audio track → both play together
- Adjust clip volume → hear volume change
- Set fade-in/out → audio fades smoothly
- Mute a track → its audio is silent
- Solo a track → only its audio plays
- Add background music → loops under main content
- Import separated stems → use in video project
