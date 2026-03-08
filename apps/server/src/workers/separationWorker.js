import { Worker } from 'bullmq';
import fs from 'fs';
import path from 'path';
import { getRedisConnection, QUEUE_NAMES, InMemoryWorker, checkRedisAvailable } from '../config/queue.js';
import { separate } from '../services/demucs.service.js';
import { extractAudio } from '../services/ffmpeg.service.js';
import { SeparationJob } from '../models/SeparationJob.js';
import { DIRS } from '../config/storage.js';

// File extensions that need conversion to WAV before separation
const VIDEO_EXTS = new Set(['.mp4', '.mkv', '.avi', '.mov', '.webm', '.wmv', '.flv', '.m4v']);
const NEEDS_CONVERT = new Set([...VIDEO_EXTS, '.m4a', '.aac', '.wma', '.opus']);

let io = null;

/**
 * Set the Socket.IO instance for emitting progress events.
 */
export function setSocketIO(socketIO) {
  io = socketIO;
}

function emitProgress(jobId, data) {
  if (io) {
    io.to(`job:${jobId}`).emit('job:progress', { jobId, ...data });
  }
}

function emitCompleted(jobId, data) {
  if (io) {
    io.to(`job:${jobId}`).emit('job:completed', { jobId, ...data });
  }
}

function emitFailed(jobId, error) {
  if (io) {
    io.to(`job:${jobId}`).emit('job:failed', { jobId, error });
  }
}

async function processJob(job) {
  const { jobId, audioFilePath, outputDir, model, userId } = job.data;

  // Update status to processing
  const sepJob = await SeparationJob.findById(jobId);
  if (!sepJob) throw new Error(`Job ${jobId} not found in database`);

  sepJob.status = 'processing';
  sepJob.startedAt = new Date();
  await sepJob.save();

  emitProgress(jobId, { status: 'processing', progress: 0 });

  // Ensure output directory exists
  const stemDir = path.join(DIRS.stems, userId, jobId);
  fs.mkdirSync(stemDir, { recursive: true });

  // Convert video/unsupported formats to WAV before separation
  let inputForSeparation = audioFilePath;
  let tempWav = null;
  const ext = path.extname(audioFilePath).toLowerCase();

  if (NEEDS_CONVERT.has(ext)) {
    tempWav = path.join(stemDir, '_input.wav');
    console.log(`Converting ${ext} to WAV for separation...`);
    await extractAudio(audioFilePath, tempWav, {});
    inputForSeparation = tempWav;
  }

  // Run separation
  const result = await separate(inputForSeparation, stemDir, model, {
    onProgress: async (pct) => {
      // Use findByIdAndUpdate to avoid ParallelSaveError
      SeparationJob.findByIdAndUpdate(jobId, { progress: pct }).catch(() => {});
      emitProgress(jobId, { status: 'processing', progress: pct });
      job.updateProgress(pct).catch(() => {});
    },
  });

  // Update job with completed stems
  const completedAt = new Date();
  const processingTime = Date.now() - sepJob.startedAt.getTime();
  await SeparationJob.findByIdAndUpdate(jobId, {
    status: 'completed',
    progress: 100,
    stems: result.stems.map((s) => ({
      name: s.name,
      storagePath: s.path,
      fileSize: s.size,
      format: 'wav',
    })),
    completedAt,
    processingTime,
  });

  // Clean up temp WAV if we created one
  if (tempWav && fs.existsSync(tempWav)) {
    try { fs.unlinkSync(tempWav); } catch {}
  }

  emitCompleted(jobId, {
    stems: result.stems,
    processingTime,
  });

  return { jobId, stems: result.stems };
}

let worker = null;

function attachEvents(w) {
  w.on('completed', (job, result) => {
    console.log(`Separation job ${result?.jobId || job?.id} completed`);
  });

  w.on('failed', async (job, err) => {
    console.error(`Separation job failed:`, err.message);

    if (job?.data?.jobId) {
      try {
        const sepJob = await SeparationJob.findById(job.data.jobId);
        if (sepJob && sepJob.status !== 'completed') {
          sepJob.status = 'failed';
          sepJob.error = err.message;
          sepJob.completedAt = new Date();
          if (sepJob.startedAt) {
            sepJob.processingTime = Date.now() - sepJob.startedAt.getTime();
          }
          await sepJob.save();
        }
        emitFailed(job.data.jobId, err.message);
      } catch {
        // DB update failed, log and continue
      }
    }
  });
}

export async function startSeparationWorker() {
  const hasRedis = await checkRedisAvailable();

  if (hasRedis) {
    worker = new Worker(QUEUE_NAMES.separation, processJob, {
      connection: getRedisConnection(),
      concurrency: 1,
    });
    console.log('Separation worker started (Redis)');
  } else {
    worker = new InMemoryWorker(QUEUE_NAMES.separation, processJob);
    console.log('Separation worker started (in-memory)');
  }

  attachEvents(worker);
  return worker;
}

export function stopSeparationWorker() {
  if (worker) {
    return worker.close();
  }
}
