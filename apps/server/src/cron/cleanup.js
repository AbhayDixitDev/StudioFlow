/**
 * Phase 216: File cleanup cron job.
 * Deletes old uploaded/processed files to free disk space.
 * Runs every 6 hours by default.
 */
import fs from 'fs';
import path from 'path';
import { AudioFile } from '../models/AudioFile.js';
import { SeparationJob } from '../models/SeparationJob.js';
import { ProcessingJob } from '../models/ProcessingJob.js';
import { DIRS } from '../config/storage.js';

// Max age before cleanup (in milliseconds)
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

function removeFileIfExists(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (err) {
    console.warn(`[Cleanup] Failed to delete ${filePath}:`, err.message);
  }
  return false;
}

function cleanDirectory(dirPath, maxAgeMs) {
  let count = 0;
  try {
    if (!fs.existsSync(dirPath)) return 0;
    const files = fs.readdirSync(dirPath);
    const now = Date.now();

    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isFile() && now - stat.mtimeMs > maxAgeMs) {
          fs.unlinkSync(fullPath);
          count++;
        }
      } catch {
        // skip files we can't stat
      }
    }
  } catch (err) {
    console.warn(`[Cleanup] Error reading directory ${dirPath}:`, err.message);
  }
  return count;
}

async function cleanupOldRecords() {
  const cutoff = new Date(Date.now() - MAX_AGE_MS);
  let deletedFiles = 0;
  let deletedJobs = 0;

  try {
    // Clean old audio files
    const oldAudioFiles = await AudioFile.find({ createdAt: { $lt: cutoff } });
    for (const af of oldAudioFiles) {
      removeFileIfExists(af.storagePath);
      await AudioFile.deleteOne({ _id: af._id });
      deletedFiles++;
    }

    // Clean old separation jobs
    const oldSepJobs = await SeparationJob.find({
      createdAt: { $lt: cutoff },
      status: { $in: ['completed', 'failed'] },
    });
    for (const job of oldSepJobs) {
      if (job.stems) {
        for (const stem of job.stems) {
          removeFileIfExists(stem.storagePath);
        }
      }
      await SeparationJob.deleteOne({ _id: job._id });
      deletedJobs++;
    }

    // Clean old processing jobs
    const oldProcJobs = await ProcessingJob.find({
      createdAt: { $lt: cutoff },
      status: { $in: ['completed', 'failed'] },
    });
    for (const job of oldProcJobs) {
      removeFileIfExists(job.outputPath);
      await ProcessingJob.deleteOne({ _id: job._id });
      deletedJobs++;
    }
  } catch (err) {
    console.error('[Cleanup] Database cleanup error:', err.message);
  }

  return { deletedFiles, deletedJobs };
}

async function runCleanup() {
  console.log('[Cleanup] Starting scheduled cleanup...');
  const start = Date.now();

  // Clean database records and associated files
  const { deletedFiles, deletedJobs } = await cleanupOldRecords();

  // Clean orphaned files in output directories
  let orphanCount = 0;
  const dirs = [
    DIRS.outputs,
    DIRS.converted,
    DIRS.cut,
    DIRS.exports,
    DIRS.thumbnails,
  ].filter(Boolean);

  for (const dir of dirs) {
    orphanCount += cleanDirectory(dir, MAX_AGE_MS);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(
    `[Cleanup] Done in ${elapsed}s — removed ${deletedFiles} files, ${deletedJobs} jobs, ${orphanCount} orphaned files`
  );
}

let cleanupTimer = null;

export function startCleanupCron() {
  // Run once on startup (after 30s delay)
  setTimeout(runCleanup, 30000);
  // Then repeat every 6 hours
  cleanupTimer = setInterval(runCleanup, INTERVAL_MS);
  console.log('[Cleanup] Cron scheduled every 6 hours');
}

export function stopCleanupCron() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
