# Section N: Video Editor - Text Overlays (Phases 146-152)

## Progress Checklist
- [x] Phase 146 - Text Clip Type (text clips in TimelineEngine)
- [x] Phase 147 - TextEditor Panel (textarea, font, size, weight, alignment)
- [x] Phase 148 - Text Styling (color, background, stroke, shadow, letter spacing, line height)
- [x] Phase 149 - Text Rendering on Canvas (multi-line, shadow, background, stroke)
- [x] Phase 150 - Text Animation Presets (fadeIn, fadeOut, slideIn, typewriter, bounce)
- [x] Phase 151 - Text Templates (Title, Subtitle, Lower Third, Caption, Watermark)
- [x] Phase 152 - Text on Timeline (text preview in clips, font info)

---

## Phase 146 - Text Clip Type
**Status:** Pending

### Tasks:
1. Update TimelineEngine to support text clips:
   - Text clips have no source file (sourceFileId is null)
   - sourceType: 'text'
   - Required text properties: text, fontFamily, fontSize, fontColor
   - Default duration: 5 seconds
   - Can be placed on any track (but typically a dedicated text track)

---

## Phase 147 - TextEditor Panel
**Status:** Pending

### Tasks:
1. Create `apps/web/src/features/video-editor/Properties/TextEditor.tsx`:
   - Shown in PropertiesPanel when a text clip is selected
   - Text input area (textarea for multi-line)
   - Font family dropdown (system fonts + web fonts)
   - Font size input (8-200)
   - Font weight selector (Regular, Bold)
   - Text alignment (Left, Center, Right)
   - Real-time preview: typing updates canvas immediately

---

## Phase 148 - Text Styling
**Status:** Pending

### Tasks:
1. Add styling controls to TextEditor:
   - Font color picker (hex input + color swatch)
   - Background color picker (with alpha/opacity)
   - Stroke color + stroke width
   - Shadow: color, blur, offset X, offset Y
   - Letter spacing
   - Line height
   - All changes update preview in real-time

---

## Phase 149 - Text Rendering on Canvas
**Status:** Pending

### Tasks:
1. Update VideoPreview to render text clips:
   - At render time, for text clips visible at currentTime:
     - Set ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
     - Set ctx.fillStyle = fontColor
     - Set ctx.textAlign = textAlign
     - If background: draw rect behind text
     - If stroke: ctx.strokeText() with strokeColor and lineWidth
     - If shadow: set ctx.shadowColor, shadowBlur, shadowOffsetX/Y
     - ctx.fillText(text, x, y)
   - Handle multi-line text (split by \n, render each line)
   - Respect clip position/scale/rotation transforms

---

## Phase 150 - Text Animation Presets
**Status:** Pending

### Tasks:
1. Implement text animations:
   - `fadeIn`: opacity 0 → 1 over animationDuration
   - `fadeOut`: opacity 1 → 0 at end
   - `slideIn`: text slides from left/right/top/bottom
   - `typewriter`: characters appear one by one
   - `bounce`: text bounces in (scale + translate)
   - `none`: no animation
2. Calculate animation state based on current time relative to clip start/end
3. Apply animation transforms during canvas render

---

## Phase 151 - Text Templates
**Status:** Pending

### Tasks:
1. Create pre-designed text styles:
   - **Title**: Large bold centered text, white with shadow
   - **Subtitle**: Medium text, slightly transparent, below center
   - **Lower Third**: Bottom-left, background bar, name + title format
   - **Caption**: Bottom-center, dark background, readable text
   - **Watermark**: Small, corner-positioned, semi-transparent
2. Display as clickable cards in left panel "Text" tab
3. Clicking creates a text clip with the template's styling

---

## Phase 152 - Text on Timeline
**Status:** Pending

### Tasks:
1. Render text clips on timeline:
   - Colored block (purple for text clips)
   - Show text preview truncated inside block
   - Same resize/move/trim behavior as other clips
   - Double-click on text clip: focus TextEditor + show editing state on canvas
   - Drag text position directly on canvas preview (optional)

### Section N Verification:
- Add a "Text" track
- Create text clip with "Hello World"
- Style with font, color, shadow
- See text rendered on video preview
- Apply "typewriter" animation → text types in
- Use "Lower Third" template → pre-styled text appears
- Move/resize text clip on timeline
- Text exports correctly in FFmpeg output
