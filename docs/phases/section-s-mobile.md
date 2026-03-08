# Section S: React Native Mobile App (Phases 191-205)

## Progress Checklist
- [ ] Phase 191 - React Native Project Init
- [ ] Phase 192 - Navigation Setup (bottom tabs)
- [ ] Phase 193 - Mobile Theme (dark/light with system detect)
- [ ] Phase 194 - Mobile API Service (Axios, auth)
- [ ] Phase 195 - HomeScreen (tool cards grid)
- [ ] Phase 196 - SeparatorScreen - Upload (file picker, model select)
- [ ] Phase 197 - SeparatorScreen - Results (progress, play, download)
- [ ] Phase 198 - ConverterScreen (pick, convert, download)
- [ ] Phase 199 - CutterScreen - Waveform (waveform display)
- [ ] Phase 200 - CutterScreen - Trim (handles, cut, download)
- [ ] Phase 201 - SettingsScreen (theme, server URL, cache)
- [ ] Phase 202 - Push Notifications (local, on job complete)
- [ ] Phase 203 - Offline Detection (banner, disable features)
- [ ] Phase 204 - File Sharing (Share API to other apps)
- [ ] Phase 205 - Android Build (APK, test on device)

---

## Phase 191 - React Native Project Init
**Status:** Pending

### Tasks:
1. Initialize React Native project in `apps/mobile`:
   - `npx react-native init AudioSeparator --template react-native-template-typescript`
   - Configure metro.config.js for monorepo (resolve packages/shared)
   - Configure babel for path aliases
   - Verify app runs on Android emulator

---

## Phase 192 - Navigation Setup
**Status:** Pending

### Tasks:
1. Install @react-navigation packages
2. Create `apps/mobile/src/navigation/RootNavigator.tsx`:
   - Bottom tab navigator with 5 tabs:
     - Home (icon: Home)
     - Separator (icon: Scissors)
     - Cutter (icon: Cut)
     - Converter (icon: RefreshCw)
     - Settings (icon: Settings)
   - Tab bar styling matching app theme
   - Active tab indicator (accent color)

---

## Phase 193 - Mobile Theme
**Status:** Pending

### Tasks:
1. Create mobile theme system:
   - Import theme tokens from packages/shared
   - Dark theme: dark backgrounds, accent colors
   - Light theme: light backgrounds, adjusted accents
   - Theme context provider
   - Toggle with system preference detection
   - Apply to React Navigation theme

---

## Phase 194 - Mobile API Service
**Status:** Pending

### Tasks:
1. Create `apps/mobile/src/services/api.ts`:
   - Axios instance configured for Express server
   - Base URL: configurable in Settings (default: http://localhost:5000/api)
   - Auth token management (secure storage)
   - Error handling with user-friendly messages
   - Network state detection (online/offline)

---

## Phase 195 - HomeScreen
**Status:** Pending

### Tasks:
1. Create `apps/mobile/src/screens/HomeScreen.tsx`:
   - App logo + name at top
   - Grid of tool cards (2 columns):
     - Audio Separator
     - Audio Cutter
     - Format Converter
     - Video to Audio
   - Each card: icon, title, brief description, tap to navigate
   - Recent activity section at bottom (last 5 jobs)
   - Pull to refresh

---

## Phase 196 - SeparatorScreen - Upload
**Status:** Pending

### Tasks:
1. Create `apps/mobile/src/screens/SeparatorScreen.tsx` (Part 1):
   - "Select Audio File" button → opens document picker
   - Accept: audio files (mp3, wav, flac, etc.)
   - After selection: show file name, size, duration
   - Model selector: htdemucs (4 stems) or htdemucs_6s (6 stems)
   - "Separate" button → upload file to server → start separation job
   - Upload progress bar

---

## Phase 197 - SeparatorScreen - Results
**Status:** Pending

### Tasks:
1. Continue SeparatorScreen (Part 2):
   - After upload: show processing progress
   - Poll GET /api/jobs/:id every 2 seconds
   - Progress bar with percentage
   - On completion: show stem list
   - Each stem: name, play button, download button
   - Play uses expo-av for audio playback
   - Download: save to device downloads folder
   - Share button: share stem file to other apps

---

## Phase 198 - ConverterScreen
**Status:** Pending

### Tasks:
1. Create `apps/mobile/src/screens/ConverterScreen.tsx`:
   - File picker button
   - After selection: show file info
   - Format selector grid (MP3, WAV, FLAC, OGG, AAC)
   - Quality picker (Low, Medium, High)
   - "Convert" button → upload → process → download
   - Progress indicator
   - Download/share converted file

---

## Phase 199 - CutterScreen - Waveform
**Status:** Pending

### Tasks:
1. Create `apps/mobile/src/screens/CutterScreen.tsx` (Part 1):
   - File picker for audio
   - Waveform visualization (simplified for mobile):
     - Use a React Native waveform library or custom canvas
     - Horizontal scrollable waveform
     - Pinch to zoom

---

## Phase 200 - CutterScreen - Trim
**Status:** Pending

### Tasks:
1. Continue CutterScreen (Part 2):
   - Trim handles overlaid on waveform (draggable)
   - Start/end time display
   - Play selection button
   - Play full button
   - "Cut" button → upload to server → process → download
   - Format picker for output

---

## Phase 201 - SettingsScreen
**Status:** Pending

### Tasks:
1. Create `apps/mobile/src/screens/SettingsScreen.tsx`:
   - Theme toggle (Dark/Light/System)
   - Server URL input (for connecting to custom server)
   - Default output format preference
   - Clear cache button (remove downloaded/temp files)
   - Storage usage display
   - About section: version, credits
   - Login/logout

---

## Phase 202 - Push Notifications
**Status:** Pending

### Tasks:
1. Add notification support:
   - When a long-running job completes (separation, conversion)
   - Local notification (no push server needed)
   - User taps notification → navigate to results screen
   - Background job polling when app is in background (limited)

---

## Phase 203 - Offline Detection
**Status:** Pending

### Tasks:
1. Handle offline/online states:
   - Detect network connectivity
   - Show offline banner at top of screen when disconnected
   - Disable features that require server (all processing)
   - Show clear message: "Connect to server to use this feature"
   - Queue actions for when connection returns (optional)

---

## Phase 204 - File Sharing
**Status:** Pending

### Tasks:
1. Add share functionality:
   - After processing: "Share" button on result
   - Uses React Native Share API
   - Share to: WhatsApp, email, other apps
   - Share file directly (not URL)
   - Works for: separated stems, converted files, cut audio

---

## Phase 205 - Android Build
**Status:** Pending

### Tasks:
1. Build release APK:
   - Configure signing (keystore)
   - Build: `npx react-native build-android --mode=release`
   - Test APK on physical device
   - Verify all features work on device
   - Test with different screen sizes

### Section S Verification:
- Install APK on Android device/emulator
- Navigate between all tabs
- Theme toggle works (dark/light)
- Audio Separator: pick file → upload → see progress → play stems → download
- Converter: pick file → select format → convert → download
- Cutter: pick file → see waveform → trim → cut → download
- Settings: change server URL, clear cache
- Offline: show banner when disconnected
- Share: share a stem to WhatsApp
