import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { getUploadPath } from '../config/storage.js';
import { env } from '../config/env.js';

const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/ogg',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/webm',
  'audio/x-ms-wma',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
];

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const userId = req.user._id.toString();
    const uploadDir = getUploadPath(userId);
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const uuid = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${uuid}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
}

const uploadConfig = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_FILE_SIZE },
});

export const uploadSingle = uploadConfig.single('file');
export const uploadArray = uploadConfig.array('files', 10);
