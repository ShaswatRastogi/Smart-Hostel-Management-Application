import express from 'express';
import { getHostelInfo, updateHostelInfo } from '../controllers/hostelController';

const router = express.Router();

router.get('/', getHostelInfo);
router.put('/', updateHostelInfo);

export default router;
