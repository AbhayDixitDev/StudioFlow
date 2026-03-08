import mongoose from 'mongoose';

const stemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    storagePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    format: { type: String, default: 'wav' },
  },
  { _id: false }
);

const separationJobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    audioFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AudioFile',
      required: true,
    },
    model: {
      type: String,
      enum: ['htdemucs', 'htdemucs_6s', 'mdx_extra'],
      required: true,
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    stems: [stemSchema],
    error: String,
    processingTime: Number,
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

separationJobSchema.index({ userId: 1 });
separationJobSchema.index({ status: 1 });
separationJobSchema.index({ audioFileId: 1 });

separationJobSchema.virtual('isComplete').get(function () {
  return this.status === 'completed';
});

export const SeparationJob = mongoose.model('SeparationJob', separationJobSchema);
