import { Router } from 'express';
import {
  getMyTransactions,
  getTransactionById,
  simulateCheckoutPayment
} from '../controllers/transactionController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

// All routes are protected
router.get('/', authenticateJWT as any, getMyTransactions as any);
router.get('/:id', authenticateJWT as any, getTransactionById as any);
router.post('/:id/pay', authenticateJWT as any, simulateCheckoutPayment as any);

export default router;
