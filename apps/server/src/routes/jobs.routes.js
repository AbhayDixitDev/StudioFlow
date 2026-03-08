import { Router } from 'express';
import { getJobStatus, getUserJobs } from '../controllers/jobs.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, getUserJobs);
router.get('/:id', auth, getJobStatus);

export default router;
