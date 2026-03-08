import { Worker } from 'bullmq';
import { spawn } from 'child_process';
import { getRedisConnection, QUEUE_NAMES, InMemoryWorker, checkRedisAvailable } from '../config/queue.js';
import { VideoProject } from '../models/VideoProject.js';
import { ProcessingJob } from '../models/ProcessingJob.js';
import { buildExportCommand, parseProgress } from '../services/videoExport.service.js';

let io = null;

export function setExportSocketIO(socketIO) {
  io = socketIO;
}

function emitProgress(jobId, data) {
  if (io) {
    io.to(`job:${jobId}`).emit('job:progress', { jobId, ...data });
  }
}

let exportWorker = null;

async function processExportJob(job) {
  const { projectId, userId, settings, processingJobId } = job.data;

  try {
    // Update job status
    await ProcessingJob.findByIdAndUpdate(processingJobId, {
      status: 'processing',
      startedAt: new Date(),
    });

    // Load project
    const project = await VideoProject.findById(projectId);
    if (!project) throw new Error('Project not found');

    // Build FFmpeg command
    const { args, outputPath } = buildExportCommand(project, settings);

    // Calculate total frames for progress
    const totalFrames = Math.ceil((project.duration || 30) * (settings.fps || 30));

    // Spawn FFmpeg
    await new Promise((resolve, reject) => {
      const proc = spawn('ffmpeg', args);

      proc.stderr.on('data', (data) => {
        const line = data.toString();
        const progress = parseProgress(line, totalFrames);
        if (progress != null) {
          ProcessingJob.findByIdAndUpdate(processingJobId, { progress }).catch(() => {});
          emitProgress(processingJobId, { progress, status: 'processing' });
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      proc.on('error', reject);
    });

    // Update job as completed
    await ProcessingJob.findByIdAndUpdate(processingJobId, {
      status: 'completed',
      progress: 100,
      outputPath,
      completedAt: new Date(),
    });

    emitProgress(processingJobId, { progress: 100, status: 'completed' });
  } catch (err) {
    await ProcessingJob.findByIdAndUpdate(processingJobId, {
      status: 'failed',
      error: err.message,
      completedAt: new Date(),
    });
    emitProgress(processingJobId, { status: 'failed', error: err.message });
    throw err;
  }
}

export async function startExportWorker() {
  const hasRedis = await checkRedisAvailable();

  if (hasRedis) {
    exportWorker = new Worker(QUEUE_NAMES.videoExport, processExportJob, {
      connection: getRedisConnection(),
      concurrency: 1,
    });
    console.log('Export worker started (Redis)');
  } else {
    exportWorker = new InMemoryWorker(QUEUE_NAMES.videoExport, processExportJob);
    console.log('Export worker started (in-memory)');
  }

  exportWorker.on('failed', (job, err) => {
    console.error(`Export job ${job?.id} failed:`, err.message);
  });
}
