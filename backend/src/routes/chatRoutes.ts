import { Router } from 'express';
import { getConversations, getMessages, sendMessage } from '../controllers/chatController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getConversations); // List all (for Admin)
router.get('/:id/messages', requireAuth, getMessages);
router.post('/:id/messages', requireAuth, sendMessage);

export default router;
