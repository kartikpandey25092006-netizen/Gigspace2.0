import { Response, NextFunction } from 'express';
import { Rating } from '../models/Rating';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { ApiError } from '../middlewares/errorMiddleware';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { createNotification } from '../services/notificationService';
import { awardXP, XP_REWARDS, checkAndAwardBadges } from '../services/gamificationService';

export const createRating = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { transactionId, stars, comment } = req.body;
    const raterId = req.user?.id;

    if (!transactionId || !stars) {
      return next(new ApiError(400, 'Transaction ID and stars are required'));
    }

    if (stars < 1 || stars > 5) {
      return next(new ApiError(400, 'Stars rating must be between 1 and 5'));
    }

    // 1. Verify transaction exists and is completed
    const tx = await Transaction.findById(transactionId);
    if (!tx) {
      return next(new ApiError(404, 'Transaction not found'));
    }

    if (tx.status !== 'completed') {
      return next(new ApiError(400, 'Cannot rate a user for an uncompleted transaction'));
    }

    // 2. Verify rater is part of the transaction
    const isBuyer = tx.buyerId.toString() === raterId;
    const isSeller = tx.sellerId.toString() === raterId;

    if (!isBuyer && !isSeller) {
      return next(new ApiError(403, 'You are not authorized to rate this transaction'));
    }

    // Determine who is being rated
    const rateeId = isBuyer ? tx.sellerId.toString() : tx.buyerId.toString();

    // 3. Prevent duplicate rating for same transaction by same rater
    const existingRating = await Rating.findOne({ transactionId, raterId });
    if (existingRating) {
      return next(new ApiError(400, 'You have already rated this transaction'));
    }

    // 4. Create the rating
    const ratingObj = await Rating.create({
      transactionId,
      raterId,
      rateeId,
      stars,
      comment
    });

    // 5. Update the ratee's rating metrics
    const ratings = await Rating.find({ rateeId });
    const count = ratings.length;
    const sum = ratings.reduce((acc, curr) => acc + curr.stars, 0);
    const avg = Number((sum / count).toFixed(2));

    await User.findByIdAndUpdate(rateeId, {
      ratingAvg: avg,
      ratingCount: count
    });

    // 6. Send notification to the ratee
    const rater = await User.findById(raterId);
    await createNotification(
      rateeId,
      'new_rating',
      'New Rating & Review',
      `You received a ${stars}-star rating from ${rater?.name || 'a peer'}!`,
      ratingObj._id.toString(),
      'transaction'
    );

    res.status(201).json(ratingObj);

    // Gamification
    if (stars === 5) {
      await awardXP(rateeId, XP_REWARDS.RECEIVE_5_STAR, 'Received a 5-star rating');
    } else if (stars === 4) {
      await awardXP(rateeId, XP_REWARDS.RECEIVE_4_STAR, 'Received a 4-star rating');
    }
    await checkAndAwardBadges(rateeId);
  } catch (error) {
    next(error);
  }
};

export const getUserRatings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId;
    const ratings = await Rating.find({ rateeId: userId })
      .populate('raterId', 'name email college ratingAvg')
      .sort({ createdAt: -1 });

    res.status(200).json(ratings);
  } catch (error) {
    next(error);
  }
};
