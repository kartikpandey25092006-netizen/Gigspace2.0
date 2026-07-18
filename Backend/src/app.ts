import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import { errorHandler } from './middlewares/errorMiddleware';
import authRoutes from './routes/auth.routes';
import gigRoutes from './routes/gig.routes';
import rentalRoutes from './routes/rental.routes';
import transactionRoutes from './routes/transaction.routes';
import ratingRoutes from './routes/rating.routes';
import chatRoutes from './routes/chat.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import gamificationRoutes from './routes/gamification.routes';
import { Category } from './models/Category';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // Configure correctly in production for frontend access
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(passport.initialize());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Fetch Categories directly
app.get('/api/v1/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await Category.find({});
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/gigs', gigRoutes);
app.use('/api/v1/rentals', rentalRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/ratings', ratingRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/gamification', gamificationRoutes);

// Centralized error handling
app.use(errorHandler as any);

export default app;
