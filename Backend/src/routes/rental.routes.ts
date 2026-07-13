import { Router } from 'express';
import {
  createRental,
  getRentals,
  getRentalById,
  updateRental,
  deleteRental,
  rentItem,
  returnItem
} from '../controllers/rentalController';
import { authenticateJWT, requireVerified } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getRentals as any);
router.get('/:id', getRentalById as any);

// Protected routes
router.post('/', authenticateJWT as any, requireVerified as any, createRental as any);
router.put('/:id', authenticateJWT as any, requireVerified as any, updateRental as any);
router.delete('/:id', authenticateJWT as any, requireVerified as any, deleteRental as any);
router.post('/:id/rent', authenticateJWT as any, requireVerified as any, rentItem as any);
router.post('/return', authenticateJWT as any, requireVerified as any, returnItem as any);

export default router;
