import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[\w.-]+@[\w.-]+\.\w{2,}$/,
    },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, maxlength: 50 },
    avatar: String,
    preferences: {
      theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
      defaultOutputFormat: { type: String, default: 'mp3' },
      defaultSeparationModel: { type: String, default: 'htdemucs' },
      autoSave: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
