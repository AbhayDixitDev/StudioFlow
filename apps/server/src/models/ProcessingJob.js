import mongoose from 'mongoose';

const processingJobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['convert', 'cut', 'video-export'],
      required: true,
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    input: {
      fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'AudioFile' },
      projectId: { type: mongoose.Schema.Types.ObjectId },
      targetFormat: String,
      bitrate: String,
      sampleRate: Number,
      startTime: Number,
      endTime: Number,
      fadeInDuration: Number,
      fadeOutDuration: Number,
      outputFormat: String,
      resolution: {
        width: Number,
        height: Number,
      },
      fps: Number,
      videoFormat: String,
      quality: { type: String, enum: ['low', 'medium', 'high', 'ultra'] },
    },
    outputPath: String,
    outputFileSize: Number,
    error: String,
    processingTime: Number,
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

processingJobSchema.index({ userId: 1, type: 1 });
processingJobSchema.index({ status: 1 });
processingJobSchema.index({ userId: 1, createdAt: -1 });

export const ProcessingJob = mongoose.model('ProcessingJob', processingJobSchema);
