import fs from 'fs';
import path from 'path';
import { VideoProject } from '../models/VideoProject.js';
import { ProcessingJob } from '../models/ProcessingJob.js';
import { AppError, NotFoundError } from '../middleware/errorHandler.js';
import { getVideoExportQueue } from '../config/queue.js';

export async function createProject(req, res, next) {
  try {
    const { name, projectSettings, tracks, mediaFiles } = req.body;

    const project = await VideoProject.create({
      userId: req.user._id,
      name: name || 'Untitled Project',
      projectSettings: projectSettings || {},
      tracks: tracks || [],
      mediaFiles: mediaFiles || [],
      duration: 0,
    });

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    const { name, projectSettings, tracks, mediaFiles, duration, thumbnail } = req.body;

    const project = await VideoProject.findOne({ _id: id, userId: req.user._id });
    if (!project) throw new NotFoundError('Project not found');

    if (name != null) project.name = name;
    if (projectSettings) project.projectSettings = { ...project.projectSettings, ...projectSettings };
    if (tracks) project.tracks = tracks;
    if (mediaFiles) project.mediaFiles = mediaFiles;
    if (duration != null) project.duration = duration;
    if (thumbnail != null) project.thumbnail = thumbnail;

    await project.save();

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
}

export async function getProjects(req, res, next) {
  try {
    const projects = await VideoProject.find(
      { userId: req.user._id },
      { name: 1, thumbnail: 1, projectSettings: 1, duration: 1, updatedAt: 1, createdAt: 1 }
    )
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
}

export async function getProject(req, res, next) {
  try {
    const { id } = req.params;
    const project = await VideoProject.findOne({ _id: id, userId: req.user._id }).lean();
    if (!project) throw new NotFoundError('Project not found');

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;
    const project = await VideoProject.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!project) throw new NotFoundError('Project not found');

    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
}

export async function startExport(req, res, next) {
  try {
    const { projectId, settings } = req.body;
    if (!projectId) throw new AppError('projectId required', 400, 'VALIDATION_ERROR');

    const project = await VideoProject.findOne({ _id: projectId, userId: req.user._id });
    if (!project) throw new NotFoundError('Project not found');

    // Create processing job record
    const processingJob = await ProcessingJob.create({
      userId: req.user._id,
      type: 'video-export',
      status: 'queued',
      input: {
        projectId,
        resolution: { width: settings?.width || 1920, height: settings?.height || 1080 },
        fps: settings?.fps || 30,
        videoFormat: settings?.format || 'mp4',
        quality: settings?.quality || 'high',
      },
    });

    // Queue the export job
    const queue = getVideoExportQueue();
    await queue.add('export', {
      projectId,
      userId: req.user._id.toString(),
      settings: settings || {},
      processingJobId: processingJob._id.toString(),
    });

    res.status(202).json({
      success: true,
      data: { jobId: processingJob._id },
    });
  } catch (err) {
    next(err);
  }
}

export async function downloadExport(req, res, next) {
  try {
    const { jobId } = req.params;
    const job = await ProcessingJob.findOne({ _id: jobId, userId: req.user._id });
    if (!job) throw new NotFoundError('Job not found');
    if (job.status !== 'completed' || !job.outputPath) {
      throw new AppError('Export not ready', 400, 'NOT_READY');
    }

    if (!fs.existsSync(job.outputPath)) {
      throw new NotFoundError('Export file not found');
    }

    res.download(job.outputPath, path.basename(job.outputPath));
  } catch (err) {
    next(err);
  }
}
