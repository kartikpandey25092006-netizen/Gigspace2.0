import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Gig } from '../models/Gig';
import { Rental } from '../models/Rental';
import { Transaction } from '../models/Transaction';
import { ApiError } from '../middlewares/errorMiddleware';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const getDashboardMetrics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalGigs = await Gig.countDocuments({});
    const totalRentals = await Rental.countDocuments({});
    const totalTransactions = await Transaction.countDocuments({});

    const completedTx = await Transaction.find({ status: 'completed' });
    const totalVolume = completedTx.reduce((acc, curr) => acc + curr.amount, 0);

    // Get recent transactions
    const recentTransactions = await Transaction.find({})
      .populate('buyerId', 'name')
      .populate('sellerId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      metrics: {
        totalUsers,
        totalGigs,
        totalRentals,
        totalTransactions,
        totalVolume
      },
      recentTransactions
    });
  } catch (error) {
    next(error);
  }
};

export const moderateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    if (user.role === 'admin') {
      return next(new ApiError(400, 'Cannot moderate another administrator'));
    }

    await User.deleteOne({ _id: userId });
    res.status(200).json({ message: `User ${user.name} successfully deleted by Administrator` });
  } catch (error) {
    next(error);
  }
};

export const moderateGig = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const gigId = req.params.gigId;
    const { action } = req.body; // e.g. 'cancel' or 'delete'

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return next(new ApiError(404, 'Gig not found'));
    }

    if (action === 'cancel') {
      gig.status = 'cancelled';
      await gig.save();

      // Cancel associated active transaction if there is one
      await Transaction.updateMany(
        { gigId: gig._id, status: 'held_in_escrow' },
        { status: 'cancelled' }
      );

      res.status(200).json({ message: 'Gig successfully marked cancelled', gig });
    } else {
      await Gig.deleteOne({ _id: gigId });
      res.status(200).json({ message: 'Gig successfully deleted by Administrator' });
    }
  } catch (error) {
    next(error);
  }
};

export const moderateRental = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const rentalId = req.params.rentalId;
    const { action } = req.body; // e.g. 'maintenance' or 'delete'

    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return next(new ApiError(404, 'Rental item not found'));
    }

    if (action === 'maintenance') {
      rental.status = 'maintenance';
      await rental.save();
      res.status(200).json({ message: 'Rental item set to maintenance mode', rental });
    } else {
      await Rental.deleteOne({ _id: rentalId });
      res.status(200).json({ message: 'Rental item successfully deleted by Administrator' });
    }
  } catch (error) {
    next(error);
  }
};
