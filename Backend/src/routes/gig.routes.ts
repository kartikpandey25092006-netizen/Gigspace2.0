import { Router } from 'express';
import {
  createGig,
  getGigs,
  getGigById,
  updateGig,
  deleteGig,
  acceptGig,
  completeGig,
  cancelGig
} from '../controllers/gigController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getGigs as any);
router.get('/:id', getGigById as any);

// Protected routes
router.post('/', authenticateJWT as any, createGig as any);
router.put('/:id', authenticateJWT as any, updateGig as any);
router.delete('/:id', authenticateJWT as any, deleteGig as any);
router.post('/:id/accept', authenticateJWT as any, acceptGig as any);
router.post('/:id/complete', authenticateJWT as any, completeGig as any);
router.post('/:id/cancel', authenticateJWT as any, cancelGig as any);

export default router;
