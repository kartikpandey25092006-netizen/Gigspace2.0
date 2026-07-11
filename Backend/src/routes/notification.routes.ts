import { Router } from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead
} from '../controllers/notificationController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

// All routes protected
router.get('/', authenticateJWT as any, getMyNotifications as any);
router.patch('/:id/read', authenticateJWT as any, markAsRead as any);
router.post('/read-all', authenticateJWT as any, markAllAsRead as any);

export default router;
