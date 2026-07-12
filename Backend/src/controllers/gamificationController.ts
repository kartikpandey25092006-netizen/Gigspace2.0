import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const getLeaderboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const topUsers = await User.find({ role: 'student' })
      .select('name college xp streak badges ratingAvg')
      .sort({ xp: -1 })
      .limit(limit);

    res.status(200).json(topUsers);
  } catch (error) {
    next(error);
  }
};
