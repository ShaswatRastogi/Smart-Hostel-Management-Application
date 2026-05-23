import express from 'express';
import { getGuardStats, clockStudent, verifyLeaveQR, searchStudents } from '../controllers/guardController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();

// Middleware to ensure user is a guard or owner
// Some endpoints like search could be used by warden too, but for now we scope to guard/owner
const guardAuth = [requireAuth, requireRole(['guard', 'owner'])];

router.get('/stats', guardAuth, getGuardStats);
router.get('/students', guardAuth, searchStudents);
router.post('/clock', guardAuth, clockStudent);
router.get('/verify-leave/:qrCode', guardAuth, verifyLeaveQR);

export default router;
