import path from 'path';
import fs from 'fs';
import { AudioFile } from '../models/AudioFile.js';
import { SeparationJob } from '../models/SeparationJob.js';
import { ProcessingJob } from '../models/ProcessingJob.js';
import { AppError, NotFoundError } from '../middleware/errorHandler.js';
import { probeFile, convertAudio, extractAudio, cutAudio } from '../services/ffmpeg.service.js';
import { DIRS } from '../config/storage.js';
import { downloadAudio, getVideoInfo } from '../services/youtube.service.js';
import { getSeparationQueue } from '../config/queue.js';
import { getModels } from '../services/demucs.service.js';

export async function upload(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('No file provided', 400, 'VALIDATION_ERROR');
    }

    const ext = path.extname(req.file.originalname).replace('.', '').toLowerCase();

    // Probe file for metadata
    let metadata = { duration: 0, sampleRate: 0, channels: 0, bitrate: 0 };
    try {
      metadata = await probeFile(req.file.path);
    } catch {
      // FFmpeg not available or file not probeable - continue with defaults
    }

    const audioFile = await AudioFile.create({
      userId: req.user._id,
      originalName: req.file.originalname,
      storagePath: req.file.path,
      format: ext,
      duration: metadata.duration,
      sampleRate: metadata.sampleRate,
      channels: metadata.channels,
      fileSize: req.file.size,
      bitrate: metadata.bitrate,
      source: 'upload',
    });

    res.status(201).json({
      success: true,
      data: {
        id: audioFile._id,
        originalName: audioFile.originalName,
        format: audioFile.format,
        duration: audioFile.duration,
        sampleRate: audioFile.sampleRate,
        channels: audioFile.channels,
        fileSize: audioFile.fileSize,
        bitrate: audioFile.bitrate,
        createdAt: audioFile.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function convert(req, res, next) {
  try {
    const { fileId, targetFormat, bitrate, sampleRate } = req.body;

    if (!fileId || !targetFormat) {
      throw new AppError('fileId and targetFormat are required', 400, 'VALIDATION_ERROR');
    }

    const audioFile = await AudioFile.findOne({
      _id: fileId,
      userId: req.user._id,
    });
    if (!audioFile) throw new NotFoundError('Audio file not found');

    // Create job
    const job = await ProcessingJob.create({
      userId: req.user._id,
      type: 'convert',
      input: { fileId: audioFile._id, targetFormat, bitrate, sampleRate },
    });

    // Build output path
    const userDir = path.join(DIRS.converted, req.user._id.toString());
    fs.mkdirSync(userDir, { recursive: true });
    const outputPath = path.join(userDir, `${job._id}.${targetFormat}`);

    // Update job to processing
    job.status = 'processing';
    job.startedAt = new Date();
    await job.save();

    try {
      await convertAudio(audioFile.storagePath, outputPath, {
        bitrate: bitrate || undefined,
        sampleRate: sampleRate || undefined,
      });

      const stat = fs.statSync(outputPath);
      job.status = 'completed';
      job.outputPath = outputPath;
      job.outputFileSize = stat.size;
      job.completedAt = new Date();
      job.processingTime = Date.now() - job.startedAt.getTime();
      job.progress = 100;
      await job.save();
    } catch (err) {
      job.status = 'failed';
      job.error = err.message;
      job.completedAt = new Date();
      await job.save();
      throw new AppError('Conversion failed: ' + err.message, 500, 'PROCESSING_ERROR');
    }

    res.json({
      success: true,
      data: {
        jobId: job._id,
        status: job.status,
        outputFileSize: job.outputFileSize,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function download(req, res, next) {
  try {
    const { jobId } = req.params;

    const job = await ProcessingJob.findOne({
      _id: jobId,
      userId: req.user._id,
    });

    if (!job) throw new NotFoundError('Job not found');
    if (job.status !== 'completed') {
      throw new AppError('Job is not completed yet', 400, 'JOB_NOT_READY');
    }
    if (!job.outputPath || !fs.existsSync(job.outputPath)) {
      throw new NotFoundError('Output file not found');
    }

    const ext = path.extname(job.outputPath).replace('.', '');
    const mimeTypes = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      flac: 'audio/flac',
      ogg: 'audio/ogg',
      aac: 'audio/aac',
      m4a: 'audio/mp4',
      wma: 'audio/x-ms-wma',
    };

    const originalFile = job.input?.fileId
      ? await AudioFile.findById(job.input.fileId)
      : null;
    const baseName = originalFile
      ? path.parse(originalFile.originalName).name
      : 'output';

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', contentDisposition(`${baseName}.${ext}`));

    const stream = fs.createReadStream(job.outputPath);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

export async function extract(req, res, next) {
  try {
    const { fileId, outputFormat = 'mp3', bitrate } = req.body;

    if (!fileId) {
      throw new AppError('fileId is required', 400, 'VALIDATION_ERROR');
    }

    const audioFile = await AudioFile.findOne({
      _id: fileId,
      userId: req.user._id,
    });
    if (!audioFile) throw new NotFoundError('File not found');

    const userDir = path.join(DIRS.converted, req.user._id.toString());
    fs.mkdirSync(userDir, { recursive: true });

    const job = await ProcessingJob.create({
      userId: req.user._id,
      type: 'convert',
      input: { fileId: audioFile._id, targetFormat: outputFormat, bitrate },
    });

    const outputPath = path.join(userDir, `${job._id}.${outputFormat}`);

    job.status = 'processing';
    job.startedAt = new Date();
    await job.save();

    try {
      await extractAudio(audioFile.storagePath, outputPath, { bitrate });

      const metadata = await probeFile(outputPath).catch(() => ({}));
      const stat = fs.statSync(outputPath);

      // Create new AudioFile for the extracted audio
      const newAudio = await AudioFile.create({
        userId: req.user._id,
        originalName: path.parse(audioFile.originalName).name + `.${outputFormat}`,
        storagePath: outputPath,
        format: outputFormat,
        duration: metadata.duration || 0,
        sampleRate: metadata.sampleRate || 0,
        channels: metadata.channels || 0,
        fileSize: stat.size,
        source: 'video-extract',
      });

      job.status = 'completed';
      job.outputPath = outputPath;
      job.outputFileSize = stat.size;
      job.completedAt = new Date();
      job.processingTime = Date.now() - job.startedAt.getTime();
      job.progress = 100;
      await job.save();

      res.json({
        success: true,
        data: {
          jobId: job._id,
          audioFile: {
            id: newAudio._id,
            originalName: newAudio.originalName,
            format: newAudio.format,
            duration: newAudio.duration,
            fileSize: newAudio.fileSize,
          },
        },
      });
    } catch (err) {
      job.status = 'failed';
      job.error = err.message;
      await job.save();
      throw new AppError('Extraction failed: ' + err.message, 500, 'PROCESSING_ERROR');
    }
  } catch (err) {
    next(err);
  }
}

export async function fromUrl(req, res, next) {
  try {
    const { url, outputFormat = 'mp3' } = req.body;

    if (!url) {
      throw new AppError('url is required', 400, 'VALIDATION_ERROR');
    }

    const userDir = path.join(DIRS.uploads, req.user._id.toString());
    fs.mkdirSync(userDir, { recursive: true });

    // Get video info first
    let info = { title: 'Unknown', duration: 0 };
    try {
      info = await getVideoInfo(url);
    } catch {
      // Continue without info
    }

    // Download audio
    const result = await downloadAudio(url, userDir, outputFormat);

    const metadata = await probeFile(result.path).catch(() => ({}));
    const stat = fs.statSync(result.path);

    const audioFile = await AudioFile.create({
      userId: req.user._id,
      originalName: `${info.title}.${outputFormat}`,
      storagePath: result.path,
      format: outputFormat,
      duration: metadata.duration || info.duration || 0,
      sampleRate: metadata.sampleRate || 0,
      channels: metadata.channels || 0,
      fileSize: stat.size,
      source: 'youtube',
      sourceUrl: url,
      metadata: { title: info.title },
    });

    res.json({
      success: true,
      data: {
        id: audioFile._id,
        originalName: audioFile.originalName,
        format: audioFile.format,
        duration: audioFile.duration,
        fileSize: audioFile.fileSize,
        sourceUrl: url,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function cut(req, res, next) {
  try {
    const { fileId, startTime, endTime, fadeInDuration = 0, fadeOutDuration = 0, outputFormat } = req.body;

    if (!fileId || startTime == null || endTime == null) {
      throw new AppError('fileId, startTime, and endTime are required', 400, 'VALIDATION_ERROR');
    }
    if (startTime >= endTime) {
      throw new AppError('startTime must be less than endTime', 400, 'VALIDATION_ERROR');
    }

    const audioFile = await AudioFile.findOne({ _id: fileId, userId: req.user._id });
    if (!audioFile) throw new NotFoundError('Audio file not found');

    const format = outputFormat || audioFile.format;
    const userDir = path.join(DIRS.cut, req.user._id.toString());
    fs.mkdirSync(userDir, { recursive: true });

    const job = await ProcessingJob.create({
      userId: req.user._id,
      type: 'cut',
      input: { fileId: audioFile._id, startTime, endTime, fadeInDuration, fadeOutDuration, outputFormat: format },
    });

    const outputPath = path.join(userDir, `${job._id}.${format}`);
    job.status = 'processing';
    job.startedAt = new Date();
    await job.save();

    try {
      await cutAudio(audioFile.storagePath, outputPath, { startTime, endTime, fadeInDuration, fadeOutDuration });
      const stat = fs.statSync(outputPath);
      job.status = 'completed';
      job.outputPath = outputPath;
      job.outputFileSize = stat.size;
      job.completedAt = new Date();
      job.processingTime = Date.now() - job.startedAt.getTime();
      job.progress = 100;
      await job.save();
    } catch (cutErr) {
      job.status = 'failed';
      job.error = cutErr.message;
      await job.save();
      throw new AppError('Cut failed: ' + cutErr.message, 500, 'PROCESSING_ERROR');
    }

    res.json({
      success: true,
      data: { jobId: job._id, status: job.status, outputFileSize: job.outputFileSize },
    });
  } catch (err) {
    next(err);
  }
}

export async function separate(req, res, next) {
  try {
    const { fileId, model = 'htdemucs' } = req.body;

    if (!fileId) {
      throw new AppError('fileId is required', 400, 'VALIDATION_ERROR');
    }

    const models = getModels();
    if (!models[model]) {
      throw new AppError(`Unknown model: ${model}. Available: ${Object.keys(models).join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    const audioFile = await AudioFile.findOne({ _id: fileId, userId: req.user._id });
    if (!audioFile) throw new NotFoundError('Audio file not found');

    // Create separation job
    const sepJob = await SeparationJob.create({
      userId: req.user._id,
      audioFileId: audioFile._id,
      model,
      status: 'queued',
    });

    const queue = getSeparationQueue();
    await queue.add('separate', {
      jobId: sepJob._id.toString(),
      audioFilePath: audioFile.storagePath,
      outputDir: path.join(DIRS.stems, req.user._id.toString(), sepJob._id.toString()),
      model,
      userId: req.user._id.toString(),
    });

    res.status(202).json({
      success: true,
      data: {
        jobId: sepJob._id,
        status: sepJob.status,
        model,
        expectedStems: models[model].stems,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Build Content-Disposition header with Unicode support (RFC 5987).
 * Uses filename* for UTF-8 names (Hindi, Chinese, etc.) and ASCII fallback.
 */
function contentDisposition(filename) {
  const ascii = filename.replace(/[^\x20-\x7E]/g, '_');
  const utf8 = encodeURIComponent(filename).replace(/'/g, '%27');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`;
}

export async function downloadFile(req, res, next) {
  try {
    const { fileId } = req.params;

    const audioFile = await AudioFile.findOne({
      _id: fileId,
      userId: req.user._id,
    });
    if (!audioFile) throw new NotFoundError('Audio file not found');
    if (!fs.existsSync(audioFile.storagePath)) {
      throw new NotFoundError('File not found on disk');
    }

    const ext = audioFile.format || path.extname(audioFile.storagePath).replace('.', '');
    const mimeTypes = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      flac: 'audio/flac',
      ogg: 'audio/ogg',
      aac: 'audio/aac',
      m4a: 'audio/mp4',
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', contentDisposition(audioFile.originalName));
    fs.createReadStream(audioFile.storagePath).pipe(res);
  } catch (err) {
    next(err);
  }
}

export async function downloadStem(req, res, next) {
  try {
    const { jobId, stemName } = req.params;
    const format = req.query.format || 'wav'; // ?format=mp3|flac|wav

    const sepJob = await SeparationJob.findOne({
      _id: jobId,
      userId: req.user._id,
    });

    if (!sepJob) throw new NotFoundError('Separation job not found');
    if (sepJob.status !== 'completed') {
      throw new AppError('Separation is not completed yet', 400, 'JOB_NOT_READY');
    }

    const stem = sepJob.stems.find((s) => s.name === stemName);
    if (!stem) throw new NotFoundError(`Stem "${stemName}" not found`);

    if (!fs.existsSync(stem.storagePath)) {
      throw new NotFoundError('Stem file not found on disk');
    }

    const audioFile = await AudioFile.findById(sepJob.audioFileId);
    const baseName = audioFile ? path.parse(audioFile.originalName).name : 'audio';
    const downloadName = `${baseName}_${stemName}`;

    // If requesting non-WAV format, convert via FFmpeg on the fly
    if (format !== 'wav' && ['mp3', 'flac'].includes(format)) {
      const mimeTypes = { mp3: 'audio/mpeg', flac: 'audio/flac' };
      res.setHeader('Content-Type', mimeTypes[format]);
      res.setHeader('Content-Disposition', contentDisposition(`${downloadName}.${format}`));

      try {
        const converted = await convertAudio(stem.storagePath, null, {
          format,
          bitrate: format === 'mp3' ? '192k' : undefined,
        });
        if (typeof converted === 'string') {
          const s = fs.createReadStream(converted);
          s.pipe(res);
          s.on('end', () => { try { fs.unlinkSync(converted); } catch {} });
        } else {
          fs.createReadStream(stem.storagePath).pipe(res);
        }
      } catch {
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Disposition', contentDisposition(`${downloadName}.wav`));
        fs.createReadStream(stem.storagePath).pipe(res);
      }
      return;
    }

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', contentDisposition(`${downloadName}.wav`));
    fs.createReadStream(stem.storagePath).pipe(res);
  } catch (err) {
    next(err);
  }
}
