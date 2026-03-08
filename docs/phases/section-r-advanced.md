# Section R: Video Editor - Advanced Features (Phases 178-190)

## Progress Checklist
- [ ] Phase 178 - Image Clips (PNG, JPG on timeline)
- [ ] Phase 179 - Ken Burns Effect (pan & zoom animation)
- [ ] Phase 180 - Stickers/Overlays (PNG overlays on video)
- [ ] Phase 181 - Speed Control (0.25x-4x, reverse)
- [ ] Phase 182 - Crop Tool (crop handles on preview)
- [ ] Phase 183 - Color Grading (hue, temperature, tint)
- [ ] Phase 184 - Filters/LUTs (cinematic, vintage, warm, cool)
- [ ] Phase 185 - Picture-in-Picture (multi-track compositing)
- [ ] Phase 186 - Aspect Ratio (16:9, 9:16, 1:1, 4:3)
- [ ] Phase 187 - Markers (named markers on timeline)
- [ ] Phase 188 - Timeline Zoom + Scroll (smooth zoom, minimap)
- [ ] Phase 189 - Project Templates (Vlog, Slideshow, Social Media)
- [ ] Phase 190 - Recent Projects (home screen thumbnails)

---

## Phase 178 - Image Clips
**Status:** Pending

### Tasks:
1. Support image files on timeline:
   - Import PNG, JPG, GIF, WebP into MediaBin
   - Drag to timeline creates image clip
   - Default duration: 5 seconds (adjustable by trimming)
   - Render on canvas at position/scale/rotation
   - Support all effects (brightness, blur, etc.)

---

## Phase 179 - Ken Burns Effect
**Status:** Pending

### Tasks:
1. Implement pan & zoom animation for image clips:
   - Start position/scale and end position/scale
   - Linear interpolation over clip duration
   - UI: two keyframe controls (start state, end state)
   - Common presets: "Zoom In", "Zoom Out", "Pan Left to Right"
   - Canvas: interpolate drawImage params each frame
   - FFmpeg: zoompan filter

---

## Phase 180 - Stickers/Overlays
**Status:** Pending

### Tasks:
1. Add sticker support:
   - Import PNG stickers from file
   - Built-in sticker packs (optional, future)
   - Drag sticker onto video preview canvas
   - Position, scale, rotate on preview
   - Duration: visible for entire clip or specific time range
   - Implemented as image clips on overlay track

---

## Phase 181 - Speed Control
**Status:** Pending

### Tasks:
1. Add per-clip speed adjustment:
   - Speed slider in PropertiesPanel: 0.25x, 0.5x, 1x, 1.5x, 2x, 4x
   - Reverse toggle: play clip backwards
   - Timeline: clip block width changes with speed (slower = wider, faster = narrower)
   - Audio: pitch-shift or remove audio at extreme speeds
   - FFmpeg: setpts filter for video, atempo for audio

---

## Phase 182 - Crop Tool
**Status:** Pending

### Tasks:
1. Add crop controls for video/image clips:
   - Crop inputs in PropertiesPanel: top, right, bottom, left (pixels or %)
   - Visual crop overlay on canvas preview (draggable crop handles)
   - Apply crop before other transforms
   - FFmpeg: crop filter

---

## Phase 183 - Color Grading
**Status:** Pending

### Tasks:
1. Add color adjustment controls:
   - Hue rotate: -180 to 180 degrees
   - Temperature: cool to warm (blue to orange shift)
   - Tint: green to magenta shift
   - Combined with existing brightness/contrast/saturation
   - Canvas: use CSS filter combinations + color matrix
   - FFmpeg: hue, colortemperature, colorbalance filters

---

## Phase 184 - Filters/LUTs
**Status:** Pending

### Tasks:
1. Create pre-made visual filters:
   - Cinematic: slight blue tint, increased contrast, desaturated
   - Vintage: warm tones, faded blacks, vignette
   - Warm: orange/amber shift
   - Cool: blue/teal shift
   - B&W: full desaturation
   - Sepia: warm desaturation
2. Display as grid with before/after preview thumbnails
3. Apply as combination of existing effects
4. One-click apply to selected clip

---

## Phase 185 - Picture-in-Picture
**Status:** Pending

### Tasks:
1. Support multiple video tracks composited:
   - Higher tracks overlay lower tracks
   - Use position/scale controls to create PiP effect
   - Common preset: small video in corner (25% scale, 10px from edge)
   - Drag on canvas to position PiP window
   - Border/shadow options for PiP window

---

## Phase 186 - Aspect Ratio
**Status:** Pending

### Tasks:
1. Add project aspect ratio switching:
   - Options: 16:9, 9:16, 1:1, 4:3
   - Changing ratio: resize canvas, reflow clips
   - Preview updates immediately
   - Export respects selected ratio
   - Pillarbox/letterbox option for mismatched content

---

## Phase 187 - Markers
**Status:** Pending

### Tasks:
1. Add timeline markers:
   - Click on ruler to add marker at current time
   - Marker: colored triangle on ruler + optional label
   - Navigate between markers (previous/next buttons)
   - Right-click marker: rename, change color, delete
   - Use for: scene markers, edit notes, sync points

---

## Phase 188 - Timeline Zoom + Scroll
**Status:** Pending

### Tasks:
1. Improve timeline navigation:
   - Smooth zoom in/out with mouse wheel (Ctrl + scroll)
   - Horizontal scroll with mouse wheel (or Shift + scroll)
   - Zoom slider in timeline toolbar
   - "Fit to view" button: zoom to show entire project
   - "Zoom to selection" button: zoom to show selected region
   - Minimap: overview bar showing full timeline with viewport indicator

---

## Phase 189 - Project Templates
**Status:** Pending

### Tasks:
1. Create starter templates:
   - **Blank**: empty project with default settings
   - **Vlog**: 16:9, 1080p, pre-made intro text + outro
   - **Slideshow**: 16:9, image tracks with Ken Burns + transitions
   - **Social Media Post**: 1:1, with text overlay template
   - **Instagram Story**: 9:16, with trending text styles
2. Show template picker when creating new project

---

## Phase 190 - Recent Projects
**Status:** Pending

### Tasks:
1. Add recent projects to Home page:
   - Grid of recent video project thumbnails
   - Show: thumbnail, name, last edited date, duration
   - Click to open in video editor
   - Quick actions: duplicate, rename, delete
   - Also show in video editor's File menu

### Section R Verification:
- Add image clip → Ken Burns zoom in effect plays
- Add sticker overlay → visible on video
- Set clip speed to 2x → plays double speed, timeline adjusts
- Crop a video clip → only cropped region shows
- Apply "Cinematic" filter → visual style changes
- Create PiP layout → small video in corner of main video
- Switch project to 9:16 → canvas rotates
- Add markers → navigate between them
- Zoom timeline → see more/less detail
- Create project from "Vlog" template → pre-filled template
