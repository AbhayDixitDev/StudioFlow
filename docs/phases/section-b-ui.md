# Section B: UI Component Library (Phases 011-025)

## Progress Checklist
- [x] Phase 011 - UI Package Scaffold (package.json, folder structure)
- [x] Phase 012 - Dark Theme Tokens (dark.js)
- [x] Phase 013 - Light Theme Tokens (light.js)
- [x] Phase 014 - ThemeProvider (ThemeProvider.jsx, useTheme hook)
- [x] Phase 015 - Animation Presets (animations.js)
- [x] Phase 016 - Button Component (Button.jsx)
- [x] Phase 017 - Card Component (Card.jsx)
- [x] Phase 018 - Modal Component (Modal.jsx)
- [x] Phase 019 - Slider + ProgressBar (Slider.jsx, ProgressBar.jsx)
- [x] Phase 020 - Input + Select (Input.jsx, Select.jsx)
- [x] Phase 021 - FileDropzone (FileDropzone.jsx)
- [x] Phase 022 - Tooltip + IconButton (Tooltip.jsx, IconButton.jsx)
- [x] Phase 023 - WaveformDisplay (WaveformDisplay.jsx)
- [x] Phase 024 - AppShell Layout (AppShell.jsx)
- [x] Phase 025 - ToolPage Layout (ToolPage.jsx, barrel exports)

> NOTE: All components written in plain JavaScript (.jsx) instead of TypeScript (.tsx).

---

## Phase 011 - UI Package Scaffold
**Status:** Pending
**Goal:** Create the packages/ui React component library.

### Tasks:
1. Create `packages/ui/package.json`:
   - name: "@audio-sep/ui"
   - peerDependencies: react, react-dom
   - dependencies: tailwindcss, framer-motion, lucide-react, clsx, tailwind-merge
2. Create `packages/ui/tsconfig.json` with jsx: react-jsx
3. Create folder structure: `src/theme/`, `src/components/`, `src/layouts/`
4. Create `src/index.ts` barrel export

---

## Phase 012 - Dark Theme Tokens
**Status:** Pending
**Goal:** Define the dark glassmorphism theme.

### Tasks:
1. Create `packages/ui/src/theme/dark.ts` with all token values from docs/05-ui-components.md
2. Export as `darkTheme` object with: bg, glass, text, accent, border, shadow, gradient sections

---

## Phase 013 - Light Theme Tokens
**Status:** Pending
**Goal:** Define the clean light theme.

### Tasks:
1. Create `packages/ui/src/theme/light.ts` with all token values from docs/05-ui-components.md
2. Export as `lightTheme` object matching same structure as dark theme

---

## Phase 014 - ThemeProvider
**Status:** Pending
**Goal:** React context for theme management.

### Tasks:
1. Create `packages/ui/src/theme/ThemeProvider.tsx`:
   - `ThemeContext` with current theme + toggle function
   - `ThemeProvider` component that injects CSS variables from theme tokens
   - `useTheme()` hook to access theme in any component
   - Apply CSS variables to document root on theme change
2. Create `packages/ui/src/theme/index.ts` re-exporting all

---

## Phase 015 - Animation Presets
**Status:** Pending
**Goal:** Reusable Framer Motion animation variants.

### Tasks:
1. Create `packages/ui/src/theme/animations.ts` with:
   - `fadeIn`: opacity 0 → 1
   - `fadeInUp`: opacity 0 → 1, y 20 → 0
   - `fadeInDown`: opacity 0 → 1, y -20 → 0
   - `scaleIn`: scale 0.95 → 1, opacity 0 → 1
   - `slideInLeft`: x -20 → 0, opacity 0 → 1
   - `slideInRight`: x 20 → 0
   - `pageTransition`: for route changes
   - `staggerChildren`: parent variant that staggers children

---

## Phase 016 - Button Component
**Status:** Pending
**Goal:** Versatile button with variants.

### Tasks:
1. Create `packages/ui/src/components/Button.tsx`:
   - Props: variant, size, loading, disabled, leftIcon, rightIcon, fullWidth, children, onClick
   - Variants: primary (accent bg + glow), secondary (glass), ghost (transparent), danger (red)
   - Sizes: sm, md, lg
   - Loading state: spinner icon, pointer-events-none
   - Use clsx + tailwind-merge for class composition
   - Framer Motion whileHover/whileTap for micro-interactions

---

## Phase 017 - Card Component
**Status:** Pending
**Goal:** Glass card with theme awareness.

