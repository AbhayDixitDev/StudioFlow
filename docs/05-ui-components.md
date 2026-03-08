# UI Components & Theme System

## Theme Tokens

### Dark Theme (`packages/ui/src/theme/dark.ts`)

```typescript
export const darkTheme = {
  name: 'dark',

  // Background colors
  bg: {
    primary: '#0a0a0f',          // Main app background (near black with blue tint)
    secondary: '#12121a',        // Card backgrounds
    tertiary: '#1a1a2e',         // Elevated surfaces
    sidebar: '#0d0d14',          // Sidebar background
    overlay: 'rgba(0, 0, 0, 0.6)', // Modal backdrop
  },

  // Glassmorphism
  glass: {
    bg: 'rgba(255, 255, 255, 0.05)',    // Glass card background
    border: 'rgba(255, 255, 255, 0.08)', // Glass card border
    blur: '20px',                        // Backdrop blur amount
    hoverBg: 'rgba(255, 255, 255, 0.08)', // Glass hover state
  },

  // Text colors
  text: {
    primary: '#e4e4e7',          // Primary text (zinc-200)
    secondary: '#a1a1aa',        // Secondary text (zinc-400)
    muted: '#71717a',            // Muted text (zinc-500)
    inverse: '#09090b',          // Text on light backgrounds
  },

  // Accent colors (neon)
  accent: {
    primary: '#06b6d4',          // Cyan-500 (main accent)
    primaryGlow: '0 0 20px rgba(6, 182, 212, 0.3)',  // Neon glow
    secondary: '#a855f7',        // Purple-500
    secondaryGlow: '0 0 20px rgba(168, 85, 247, 0.3)',
    tertiary: '#ec4899',         // Pink-500
    success: '#22c55e',          // Green-500
    warning: '#f59e0b',          // Amber-500
    error: '#ef4444',            // Red-500
  },

  // Borders
  border: {
    default: 'rgba(255, 255, 255, 0.08)',
    hover: 'rgba(255, 255, 255, 0.15)',
    focus: '#06b6d4',            // Cyan focus ring
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 25px rgba(0, 0, 0, 0.5)',
    glow: '0 0 30px rgba(6, 182, 212, 0.15)',  // Subtle cyan glow
  },

  // Gradients
  gradient: {
    primary: 'linear-gradient(135deg, #06b6d4, #a855f7)',  // Cyan to purple
    card: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(168, 85, 247, 0.1))',
    sidebar: 'linear-gradient(180deg, #0d0d14, #0a0a0f)',
  },
};
```

### Light Theme (`packages/ui/src/theme/light.ts`)

```typescript
export const lightTheme = {
  name: 'light',

  bg: {
    primary: '#fafafa',          // Main background (zinc-50)
    secondary: '#ffffff',        // Card backgrounds
    tertiary: '#f4f4f5',         // Elevated surfaces (zinc-100)
    sidebar: '#ffffff',          // Sidebar
    overlay: 'rgba(0, 0, 0, 0.3)',
  },

  glass: {
    bg: '#ffffff',
    border: '#e4e4e7',           // zinc-200
    blur: '0px',                 // No blur in light mode
    hoverBg: '#f4f4f5',
  },

  text: {
    primary: '#18181b',          // zinc-900
    secondary: '#52525b',        // zinc-600
    muted: '#a1a1aa',            // zinc-400
    inverse: '#fafafa',
  },

  accent: {
    primary: '#0891b2',          // Cyan-600 (darker for contrast)
    primaryGlow: 'none',
    secondary: '#9333ea',        // Purple-600
    secondaryGlow: 'none',
    tertiary: '#db2777',         // Pink-600
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
  },

  border: {
    default: '#e4e4e7',          // zinc-200
    hover: '#d4d4d8',            // zinc-300
    focus: '#0891b2',
  },

  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 25px rgba(0, 0, 0, 0.1)',
    glow: 'none',
  },

  gradient: {
    primary: 'linear-gradient(135deg, #0891b2, #9333ea)',
    card: 'none',
    sidebar: 'none',
  },
};
```

---

## Component Library (`packages/ui/src/components/`)

### Button

