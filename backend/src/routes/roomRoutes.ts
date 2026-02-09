import { Router } from 'express';
import { deleteRoom, getAllRooms } from '../controllers/roomController';
import { requireAdmin, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/all', requireAuth, requireAdmin, getAllRooms);
router.delete('/:id', requireAuth, requireAdmin, deleteRoom);

export default router;