### Tasks:
1. Create `packages/ui/src/components/Card.tsx`:
   - Props: variant (default/glass/outlined), hoverable, padding, children, onClick
   - Dark mode: backdrop-blur-xl, bg-white/5, border-white/8
   - Light mode: bg-white, shadow-md, border-gray-200
   - Hoverable: translateY(-2px) lift effect
   - Use CSS variables from ThemeProvider

---

## Phase 018 - Modal Component
**Status:** Pending
**Goal:** Animated modal with backdrop blur.

### Tasks:
1. Create `packages/ui/src/components/Modal.tsx`:
   - Props: isOpen, onClose, title, size (sm/md/lg/full), children, footer
   - Backdrop: blur + overlay, click to close
   - Framer Motion AnimatePresence for enter/exit
   - Focus trap (trap focus inside modal when open)
   - Close on Escape key

---

## Phase 019 - Slider + ProgressBar
**Status:** Pending

### Tasks:
1. Create `packages/ui/src/components/Slider.tsx`:
   - Props: value, min, max, step, label, showValue, formatValue, onChange
   - Custom styled range input with accent-colored filled track
   - Thumb with glow effect in dark mode
2. Create `packages/ui/src/components/ProgressBar.tsx`:
   - Props: value (0-100, omit for indeterminate), variant, size, showLabel, animated
   - Determinate: filled bar with optional percentage text
   - Indeterminate: pulsing/sliding animation (CSS keyframes)

---

## Phase 020 - Input + Select
**Status:** Pending

### Tasks:
1. Create `packages/ui/src/components/Input.tsx`:
   - Props: label, placeholder, value, error, leftIcon, rightIcon, type, onChange
   - Themed styling (glass in dark, clean in light)
   - Error state: red border, error message text
   - Focus ring with accent color
2. Create `packages/ui/src/components/Select.tsx`:
   - Props: label, options, value, onChange, placeholder
   - Custom styled dropdown matching theme

---

## Phase 021 - FileDropzone
**Status:** Pending
**Goal:** Drag-and-drop file upload component.

### Tasks:
1. Create `packages/ui/src/components/FileDropzone.tsx`:
   - Props: accept (MIME types), maxSize, multiple, label, description, onFilesSelected
   - Dashed border area with upload icon
   - Drag hover state: border solid, bg highlight, icon scale animation
   - Click to open file browser
   - Validate file type and size, show error if invalid
   - After file selected: show filename, size, remove button
   - Multiple files: list all selected files

---

## Phase 022 - Tooltip + IconButton
**Status:** Pending

### Tasks:
1. Create `packages/ui/src/components/Tooltip.tsx`:
   - Props: content, placement (top/bottom/left/right), delay, children
   - Show on hover after delay
   - Positioned relative to trigger
2. Create `packages/ui/src/components/IconButton.tsx`:
   - Props: icon (lucide-react), tooltip, variant, size, active, onClick
   - Render icon with Tooltip wrapper
   - Active state: accent background

---

## Phase 023 - WaveformDisplay
**Status:** Pending
**Goal:** Canvas-based waveform renderer.

### Tasks:
1. Create `packages/ui/src/components/WaveformDisplay.tsx`:
   - Props: peaks (Float32Array | number[]), duration, currentTime, height, color, progressColor, onSeek
   - Canvas element that draws vertical bars from peaks data
   - Progress overlay (different color for played portion)
   - Click-to-seek: map click X position to time
   - Responsive: redraw on resize
   - Theme-aware colors

---

## Phase 024 - AppShell Layout
**Status:** Pending
**Goal:** Main application layout with sidebar.

### Tasks:
1. Create `packages/ui/src/layouts/AppShell.tsx`:
   - Sidebar (240px width, collapsible to 64px icon-only)
   - Logo at top
   - Navigation items with icons + labels
   - Active item highlighting (accent color bar)
   - Theme toggle at bottom
   - User section at bottom
   - Main content area fills remaining space
   - Responsive: sidebar becomes bottom nav on mobile
   - Smooth collapse/expand animation

---

## Phase 025 - ToolPage Layout
**Status:** Pending
**Goal:** Standard page layout for tool pages.

### Tasks:
1. Create `packages/ui/src/layouts/ToolPage.tsx`:
   - Props: title, description, children
   - Header section: large title, muted description text
   - Divider
   - Content area: renders children
   - Max-width container for readability
2. Create `packages/ui/src/components/index.ts` and `packages/ui/src/layouts/index.ts` barrel exports

### Section B Verification:
- All components export from `@audio-sep/ui`
- Components render correctly in both dark and light themes
- Animations are smooth (60fps)
- All components are properly typed with TypeScript
