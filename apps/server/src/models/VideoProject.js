import mongoose from 'mongoose';

const clipSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['video', 'audio', 'image', 'text'], required: true },
    name: String,
    startTime: { type: Number, default: 0 },
    duration: { type: Number, default: 5 },
    sourceDuration: Number,
    sourcePath: String,
    volume: { type: Number, default: 1 },
    opacity: { type: Number, default: 1 },
    fadeIn: { type: Number, default: 0 },
    fadeOut: { type: Number, default: 0 },
    loop: { type: Boolean, default: false },
    transform: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      scale: { type: Number, default: 1 },
      rotation: { type: Number, default: 0 },
    },
    effects: { type: mongoose.Schema.Types.Mixed, default: [] },
    transition: {
      type: { type: String },
      duration: Number,
    },
    text: {
      content: String,
      fontFamily: String,
      fontSize: Number,
      fontWeight: String,
      color: String,
      align: String,
      bgColor: String,
      hasBg: Boolean,
      bgOpacity: Number,
      stroke: Boolean,
      strokeColor: String,
      strokeWidth: Number,
      shadow: Boolean,
      shadowColor: String,
      shadowBlur: Number,
      shadowOffsetX: Number,
      shadowOffsetY: Number,
      letterSpacing: Number,
      lineHeight: Number,
      animation: String,
      animationDuration: Number,
    },
  },
  { _id: true }
);

const trackSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['video', 'audio', 'image', 'text'], required: true },
    name: String,
    locked: { type: Boolean, default: false },
    visible: { type: Boolean, default: true },
    muted: { type: Boolean, default: false },
    solo: { type: Boolean, default: false },
    clips: [clipSchema],
  },
  { _id: true }
);

const videoProjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: { type: String, required: true, default: 'Untitled Project' },
    thumbnail: String,
    projectSettings: {
      width: { type: Number, default: 1920 },
      height: { type: Number, default: 1080 },
      fps: { type: Number, default: 30 },
      aspectRatio: { type: String, default: '16:9' },
    },
    duration: { type: Number, default: 0 },
    tracks: [trackSchema],
    mediaFiles: [
      {
        name: String,
        type: { type: String },
        url: String,
        size: Number,
        duration: Number,
      },
    ],
  },
  { timestamps: true }
);

videoProjectSchema.index({ userId: 1 });
videoProjectSchema.index({ userId: 1, updatedAt: -1 });

export const VideoProject = mongoose.model('VideoProject', videoProjectSchema);
