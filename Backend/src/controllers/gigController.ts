import { Response, NextFunction } from 'express';
import { Gig } from '../models/Gig';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { ApiError } from '../middlewares/errorMiddleware';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { createNotification } from '../services/notificationService';
import { awardXP, XP_REWARDS, checkAndAwardBadges } from '../services/gamificationService';

export const createGig = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, price, category } = req.body;
    const posterId = req.user?.id;

    if (!title || !description || !price || !category) {
      return next(new ApiError(400, 'Title, description, price, and category are required'));
    }

    const newGig = await Gig.create({
      posterId,
      title,
      description,
      price,
      category,
      status: 'open'
    });

    res.status(201).json(newGig);

    // Gamification
    if (posterId) {
      await awardXP(posterId, XP_REWARDS.POST_GIG, 'Posted a new gig');
      await checkAndAwardBadges(posterId);
    }
  } catch (error) {
    next(error);
  }
};

export const getGigs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { search, category, status, minPrice, maxPrice } = req.query;
    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    } else {
      query.status = 'open'; // Default to active/open ones
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const gigs = await Gig.find(query)
      .populate('posterId', 'name email college ratingAvg')
      .populate('acceptedById', 'name email college ratingAvg')
      .sort({ createdAt: -1 });

    res.status(200).json(gigs);
  } catch (error) {
    next(error);
  }
};

export const getGigById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('posterId', 'name email college ratingAvg')
      .populate('acceptedById', 'name email college ratingAvg');

    if (!gig) {
      return next(new ApiError(404, 'Gig not found'));
    }

    res.status(200).json(gig);
  } catch (error) {
    next(error);
  }
};

export const updateGig = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, price, category } = req.body;
    const gigId = req.params.id;
    const userId = req.user?.id;

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return next(new ApiError(404, 'Gig not found'));
    }

    if (gig.posterId.toString() !== userId) {
      return next(new ApiError(403, 'Not authorized to modify this gig'));
    }

    if (gig.status !== 'open') {
      return next(new ApiError(400, 'Cannot edit a gig that has been accepted or completed'));
    }

    gig.title = title || gig.title;
    gig.description = description || gig.description;
    gig.price = price !== undefined ? price : gig.price;
    gig.category = category || gig.category;

    await gig.save();
    res.status(200).json(gig);
  } catch (error) {
    next(error);
  }
};

export const deleteGig = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const gigId = req.params.id;
    const userId = req.user?.id;

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return next(new ApiError(404, 'Gig not found'));
    }

    if (gig.posterId.toString() !== userId) {
      return next(new ApiError(403, 'Not authorized to delete this gig'));
    }

    if (gig.status !== 'open') {
      return next(new ApiError(400, 'Cannot delete a gig that is already accepted or completed'));
    }

    await Gig.deleteOne({ _id: gigId });
    res.status(200).json({ message: 'Gig successfully deleted' });
  } catch (error) {
    next(error);
  }
};

export const acceptGig = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const gigId = req.params.id;
    const accepterId = req.user?.id;

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return next(new ApiError(404, 'Gig not found'));
    }

    if (gig.status !== 'open') {
      return next(new ApiError(400, 'Gig is already accepted or completed'));
    }

    if (gig.posterId.toString() === accepterId) {
      return next(new ApiError(400, 'You cannot accept your own posted gig'));
    }

    // Accept the gig
    gig.acceptedById = accepterId as any;
    gig.status = 'accepted';
    await gig.save();

    // Create a transaction holding funds in escrow
    const transaction = await Transaction.create({
      type: 'gig',
      gigId: gig._id,
      buyerId: gig.posterId, // The poster is paying (buyer of service)
      sellerId: accepterId,  // The accepter is getting paid (seller of service)
      amount: gig.price,
      status: 'held_in_escrow'
    });

    // Notify the poster
    const poster = await User.findById(gig.posterId);
    const accepter = await User.findById(accepterId);
    if (poster && accepter) {
      await createNotification(
        poster._id.toString(),
        'gig_accepted',
        'Gig Accepted',
        `${accepter.name} has accepted your gig "${gig.title}". Funds are held in escrow.`,
        gig._id.toString(),
        'gig'
      );
    }

    res.status(200).json({ gig, transaction });

    // Gamification
    if (accepterId) {
      await awardXP(accepterId, XP_REWARDS.ACCEPT_GIG, 'Accepted a gig');
      await checkAndAwardBadges(accepterId);
    }
  } catch (error) {
    next(error);
  }
};

export const completeGig = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const gigId = req.params.id;
    const userId = req.user?.id;

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return next(new ApiError(404, 'Gig not found'));
    }

    if (gig.status !== 'accepted') {
      return next(new ApiError(400, 'Gig must be accepted before it can be completed'));
    }

    // Only the poster (the person paying) can mark it complete to release funds
    if (gig.posterId.toString() !== userId) {
      return next(new ApiError(403, 'Only the gig poster can authorize completion and release funds'));
    }

    gig.status = 'completed';
    await gig.save();

    // Update transaction to complete
    const transaction = await Transaction.findOne({ gigId: gig._id, status: 'held_in_escrow' });
    if (transaction) {
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      await transaction.save();
    }

    // Notify the accepter
    const accepterId = gig.acceptedById?.toString();
    if (accepterId) {
      const poster = await User.findById(userId);
      await createNotification(
        accepterId,
        'gig_completed',
        'Gig Completed & Payment Released',
        `Your completed gig "${gig.title}" has been approved by ${poster?.name || 'the poster'}. Payment has been released!`,
        gig._id.toString(),
        'gig'
      );
    }

    res.status(200).json({ gig, transaction });

    // Gamification
    if (userId) {
      await awardXP(userId, XP_REWARDS.COMPLETE_GIG_POSTER, 'Completed a gig (Poster)');
      await checkAndAwardBadges(userId);
    }
    if (accepterId) {
      await awardXP(accepterId, XP_REWARDS.COMPLETE_GIG_WORKER, 'Completed a gig (Worker)');
      await checkAndAwardBadges(accepterId);
    }
  } catch (error) {
    next(error);
  }
};

export const cancelGig = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const gigId = req.params.id;
    const userId = req.user?.id;

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return next(new ApiError(404, 'Gig not found'));
    }

    if (gig.status !== 'accepted') {
      return next(new ApiError(400, 'Only accepted gigs can be cancelled'));
    }

    // Either poster or accepter can cancel, depending on agreement
    if (gig.posterId.toString() !== userId && gig.acceptedById?.toString() !== userId) {
      return next(new ApiError(403, 'Not authorized to cancel this gig'));
    }

    // Reset gig status back to open and remove accepter
    gig.status = 'open';
    gig.acceptedById = undefined;
    await gig.save();

    // Cancel the escrow transaction
    const transaction = await Transaction.findOne({ gigId: gig._id, status: 'held_in_escrow' });
    if (transaction) {
      transaction.status = 'cancelled';
      await transaction.save();
    }

    // Notify the opposite user
    const otherUser = gig.posterId.toString() === userId ? gig.acceptedById?.toString() : gig.posterId.toString();
    if (otherUser) {
      const actor = await User.findById(userId);
      await createNotification(
        otherUser,
        'system',
        'Gig Cancelled',
        `The gig "${gig.title}" has been cancelled by ${actor?.name || 'the partner'}. Transaction refunded.`,
        gig._id.toString(),
        'gig'
      );
    }

    res.status(200).json(gig);
  } catch (error) {
    next(error);
  }
};
