import express from 'express';
import { getHostelInfo, updateHostelInfo } from '../controllers/hostelController';
import { cacheMiddleware } from '../middleware/cache';

const router = express.Router();

// Cache hostel info for 1 hour (3600 seconds) since it rarely changes
router.get('/', cacheMiddleware(3600), getHostelInfo);
router.put('/', updateHostelInfo);

export default router;
