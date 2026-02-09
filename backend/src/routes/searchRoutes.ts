import { Router } from 'express';
import { globalSearch } from '../controllers/searchController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, globalSearch);

export default router;
