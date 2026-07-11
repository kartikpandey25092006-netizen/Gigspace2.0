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
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getRentals as any);
router.get('/:id', getRentalById as any);

// Protected routes
router.post('/', authenticateJWT as any, createRental as any);
router.put('/:id', authenticateJWT as any, updateRental as any);
router.delete('/:id', authenticateJWT as any, deleteRental as any);
router.post('/:id/rent', authenticateJWT as any, rentItem as any);
router.post('/return', authenticateJWT as any, returnItem as any);

export default router;
