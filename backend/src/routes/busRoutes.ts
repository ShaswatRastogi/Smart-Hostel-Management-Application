import { Router } from 'express';
import { createBusTiming, deleteBusTiming, getAllBusTimings, updateBusTiming } from '../controllers/busController';
import { requireStaffOrHigher, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getAllBusTimings);
router.post('/', requireAuth, requireStaffOrHigher, createBusTiming);
router.put('/:id', requireAuth, requireStaffOrHigher, updateBusTiming);
router.delete('/:id', requireAuth, requireStaffOrHigher, deleteBusTiming);

export default router;
