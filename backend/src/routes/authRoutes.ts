import { Router } from 'express';
import { changePassword, getCurrentUser, googleLogin, login } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', requireAuth, getCurrentUser);
router.post('/change-password', requireAuth, changePassword);

export default router;
