import { SeparationJob } from '../models/SeparationJob.js';
import { ProcessingJob } from '../models/ProcessingJob.js';
import { NotFoundError } from '../middleware/errorHandler.js';

export async function getJobStatus(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Check SeparationJob first
    let job = await SeparationJob.findOne({ _id: id, userId });
    if (job) {
      return res.json({
        success: true,
        data: {
          id: job._id,
          type: 'separation',
          status: job.status,
          progress: job.progress,
          model: job.model,
          stems: job.stems.map((s) => ({
            name: s.name,
            fileSize: s.fileSize,
            format: s.format,
          })),
          error: job.error || null,
          processingTime: job.processingTime || null,
          createdAt: job.createdAt,
          startedAt: job.startedAt || null,
          completedAt: job.completedAt || null,
        },
      });
    }

    // Check ProcessingJob
    job = await ProcessingJob.findOne({ _id: id, userId });
    if (job) {
      return res.json({
        success: true,
        data: {
          id: job._id,
          type: job.type,
          status: job.status,
          progress: job.progress,
          error: job.error || null,
          outputFileSize: job.outputFileSize || null,
          processingTime: job.processingTime || null,
          createdAt: job.createdAt,
          startedAt: job.startedAt || null,
          completedAt: job.completedAt || null,
        },
      });
    }

    throw new NotFoundError('Job not found');
  } catch (err) {
    next(err);
  }
}

export async function getUserJobs(req, res, next) {
  try {
    const userId = req.user._id;
    const { type, status, limit = 20, offset = 0 } = req.query;

    const filter = { userId };
    if (status) filter.status = status;

    let jobs = [];

    if (!type || type === 'separation') {
      const sepJobs = await SeparationJob.find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit))
        .lean();

      jobs.push(...sepJobs.map((j) => ({ ...j, type: 'separation' })));
    }

    if (!type || type !== 'separation') {
      const procFilter = { ...filter };
      if (type) procFilter.type = type;

      const procJobs = await ProcessingJob.find(procFilter)
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit))
        .lean();

      jobs.push(...procJobs);
    }

    // Sort combined by createdAt descending
    jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    jobs = jobs.slice(0, Number(limit));

    res.json({
      success: true,
      data: jobs.map((j) => ({
        id: j._id,
        type: j.type,
        status: j.status,
        progress: j.progress,
        model: j.model || null,
        error: j.error || null,
        createdAt: j.createdAt,
        completedAt: j.completedAt || null,
      })),
    });
  } catch (err) {
    next(err);
  }
}
