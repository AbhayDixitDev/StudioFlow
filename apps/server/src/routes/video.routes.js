import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import {
  createProject,
  updateProject,
  getProjects,
  getProject,
  deleteProject,
  startExport,
  downloadExport,
} from '../controllers/video.controller.js';

const router = Router();

router.post('/projects', auth, createProject);
router.put('/projects/:id', auth, updateProject);
router.get('/projects', auth, getProjects);
router.get('/projects/:id', auth, getProject);
router.delete('/projects/:id', auth, deleteProject);
router.post('/export', auth, startExport);
router.get('/export/:jobId/download', auth, downloadExport);

export default router;
