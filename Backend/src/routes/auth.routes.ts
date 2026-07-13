import { Router } from 'express';
import { signup, login, refreshToken, changePassword, toggleLeaderboardOptIn } from '../controllers/authController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/change-password', authenticateJWT as any, changePassword as any);
router.patch('/opt-in', authenticateJWT as any, toggleLeaderboardOptIn as any);

export default router;
