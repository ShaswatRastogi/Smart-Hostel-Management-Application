
import express from 'express';
import { getAttendanceStats, getDailyAttendance, getStudentHistory, markAttendance } from '../controllers/attendanceController';

import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.use(requireAuth); // Protect all routes

router.post('/mark', markAttendance);
router.get('/daily', getDailyAttendance);
router.get('/stats', getAttendanceStats);
router.get('/student/:id', getStudentHistory);

export default router;
