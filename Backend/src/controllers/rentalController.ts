import { Response, NextFunction } from 'express';
import { Rental } from '../models/Rental';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { ApiError } from '../middlewares/errorMiddleware';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { createNotification } from '../services/notificationService';

// Helper to get array of dates between start and end (inclusive) in YYYY-MM-DD format
const getDatesInRange = (startDate: Date, endDate: Date): string[] => {
  const dates: string[] = [];
  const curr = new Date(startDate);
  curr.setUTCHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setUTCHours(0, 0, 0, 0);

  while (curr <= end) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return dates;
};

export const createRental = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, pricePerDay, category } = req.body;
    const ownerId = req.user?.id;

    if (!title || !description || !pricePerDay || !category) {
      return next(new ApiError(400, 'Title, description, pricePerDay, and category are required'));
    }

    const newRental = await Rental.create({
      ownerId,
      title,
      description,
      pricePerDay,
      category,
      status: 'available',
      availabilityCalendar: []
    });

    res.status(201).json(newRental);
  } catch (error) {
    next(error);
  }
};

export const getRentals = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
      // Default return available items
      query.status = 'available';
    }

    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
    }

    const rentals = await Rental.find(query)
      .populate('ownerId', 'name email college ratingAvg')
      .sort({ createdAt: -1 });

    res.status(200).json(rentals);
  } catch (error) {
    next(error);
  }
};

export const getRentalById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('ownerId', 'name email college ratingAvg');

    if (!rental) {
      return next(new ApiError(404, 'Rental item not found'));
    }

    res.status(200).json(rental);
  } catch (error) {
    next(error);
  }
};

export const updateRental = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, pricePerDay, category, status } = req.body;
    const rentalId = req.params.id;
    const userId = req.user?.id;

    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return next(new ApiError(404, 'Rental item not found'));
    }

    if (rental.ownerId.toString() !== userId) {
      return next(new ApiError(403, 'Not authorized to modify this rental item'));
    }

    rental.title = title || rental.title;
    rental.description = description || rental.description;
    rental.pricePerDay = pricePerDay !== undefined ? pricePerDay : rental.pricePerDay;
    rental.category = category || rental.category;
    rental.status = status || rental.status;

    await rental.save();
    res.status(200).json(rental);
  } catch (error) {
    next(error);
  }
};

export const deleteRental = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const rentalId = req.params.id;
    const userId = req.user?.id;

    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return next(new ApiError(404, 'Rental item not found'));
    }

    if (rental.ownerId.toString() !== userId) {
      return next(new ApiError(403, 'Not authorized to delete this rental item'));
    }

    if (rental.status === 'rented') {
      return next(new ApiError(400, 'Cannot delete an item that is currently rented out'));
    }

    await Rental.deleteOne({ _id: rentalId });
    res.status(200).json({ message: 'Rental item successfully deleted' });
  } catch (error) {
    next(error);
  }
};

export const rentItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const rentalId = req.params.id;
    const renterId = req.user?.id;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return next(new ApiError(400, 'Start date and end date are required'));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return next(new ApiError(400, 'Start date must be before end date'));
    }

    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return next(new ApiError(404, 'Rental item not found'));
    }

    if (rental.status === 'maintenance') {
      return next(new ApiError(400, 'Item is currently under maintenance'));
    }

    if (rental.ownerId.toString() === renterId) {
      return next(new ApiError(400, 'You cannot rent your own item'));
    }

    // Check if dates are already booked
    const requestedDates = getDatesInRange(start, end);
    const hasConflict = requestedDates.some(date => rental.availabilityCalendar.includes(date));

    if (hasConflict) {
      return next(new ApiError(400, 'The item is already booked for some of the requested dates'));
    }

    // Book the item: add dates to calendar and mark status
    rental.availabilityCalendar.push(...requestedDates);
    rental.status = 'rented';
    await rental.save();

    // Calculate amount
    const daysCount = requestedDates.length;
    const amount = daysCount * rental.pricePerDay;

    // Create a transaction holding funds in escrow
    const transaction = await Transaction.create({
      type: 'rental',
      rentalId: rental._id,
      buyerId: renterId,    // The renter is paying (buyer of rental service)
      sellerId: rental.ownerId, // The owner is getting paid
      amount,
      status: 'held_in_escrow',
      rentalStartDate: start,
      rentalEndDate: end
    });

    // Notify owner
    const owner = await User.findById(rental.ownerId);
    const renter = await User.findById(renterId);
    if (owner && renter) {
      await createNotification(
        owner._id.toString(),
        'rental_booked',
        'Item Booked / Rented',
        `${renter.name} has rented your "${rental.title}" from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}. Payment is held in escrow.`,
        rental._id.toString(),
        'rental'
      );
    }

    res.status(200).json({ rental, transaction });
  } catch (error) {
    next(error);
  }
};

export const returnItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const transactionId = req.body.transactionId;
    const userId = req.user?.id;

    if (!transactionId) {
      return next(new ApiError(400, 'Transaction ID is required to return item'));
    }

    const transaction = await Transaction.findById(transactionId).populate('rentalId');
    if (!transaction) {
      return next(new ApiError(404, 'Transaction record not found'));
    }

    if (transaction.status !== 'held_in_escrow') {
      return next(new ApiError(400, 'Transaction is not active/in escrow'));
    }

    // Either the renter (buyer) or the owner (seller) can confirm return
    if (transaction.buyerId.toString() !== userId && transaction.sellerId.toString() !== userId) {
      return next(new ApiError(403, 'Not authorized to close this transaction'));
    }

    const rental = await Rental.findById(transaction.rentalId);
    if (rental) {
      // Clear booked dates in the transaction range
      const start = transaction.rentalStartDate!;
      const end = transaction.rentalEndDate!;
      const bookedDates = getDatesInRange(start, end);

      rental.availabilityCalendar = rental.availabilityCalendar.filter(
        date => !bookedDates.includes(date)
      );

      // If no other active bookings, set status to available
      rental.status = 'available';
      await rental.save();
    }

    // Complete transaction and release escrow funds
    transaction.status = 'completed';
    transaction.completedAt = new Date();
    await transaction.save();

    // Send notifications
    const owner = await User.findById(transaction.sellerId);
    const renter = await User.findById(transaction.buyerId);
    
    if (owner && renter) {
      // Notify owner that funds are released
      await createNotification(
        owner._id.toString(),
        'rental_returned',
        'Rental Completed',
        `Item has been marked returned. Escrow payment for your item has been released.`,
        transaction._id.toString(),
        'transaction'
      );
      // Notify renter
      await createNotification(
        renter._id.toString(),
        'rental_returned',
        'Rental Completed',
        `Rental transaction for "${rental?.title || 'item'}" successfully closed.`,
        transaction._id.toString(),
        'transaction'
      );
    }

    res.status(200).json({ transaction, rental });
  } catch (error) {
    next(error);
  }
};
