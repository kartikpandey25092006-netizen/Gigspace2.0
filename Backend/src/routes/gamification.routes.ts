import { Router } from 'express';
import { getLeaderboard } from '../controllers/gamificationController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.get('/leaderboard', authenticateJWT as any, getLeaderboard as any);

export default router;