```
Props:
  variant: 'primary' | 'secondary' | 'ghost' | 'danger'
  size: 'sm' | 'md' | 'lg'
  loading: boolean
  disabled: boolean
  leftIcon: ReactNode
  rightIcon: ReactNode
  fullWidth: boolean
  children: ReactNode
  onClick: () => void

Styles:
  primary:  bg-accent-primary, text-white, hover glow effect (dark), shadow (light)
  secondary: glass bg, border, hover bg change
  ghost:    transparent, text-secondary, hover bg subtle
  danger:   bg-error, text-white

  sm:  px-3 py-1.5 text-sm
  md:  px-4 py-2 text-base
  lg:  px-6 py-3 text-lg

  loading: spinner icon replaces content, pointer-events-none
```

### Card

```
Props:
  variant: 'default' | 'glass' | 'outlined'
  hoverable: boolean
  padding: 'none' | 'sm' | 'md' | 'lg'
  children: ReactNode
  onClick: () => void

Styles:
  Dark mode: glassmorphism (backdrop-blur, semi-transparent bg, subtle border)
  Light mode: white bg, subtle shadow, border
  hoverable: translateY(-2px) on hover, shadow increase
```

### Modal

```
Props:
  isOpen: boolean
  onClose: () => void
  title: string
  size: 'sm' | 'md' | 'lg' | 'full'
  children: ReactNode
  footer: ReactNode

Styles:
  Backdrop: blur + dark overlay
  Entry: framer-motion scale + fade animation
  Exit: reverse animation
  sm:   max-w-sm
  md:   max-w-lg
  lg:   max-w-2xl
  full: max-w-5xl
```

### Slider

```
Props:
  value: number
  min: number
  max: number
  step: number
  label: string
  showValue: boolean
  formatValue: (v: number) => string
  onChange: (value: number) => void

Styles:
  Custom track (accent color fill), custom thumb (circle with glow in dark mode)
```

### ProgressBar

```
Props:
  value: number        (0-100, omit for indeterminate)
  variant: 'default' | 'accent' | 'success' | 'danger'
  size: 'sm' | 'md'
  showLabel: boolean
  animated: boolean

Styles:
  Determinate: filled bar with percentage
  Indeterminate: pulsing/sliding animation
  accent: cyan gradient fill
```

### Input

```
Props:
  label: string
  placeholder: string
  value: string
  error: string
  leftIcon: ReactNode
  rightIcon: ReactNode
  type: 'text' | 'email' | 'password' | 'number' | 'url'
  onChange: (value: string) => void

Styles:
  Dark: glass bg, subtle border, focus ring (cyan)
  Light: white bg, gray border, focus ring (cyan)
  Error: red border, error message below
```

### FileDropzone

```
Props:
  accept: string[]       (MIME types or extensions)
  maxSize: number        (bytes)
  multiple: boolean
  label: string
  description: string
  onFilesSelected: (files: File[]) => void

Styles:
  Dashed border, icon center
  Drag hover: border solid, bg change, scale animation on icon
  Active drop: pulse animation
  File preview after selection: filename, size, remove button
```

### WaveformDisplay

```
Props:
  peaks: Float32Array | number[]
  duration: number
  currentTime: number
  height: number
  color: string
  progressColor: string
  onSeek: (time: number) => void

Renders:
  Canvas-based waveform bars
  Progress overlay showing played portion
  Click-to-seek interaction
```

### Tooltip

```
Props:
  content: string | ReactNode
  placement: 'top' | 'bottom' | 'left' | 'right'
  delay: number
  children: ReactNode
```

### IconButton

```
Props:
  icon: ReactNode (lucide-react icon)
  tooltip: string
  variant: 'default' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  active: boolean
  onClick: () => void
```

---

## Layout Components

### AppShell

