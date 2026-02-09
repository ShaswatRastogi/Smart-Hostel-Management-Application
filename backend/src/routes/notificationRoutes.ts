import { Router } from 'express';
import { clearAdminNotifications, clearStudentNotifications, getAdminNotifications, getStudentNotifications } from '../controllers/notificationController';
import { requireAdmin, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/admin', requireAuth, requireAdmin, getAdminNotifications);
router.post('/admin/clear', requireAuth, requireAdmin, clearAdminNotifications);

router.get('/student', requireAuth, getStudentNotifications);
router.post('/student/clear', requireAuth, clearStudentNotifications);

export default router;
