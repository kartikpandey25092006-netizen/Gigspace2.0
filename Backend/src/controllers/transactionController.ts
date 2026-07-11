import { Response, NextFunction } from 'express';
import { Transaction } from '../models/Transaction';
import { ApiError } from '../middlewares/errorMiddleware';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const getMyTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    // Retrieve all transactions where the user is either the buyer or the seller
    const transactions = await Transaction.find({
      $or: [{ buyerId: userId }, { sellerId: userId }]
    })
      .populate('buyerId', 'name email college')
      .populate('sellerId', 'name email college')
      .populate('gigId', 'title category price')
      .populate('rentalId', 'title category pricePerDay')
      .sort({ createdAt: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const txId = req.params.id;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const tx = await Transaction.findById(txId)
      .populate('buyerId', 'name email college')
      .populate('sellerId', 'name email college')
      .populate('gigId', 'title category price')
      .populate('rentalId', 'title category pricePerDay');

    if (!tx) {
      return next(new ApiError(404, 'Transaction not found'));
    }

    // Auth check: buyer, seller, or admin
    if (
      tx.buyerId._id.toString() !== userId &&
      tx.sellerId._id.toString() !== userId &&
      userRole !== 'admin'
    ) {
      return next(new ApiError(403, 'Not authorized to view this transaction'));
    }

    res.status(200).json(tx);
  } catch (error) {
    next(error);
  }
};

export const simulateCheckoutPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const txId = req.params.id;
    const userId = req.user?.id;

    const tx = await Transaction.findById(txId);
    if (!tx) {
      return next(new ApiError(404, 'Transaction not found'));
    }

    if (tx.buyerId.toString() !== userId) {
      return next(new ApiError(403, 'Only the buyer can perform checkout payment'));
    }

    if (tx.status !== 'pending') {
      return next(new ApiError(400, `Cannot checkout a transaction with status ${tx.status}`));
    }

    // Shift to escrow
    tx.status = 'held_in_escrow';
    await tx.save();

    res.status(200).json({
      message: 'Checkout payment simulated successfully. Funds locked in escrow.',
      transaction: tx
    });
  } catch (error) {
    next(error);
  }
};
