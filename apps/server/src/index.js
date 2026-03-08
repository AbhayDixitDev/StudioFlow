import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { ensureDirectories } from './config/storage.js';
import { defaultLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import audioRoutes from './routes/audio.routes.js';
import jobsRoutes from './routes/jobs.routes.js';
import videoRoutes from './routes/video.routes.js';
import { startSeparationWorker, setSocketIO } from './workers/separationWorker.js';
import { startExportWorker, setExportSocketIO } from './workers/exportWorker.js';
import { checkRedisAvailable } from './config/queue.js';
import { startCleanupCron } from './cron/cleanup.js';

const app = express();
const server = http.createServer(app);
const PORT = env.PORT;

// Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
});

// Socket.IO auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  // Join job room for real-time progress updates
  socket.on('job:subscribe', (jobId) => {
    socket.join(`job:${jobId}`);
  });

  socket.on('job:unsubscribe', (jobId) => {
    socket.leave(`job:${jobId}`);
  });
});

// Security
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(defaultLimiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/video', videoRoutes);

// Error handler (must be last)
app.use(errorHandler);

async function start() {
  ensureDirectories();
  await connectDB();

  // Start workers (uses Redis if available, otherwise in-memory fallback)
  setSocketIO(io);
  setExportSocketIO(io);
  await checkRedisAvailable();
  await startSeparationWorker();
  await startExportWorker();

  // Start file cleanup cron (Phase 216)
  startCleanupCron();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();

export default app;
