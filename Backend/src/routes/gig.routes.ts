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
import { authenticateJWT, requireVerified } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getGigs as any);
router.get('/:id', getGigById as any);

// Protected routes
router.post('/', authenticateJWT as any, requireVerified as any, createGig as any);
router.put('/:id', authenticateJWT as any, requireVerified as any, updateGig as any);
router.delete('/:id', authenticateJWT as any, requireVerified as any, deleteGig as any);
router.post('/:id/accept', authenticateJWT as any, requireVerified as any, acceptGig as any);
router.post('/:id/complete', authenticateJWT as any, requireVerified as any, completeGig as any);
router.post('/:id/cancel', authenticateJWT as any, requireVerified as any, cancelGig as any);

export default router;