```
Props:
  children: ReactNode (main content)

Structure:
  ┌──────────────────────────────────────────┐
  │ Sidebar (240px, collapsible to 64px)     │
  │ ┌──────┐ ┌────────────────────────────┐  │
  │ │Logo  │ │                            │  │
  │ │      │ │      Main Content          │  │
  │ │Nav   │ │      (RouterOutlet)        │  │
  │ │Items │ │                            │  │
  │ │      │ │                            │  │
  │ │      │ │                            │  │
  │ │Theme │ │                            │  │
  │ │Toggle│ │                            │  │
  │ │User  │ │                            │  │
  │ └──────┘ └────────────────────────────┘  │
  └──────────────────────────────────────────┘

Sidebar nav items:
  - Audio Separator (icon: Scissors)
  - Video to Audio (icon: FileVideo)
  - Audio Cutter (icon: Cut)
  - Format Changer (icon: RefreshCw)
  - Video Editor (icon: Film)
  ---
  - Theme Toggle (icon: Sun/Moon)
  - Settings (icon: Settings)
  - User Avatar
```

### ToolPage

```
Props:
  title: string
  description: string
  children: ReactNode

Structure:
  ┌────────────────────────────────┐
  │  Title                         │
  │  Description text              │
  ├────────────────────────────────┤
  │                                │
  │  {children}                    │
  │                                │
  └────────────────────────────────┘
```

---

## Page-Level Component Hierarchies

### Home Page
```
Home
├── HeroSection (gradient text, tagline)
├── ToolCardsGrid (3x2 grid)
│   ├── ToolCard("Audio Separator", icon, description, link)
│   ├── ToolCard("Video to Audio", ...)
│   ├── ToolCard("Audio Cutter", ...)
│   ├── ToolCard("Format Changer", ...)
│   └── ToolCard("Video Editor", ...)
└── RecentActivity (list of recent jobs/projects)
```

### Audio Separator Page
```
AudioSeparator
├── ToolPage(title, description)
├── InputSection
│   ├── TabBar("Upload File" | "Paste URL")
│   ├── FileDropzone (audio/video files)
│   ├── Input (URL field)
│   └── StemSelector (model picker)
├── ProcessingSection
│   ├── ProgressBar (with percentage)
│   └── StatusText ("Separating vocals...")
└── ResultsSection
    ├── StemPlayer
    │   ├── MasterControls (play/pause, seek, volume)
    │   └── StemTrack[] (name, mini waveform, solo, mute, volume slider)
    └── DownloadPanel
        ├── StemCheckbox[] (select stems)
        ├── FormatPicker (output format)
        └── Button("Download Selected")
```

### Audio Cutter Page
```
AudioCutter
├── ToolPage(title, description)
├── FileDropzone
├── WaveformEditor
│   ├── WaveformCanvas
│   ├── RegionOverlay (highlighted selection)
│   ├── RegionHandle[start] (draggable)
│   ├── RegionHandle[end] (draggable)
│   ├── Playhead
│   └── TimeRuler
├── RegionSelector
│   ├── TimeInput(start)
│   ├── TimeInput(end)
│   └── DurationDisplay
├── ControlBar
│   ├── PlayButton
│   ├── ZoomSlider
│   ├── FadeInSlider
│   └── FadeOutSlider
└── ExportBar
    ├── FormatPicker
    └── Button("Cut & Download")
```

### Video Editor Page
```
VideoEditor (full-screen, 4-panel layout)
├── TopBar
│   ├── ProjectName (editable)
│   ├── UndoButton, RedoButton
│   ├── SaveButton
│   └── ExportButton
├── LeftPanel (280px)
│   ├── TabBar("Media" | "Text" | "Transitions" | "Effects")
│   ├── [Media tab] MediaBin
│   │   ├── ImportButton
│   │   └── MediaThumbnail[] (grid)
│   ├── [Text tab] TextTemplates[]
│   ├── [Transitions tab] TransitionPicker
│   └── [Effects tab] EffectPicker
├── CenterPanel (flexible)
│   ├── VideoPreview (canvas, 16:9 aspect)
│   └── PreviewControls
├── RightPanel (280px)
│   └── PropertiesPanel
│       ├── TransformControls (x, y, scale, rotation)
│       ├── OpacitySlider
│       ├── VolumeSlider
│       ├── EffectControls
│       └── TextEditor (when text clip selected)
└── BottomPanel (250px, resizable)
    └── Timeline
        ├── TimelineToolbar (add track, snap, zoom)
        ├── TimeRuler
        ├── Playhead
        └── TimelineTrack[]
            └── TimelineClip[]
```
