import { Router } from 'express';
import { createNotice, deleteNotice, getAllNotices } from '../controllers/noticeController';
import { requireAdmin, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getAllNotices);
// Admin only for creating/deleting
router.post('/', requireAuth, requireAdmin, createNotice);
router.delete('/:id', requireAuth, requireAdmin, deleteNotice);

export default router;
