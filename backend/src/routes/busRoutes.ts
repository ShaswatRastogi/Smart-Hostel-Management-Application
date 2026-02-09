import { Router } from 'express';
import { createBusTiming, deleteBusTiming, getAllBusTimings, updateBusTiming } from '../controllers/busController';
import { requireAdmin, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getAllBusTimings);
router.post('/', requireAuth, requireAdmin, createBusTiming);
router.put('/:id', requireAuth, requireAdmin, updateBusTiming);
router.delete('/:id', requireAuth, requireAdmin, deleteBusTiming);

export default router;
