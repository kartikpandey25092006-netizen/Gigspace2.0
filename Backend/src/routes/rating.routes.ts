import { Router } from 'express';
import { createRating, getUserRatings } from '../controllers/ratingController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.get('/user/:userId', getUserRatings as any);

// Protected routes
router.post('/', authenticateJWT as any, createRating as any);

export default router;
