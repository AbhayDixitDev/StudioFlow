# Deployment & Build Guide

---

## Prerequisites

### All Platforms
- Node.js 20+ (LTS)
- npm 10+
- Git

### Server
- MongoDB 7+ (local or Atlas)
- Redis 7+ (for BullMQ job queue)
- FFmpeg 6+ (system-wide installation)
- yt-dlp (system-wide installation)

### ML Backend
- Python 3.10+
- pip or conda
- CUDA toolkit 12+ (optional, for GPU acceleration)

### Desktop Build
- Windows 10/11
- Visual Studio Build Tools (for native node modules)

### Mobile Build
- Android Studio + Android SDK
- Xcode (for iOS, macOS only)
- Java JDK 17

---

## Environment Variables

```bash
# .env (server)
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/audio-separator
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_REFRESH_EXPIRES_IN=30d
REDIS_URL=redis://localhost:6379
UPLOAD_DIR=./data/uploads
OUTPUT_DIR=./data/outputs
MAX_FILE_SIZE=524288000          # 500MB in bytes
PYTHON_PATH=python               # or path to python executable
DEMUCS_MODEL_DIR=./ml/models
CORS_ORIGIN=http://localhost:5173
```

---

## Development Setup

### 1. Clone and Install

```bash
cd "c:\Users\ABHAY\Desktop\Audio Seperator"
npm install                      # Installs all workspace dependencies
```

### 2. Start MongoDB & Redis

```bash
# MongoDB (if local)
mongod --dbpath ./data/db

# Redis (if local, or use Docker)
redis-server

# Or use Docker:
docker run -d -p 27017:27017 --name mongo mongo:7
docker run -d -p 6379:6379 --name redis redis:7
```

### 3. Set Up Python Environment

```bash
cd ml
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
```

### 4. Start Development Servers

```bash
# From root - starts all apps in parallel
npm run dev

# Or individually:
npm run dev --workspace=apps/server    # Express API on :5000
npm run dev --workspace=apps/web       # Vite dev server on :5173
```

### 5. Start Electron (Desktop)

```bash
npm run dev --workspace=apps/desktop   # Electron with hot reload
```

---

## Build Commands

### Build All Packages

```bash
npm run build                    # Turborepo builds all packages in order
```

### Build Individual Packages

```bash
npm run build --workspace=packages/shared
npm run build --workspace=packages/ui
npm run build --workspace=apps/web
npm run build --workspace=apps/server
```

### Build Desktop (Windows .exe)

```bash
cd apps/desktop
npm run build                    # Compile TypeScript
npm run package                  # Create Windows installer
# Output: apps/desktop/dist/Audio Separator Setup.exe
```

**electron-builder.yml:**
```yaml
appId: com.audioseparator.app
productName: Audio Separator
directories:
  output: dist
  buildResources: resources
win:
  target:
    - target: nsis
      arch: [x64]
  icon: resources/icon.ico
nsis:
  oneClick: false
  perMachine: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
extraResources:
  - from: resources/ffmpeg/
    to: ffmpeg/
    filter: ["**/*"]
files:
  - "dist/**/*"
  - "!node_modules"
```

### Build Mobile (Android APK)

```bash
cd apps/mobile
npx react-native build-android --mode=release
# Output: apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

---

## Production Deployment (Web + Server)

### Option 1: Single VPS

```bash
# Build web app
cd apps/web && npm run build    # Output: apps/web/dist/

# Build server
cd apps/server && npm run build # Output: apps/server/dist/

# Serve web app via Express (or Nginx)
# The server can serve static files from apps/web/dist/

# Process manager
npm install -g pm2
pm2 start apps/server/dist/index.js --name audio-sep-api
pm2 startup                     # Auto-start on reboot
pm2 save
```

### Option 2: Docker

```dockerfile
# Dockerfile (server)
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/server/ ./apps/server/
RUN npm ci --workspace=apps/server
RUN npm run build --workspace=apps/server
EXPOSE 5000
CMD ["node", "apps/server/dist/index.js"]
```

```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports: ["5000:5000"]
    env_file: .env
    depends_on: [mongo, redis]
  mongo:
    image: mongo:7
    volumes: ["mongo-data:/data/db"]
  redis:
    image: redis:7
  ml:
    build: ./ml
    volumes: ["./data:/data"]
volumes:
  mongo-data:
```

### Nginx Config (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name audioseparator.com;

    # Serve web app
    location / {
        root /var/www/audio-separator/web/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        client_max_body_size 500M;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

---

## File Storage

### Development
Files stored locally in `./data/` directory.

### Production Options
1. **Local disk**: Simple, works for single server
2. **S3/MinIO**: For scaling, use object storage
3. **Cleanup cron**: Delete files older than 24 hours

```typescript
// Server cron job (using node-cron or BullMQ repeatable job)
// Run every hour: delete files in uploads/outputs older than 24 hours
```

---

## Monitoring

### Health Check

```
GET /api/health
Response: { status: "ok", uptime: 12345, db: "connected", redis: "connected" }
```

### Logging

```typescript
// Use structured logging
import { createLogger } from 'winston';
// Log levels: error, warn, info, debug
// Log to: console (dev), file (prod)
```

---

## Security Checklist

- [ ] JWT_SECRET is a strong random string (32+ chars)
- [ ] CORS_ORIGIN restricts to actual frontend domain
- [ ] Rate limiting enabled (100 req/15min default)
- [ ] Helmet security headers enabled
- [ ] File upload type validation (whitelist, not blacklist)
- [ ] File size limits enforced
- [ ] MongoDB connection string not exposed
- [ ] No sensitive data in client-side code
- [ ] HTTPS in production (Let's Encrypt / Cloudflare)
- [ ] Input validation on all endpoints (Zod)
