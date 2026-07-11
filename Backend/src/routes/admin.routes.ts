import { Router } from 'express';
import {
  getDashboardMetrics,
  moderateUser,
  moderateGig,
  moderateRental
} from '../controllers/adminController';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// All routes protected and restricted to 'admin' role
router.get('/metrics', authenticateJWT as any, authorizeRoles('admin') as any, getDashboardMetrics as any);
router.delete('/user/:userId', authenticateJWT as any, authorizeRoles('admin') as any, moderateUser as any);
router.post('/gig/:gigId', authenticateJWT as any, authorizeRoles('admin') as any, moderateGig as any);
router.post('/rental/:rentalId', authenticateJWT as any, authorizeRoles('admin') as any, moderateRental as any);

export default router;
