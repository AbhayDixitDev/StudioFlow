# Section M: Video Editor - Effects (Phases 136-145)

## Progress Checklist
- [x] Phase 136 - Effect Interface (VideoEffect base class)
- [x] Phase 137 - EffectRegistry (register, lookup by category)
- [x] Phase 138 - Brightness Effect (canvas + FFmpeg)
- [x] Phase 139 - Contrast + Saturation Effects
- [x] Phase 140 - Blur Effect
- [x] Phase 141 - Chroma Key Effect (pixel manipulation)
- [x] Phase 142 - EffectControls UI (add/remove/toggle/sliders)
- [x] Phase 143 - EffectPicker (inline category browser in EffectControls)
- [x] Phase 144 - Apply Effects in Preview (filter + pixel manipulation)
- [x] Phase 145 - Effect Keyframes (start/end interpolation)

---

## Phase 136 - Effect Interface
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/engine/effects/VideoEffect.ts`:
   - `VideoEffect` interface: id, name, category, defaultParams
   - `applyToCanvas(ctx, params, clipRect)`: apply in real-time preview
   - `toFFmpegFilter(params)`: generate FFmpeg filter string for export
   - `EffectParam` interface: name, type (number/color/boolean), min, max, step, default

---

## Phase 137 - EffectRegistry
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/engine/effects/EffectRegistry.ts`:
   - Map-based registry of all available effects
   - `register(effect)`, `get(id)`, `getAll()`, `getByCategory(category)`
   - Categories: 'color', 'blur', 'keying', 'stylize'
   - Initialize with all built-in effects

---

## Phase 138 - Brightness Effect
**Status:** Pending

### Tasks:
1. Create `BrightnessEffect.ts`:
   - Param: value (0.0 - 2.0, default 1.0, step 0.01)
   - Canvas: `ctx.filter = brightness(${value})`
   - FFmpeg: `eq=brightness=${value - 1}`
2. Register in EffectRegistry

---

## Phase 139 - Contrast + Saturation Effects
**Status:** Pending

### Tasks:
1. Create `ContrastEffect.ts`:
   - Param: value (0.0 - 3.0, default 1.0)
   - Canvas: `ctx.filter = contrast(${value})`
   - FFmpeg: `eq=contrast=${value}`
2. Create `SaturationEffect.ts`:
   - Param: value (0.0 - 3.0, default 1.0)
   - Canvas: `ctx.filter = saturate(${value})`
   - FFmpeg: `eq=saturation=${value}`
3. Register both

---

## Phase 140 - Blur Effect
**Status:** Pending

### Tasks:
1. Create `BlurEffect.ts`:
   - Param: radius (0 - 20, default 0, step 0.5)
   - Canvas: `ctx.filter = blur(${radius}px)`
   - FFmpeg: `boxblur=${radius}`
2. Register

---

## Phase 141 - Chroma Key Effect
**Status:** Pending

### Tasks:
1. Create `ChromaKeyEffect.ts`:
   - Params: keyColor (hex, default #00FF00), similarity (0-1, default 0.3), smoothness (0-1, default 0.1)
   - Canvas: Read ImageData pixels, set alpha to 0 for pixels near keyColor
   - FFmpeg: `chromakey=0x${color}:${similarity}:${smoothness}`
   - More complex than filter-based effects - requires pixel manipulation
2. Register

---

## Phase 142 - EffectControls UI
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/Properties/EffectControls.tsx`:
   - "Add Effect" dropdown (lists all effects from registry by category)
   - For each applied effect on selected clip:
     - Effect name + enable/disable toggle
     - Parameter sliders/inputs based on effect's param definitions
     - Remove effect button
   - Drag to reorder effects (order matters)
   - Real-time preview: changes apply immediately to canvas

---

## Phase 143 - EffectPicker
**Status:** Pending

### Tasks:
1. Create effect browser in the left panel:
   - Tab in left panel: "Effects"
   - Grid of available effects with:
     - Effect icon/preview thumbnail
     - Effect name
   - Category filter (Color, Blur, Keying, Stylize)
   - Click to apply to selected clip
   - Drag to apply to specific clip on timeline

---

## Phase 144 - Apply Effects in Preview
**Status:** Pending

### Tasks:
1. Update VideoPreview rendering loop:
   - After drawing each clip frame to canvas:
     - Iterate through clip's effects array
     - Call `effect.applyToCanvas(ctx, params, clipRect)` for each
   - Effects apply in order (first effect first)
   - Handle OffscreenCanvas for pixel-manipulation effects (Chroma Key)

---

## Phase 145 - Effect Keyframes (Basic)
**Status:** Pending

### Tasks:
1. Add basic keyframe support:
   - Clip effects can have keyframes: array of { time, params }
   - At render time: interpolate params between keyframes (linear)
   - UI: start value + end value inputs (simplified, no full keyframe editor)
   - Example: brightness goes from 1.0 at clip start to 0.5 at clip end (fade to dark)

### Section M Verification:
- Select a video clip on timeline
- Add Brightness effect → adjust slider → preview updates in real-time
- Add Blur effect → preview shows blurred video
- Add Chroma Key to green-screen footage → background becomes transparent
- Multiple effects apply in order
- Effects export correctly via FFmpeg
- Basic keyframe: brightness changes from start to end of clip
