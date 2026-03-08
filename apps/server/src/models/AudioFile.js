import mongoose from 'mongoose';

const audioFileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalName: { type: String, required: true },
    storagePath: { type: String, required: true },
    format: { type: String, required: true },
    duration: { type: Number, required: true },
    sampleRate: { type: Number, required: true },
    channels: { type: Number, required: true },
    fileSize: { type: Number, required: true },
    bitrate: Number,
    source: {
      type: String,
      enum: ['upload', 'youtube', 'video-extract'],
      default: 'upload',
    },
    sourceUrl: String,
    waveformData: [Number],
    metadata: {
      title: String,
      artist: String,
      album: String,
    },
  },
  { timestamps: true }
);

audioFileSchema.index({ userId: 1, createdAt: -1 });

export const AudioFile = mongoose.model('AudioFile', audioFileSchema);
