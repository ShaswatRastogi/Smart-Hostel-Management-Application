
import { Router } from 'express';
import { getMessStats, getMyAttendance, markAttendance } from '../controllers/messAttendanceController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Student Routes
router.post('/attendance', requireAuth, markAttendance);
router.get('/attendance/my', requireAuth, getMyAttendance);

// Admin Routes
router.get('/stats', requireAuth, getMessStats);

export default router;
