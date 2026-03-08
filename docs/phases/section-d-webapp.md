# Section D: Web App Shell (Phases 041-055)

## Progress Checklist
- [x] Phase 041 - Web App Scaffold (Vite + React)
- [x] Phase 042 - Router Setup (React Router v7)
- [x] Phase 043 - Theme Store (Zustand, localStorage)
- [x] Phase 044 - Auth Store (Zustand, login/logout)
- [x] Phase 045 - API Service (Axios instance, interceptors)
- [x] Phase 046 - Auth API Service (login, register, refresh)
- [x] Phase 047 - Sidebar Navigation (AppShell integration)
- [x] Phase 048 - Home Page (hero + tool cards)
- [x] Phase 049 - Login Page
- [x] Phase 050 - Register Page
- [x] Phase 051 - Audio Separator Stub Page
- [x] Phase 052 - Video to Audio Stub Page
- [x] Phase 053 - Audio Cutter Stub Page
- [x] Phase 054 - Format Changer Stub Page
- [x] Phase 055 - Video Editor Stub Page

---

## Phase 041 - Web App Scaffold
**Status:** Pending
**Goal:** Create the Vite + React app.

### Tasks:
1. Create `apps/web` via Vite: React + TypeScript template
2. Configure `vite.config.ts`:
   - Proxy `/api` to `http://localhost:5000`
   - Alias `@` to `src/`
   - Alias `@audio-sep/shared` and `@audio-sep/ui` to packages
3. Configure Tailwind CSS v4
4. Create `src/styles/globals.css` with Tailwind directives
5. Add @audio-sep/shared and @audio-sep/ui as workspace dependencies

---

## Phase 042 - Router Setup
**Status:** Pending

### Tasks:
1. Create `apps/web/src/router.tsx` with React Router v7:
   - `/` → Home
   - `/separator` → AudioSeparator
   - `/video-to-audio` → VideoToAudio
   - `/cutter` → AudioCutter
   - `/converter` → FormatChanger
   - `/editor` → VideoEditor
   - `/settings` → Settings
   - `/login` → Login
   - `/register` → Register
2. Wrap with `<BrowserRouter>` in main.tsx

---

## Phase 043 - Theme Store
**Status:** Pending

### Tasks:
1. Create `apps/web/src/stores/themeStore.ts`:
   - State: `theme: 'dark' | 'light'`
   - Actions: `toggleTheme()`, `setTheme(theme)`
   - Persist to localStorage on change
   - Initialize from localStorage (default: 'dark')

---

## Phase 044 - Auth Store
**Status:** Pending

### Tasks:
1. Create `apps/web/src/stores/authStore.ts`:
   - State: `user`, `token`, `refreshToken`, `isAuthenticated`, `isLoading`
   - Actions: `login(email, password)`, `register(...)`, `logout()`, `refreshAuth()`
   - Persist token to localStorage
   - Initialize from localStorage on app load

---

## Phase 045 - API Service
**Status:** Pending

### Tasks:
1. Create `apps/web/src/services/api.ts`:
   - Create Axios instance with baseURL: `/api`
   - Request interceptor: attach Bearer token from authStore
   - Response interceptor: handle 401 → try refresh → retry or logout
   - Error interceptor: normalize error format

---

## Phase 046 - Auth API Service
**Status:** Pending

### Tasks:
1. Create `apps/web/src/services/authApi.ts`:
   - `login(email, password)` → POST /auth/login
   - `register(name, email, password)` → POST /auth/register
   - `refreshToken(token)` → POST /auth/refresh
   - `getMe()` → GET /auth/me
   - All return typed responses using shared API types

---

## Phase 047 - Sidebar Navigation
**Status:** Pending

### Tasks:
1. Create `apps/web/src/App.tsx`:
   - Wrap with ThemeProvider from @audio-sep/ui
   - Render AppShell with sidebar nav items:
     - Audio Separator (Scissors icon) → /separator
     - Video to Audio (FileVideo icon) → /video-to-audio
     - Audio Cutter (Scissors icon) → /cutter
     - Format Changer (RefreshCw icon) → /converter
     - Video Editor (Film icon) → /editor
   - Theme toggle button in sidebar
   - RouterOutlet as main content

---

## Phase 048 - Home Page
**Status:** Pending

### Tasks:
1. Create `apps/web/src/pages/Home.tsx`:
   - Hero section: app name with gradient text, tagline
   - Tool cards grid (2x3 or responsive):
     - Each card: icon, title, short description, link
     - Glass card style (dark) / shadow card (light)
     - Hover: lift + glow effect
   - Framer Motion stagger animation on mount

---

## Phase 049 - Login Page
**Status:** Pending

### Tasks:
1. Create `apps/web/src/pages/Auth/Login.tsx`:
   - Email + password inputs
   - Login button with loading state
   - "Don't have an account? Register" link
   - Error display for invalid credentials
   - On success: redirect to Home, store tokens

---

## Phase 050 - Register Page
**Status:** Pending

### Tasks:
1. Create `apps/web/src/pages/Auth/Register.tsx`:
   - Name + email + password + confirm password inputs
   - Client-side validation
   - Register button with loading state
   - "Already have an account? Login" link
   - On success: redirect to Home, store tokens

---

## Phases 051-055 - Stub Pages
**Status:** Pending

### Tasks (each phase = 1 stub page):
- Phase 051: `pages/AudioSeparator.tsx` - ToolPage layout with "Audio Separator" title
- Phase 052: `pages/VideoToAudio.tsx` - ToolPage layout with "Video to Audio" title
- Phase 053: `pages/AudioCutter.tsx` - ToolPage layout with "Audio Cutter" title
- Phase 054: `pages/FormatChanger.tsx` - ToolPage layout with "Format Changer" title
- Phase 055: `pages/VideoEditor.tsx` - Full-screen layout placeholder

Each stub page should have:
- ToolPage wrapper with title + description
- A centered placeholder message: "This tool is coming soon"
- An icon related to the tool

### Section D Verification:
- `npm run dev --workspace=apps/web` opens in browser
- Theme toggle switches between dark and light
- All sidebar nav items navigate to their pages
- Login/Register forms work with the server API
- All stub pages render with proper layout
