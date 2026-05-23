import { Router } from 'express';
import { createNotice, deleteNotice, getAllNotices } from '../controllers/noticeController';
import { requireStaffOrHigher, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getAllNotices);
// Admin only for creating/deleting
router.post('/', requireAuth, requireStaffOrHigher, createNotice);
router.delete('/:id', requireAuth, requireStaffOrHigher, deleteNotice);

export default router;
