import { Router } from 'express';
import { upload, convert, download, extract, fromUrl, cut, separate, downloadStem, downloadFile } from '../controllers/audio.controller.js';
import { auth } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';
import { downloadLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/upload', auth, uploadSingle, upload);
router.post('/convert', auth, convert);
router.post('/extract', auth, extract);
router.post('/from-url', auth, fromUrl);
router.post('/cut', auth, cut);
router.post('/separate', auth, separate);
router.get('/download/:jobId', auth, downloadLimiter, download);
router.get('/files/:fileId/download', auth, downloadLimiter, downloadFile);
router.get('/stems/:jobId/:stemName', auth, downloadLimiter, downloadStem);

export default router;
