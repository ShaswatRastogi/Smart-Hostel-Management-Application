import { Router } from 'express';
import { clearAdminNotifications, clearStudentNotifications, getAdminNotifications, getPreferences, getStudentNotifications, updatePreferences } from '../controllers/notificationController';
import { requireStaffOrHigher, requireAuth } from '../middleware/auth';

const router = Router();

import { cacheMiddleware } from '../middleware/cache';

router.get('/admin', requireAuth, requireStaffOrHigher, getAdminNotifications);
router.post('/admin/clear', requireAuth, requireStaffOrHigher, clearAdminNotifications);

// Cache student notifications for 30 seconds to prevent hammering the DB
router.get('/student', requireAuth, cacheMiddleware(30), getStudentNotifications);
router.post('/student/clear', requireAuth, clearStudentNotifications);

router.get('/preferences', requireAuth, getPreferences);
router.post('/preferences', requireAuth, updatePreferences);

export default router;
