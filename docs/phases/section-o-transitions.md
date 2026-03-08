# Section O: Video Editor - Transitions (Phases 153-160)

## Progress Checklist
- [x] Phase 153 - Transition Data Model (clip.transition = {type, duration})
- [x] Phase 154 - Crossfade Transition (globalAlpha blend)
- [x] Phase 155 - Slide Transitions (left, right, up, down)
- [x] Phase 156 - Wipe Transitions (horizontal, vertical, diagonal via clip())
- [x] Phase 157 - Zoom Transitions (zoomIn, zoomOut)
- [x] Phase 158 - TransitionPicker UI (categorized grid with visual previews)
- [x] Phase 159 - Apply Transition on Timeline (indicator on clips, FX tab)
- [x] Phase 160 - Transition Rendering (offscreen canvas compositing)

---

## Phase 153 - Transition Data Model
**Status:** Pending

### Tasks:
1. Update clip types to support transitions:
   - `transitions.in`: { type: TransitionType, duration: number }
   - `transitions.out`: { type: TransitionType, duration: number }
   - Transitions apply where two clips overlap or are adjacent
   - Duration range: 0.1 - 5.0 seconds

---

## Phase 154 - Crossfade Transition
**Status:** Pending

### Tasks:
1. Implement crossfade:
   - Canvas: blend two frames using globalAlpha interpolation
   - Render outgoing clip with alpha (1 → 0)
   - Render incoming clip with alpha (0 → 1)
   - Progress: 0.0 at transition start, 1.0 at transition end
   - FFmpeg: `xfade=transition=fade:duration=N:offset=M`

---

## Phase 155 - Slide Transitions
**Status:** Pending

### Tasks:
1. Implement slide variations:
   - slideLeft: incoming slides in from right, outgoing slides out to left
   - slideRight: reverse
   - slideUp: incoming from bottom
   - slideDown: incoming from top
   - Canvas: offset drawImage x/y based on progress
   - FFmpeg: `xfade=transition=slideleft|slideright|slideup|slidedown`

---

## Phase 156 - Wipe Transitions
**Status:** Pending

### Tasks:
1. Implement wipe variations:
   - wipeHorizontal: reveal incoming from left to right
   - wipeVertical: reveal from top to bottom
   - wipeDiagonal: reveal diagonally
   - Canvas: use ctx.clip() with a rectangle that grows
   - FFmpeg: `xfade=transition=wipeleft|wipeup`

---

## Phase 157 - Zoom Transition
**Status:** Pending

### Tasks:
1. Implement zoom variations:
   - zoomIn: outgoing zooms in until it fills frame, incoming appears
   - zoomOut: outgoing shrinks away, incoming zooms in
   - Canvas: scale the drawImage based on progress
   - FFmpeg: `xfade=transition=zoomin`

---

## Phase 158 - TransitionPicker UI
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/Transitions/TransitionPicker.tsx`:
   - Tab in left panel: "Transitions"
   - Grid of transition options:
     - Animated thumbnail preview (loop short animation)
     - Transition name
   - Click to select transition type
   - Duration input (seconds)
   - Category sections: Fade, Slide, Wipe, Zoom

---

## Phase 159 - Apply Transition on Timeline
**Status:** Pending

### Tasks:
1. Add transition interaction on timeline:
   - Drag transition from picker between two adjacent clips
   - Visual indicator: overlap zone between clips
   - Timeline shows transition as a small diamond/icon between clips
   - Select transition to change type/duration
   - Right-click: remove transition
   - Transition duration creates overlap between clips

---

## Phase 160 - Transition Rendering
**Status:** Pending

### Tasks:
1. Update VideoPreview rendering for transitions:
   - Detect if currentTime is within a transition zone
   - If yes: render both clips to separate offscreen canvases
   - Calculate transition progress (0 to 1)
   - Call transition render function with both canvases + progress
   - Composite result to main canvas
2. Update audio: crossfade audio during transitions (blend volumes)

### Section O Verification:
- Place two video clips adjacent on timeline
- Drag "Crossfade" transition between them
- Preview shows smooth fade between clips
- Test Slide Left transition → incoming clip slides in
- Test Wipe → progressive reveal
- Change transition duration → longer/shorter blend
- Remove transition → clips cut directly
- Export video → transitions appear correctly in output
