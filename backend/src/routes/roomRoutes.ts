import { Router } from 'express';
import { deleteRoom, getAllRooms } from '../controllers/roomController';
import { requireStaffOrHigher, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/all', requireAuth, requireStaffOrHigher, getAllRooms);
router.delete('/:id', requireAuth, requireStaffOrHigher, deleteRoom);

export default router;
