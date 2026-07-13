import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

import { calculateReputationScore } from '../services/gamificationService';

export const getLeaderboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const topUsers = await User.find({ role: 'student', leaderboardOptIn: true })
      .select('name college xp streak badges ratingAvg')
      .lean();

    const usersWithScore = topUsers.map(user => ({
      ...user,
      reputationScore: calculateReputationScore(user.ratingAvg || 0, user.badges?.length || 0, user.streak || 0)
    }));

    usersWithScore.sort((a, b) => b.reputationScore - a.reputationScore);
    
    const paginatedUsers = usersWithScore.slice(skip, skip + limit);

    res.status(200).json({
      users: paginatedUsers,
      total: usersWithScore.length,
      page,
      limit
    });
  } catch (error) {
    next(error);
  }
};
