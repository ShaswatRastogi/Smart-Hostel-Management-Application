import { Router } from 'express';
import { clearAdminNotifications, clearStudentNotifications, getAdminNotifications, getPreferences, getStudentNotifications, updatePreferences } from '../controllers/notificationController';
import { requireStaffOrHigher, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/admin', requireAuth, requireStaffOrHigher, getAdminNotifications);
router.post('/admin/clear', requireAuth, requireStaffOrHigher, clearAdminNotifications);

router.get('/student', requireAuth, getStudentNotifications);
router.post('/student/clear', requireAuth, clearStudentNotifications);

router.get('/preferences', requireAuth, getPreferences);
router.post('/preferences', requireAuth, updatePreferences);

export default router;
