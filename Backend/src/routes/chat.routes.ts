import { Router } from 'express';
import { sendMessage, getConversations, getMessageHistory } from '../controllers/chatController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

// All routes protected
router.post('/', authenticateJWT as any, sendMessage as any);
router.get('/conversations', authenticateJWT as any, getConversations as any);
router.get('/history/:partnerId', authenticateJWT as any, getMessageHistory as any);

export default router;
