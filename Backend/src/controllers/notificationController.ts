import { Response, NextFunction } from 'express';
import { Notification } from '../models/Notification';
import { ApiError } from '../middlewares/errorMiddleware';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const getMyNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const notifId = req.params.id;
    const userId = req.user?.id;

    const notif = await Notification.findById(notifId);
    if (!notif) {
      return next(new ApiError(404, 'Notification not found'));
    }

    if (notif.userId.toString() !== userId) {
      return next(new ApiError(403, 'Not authorized to modify this notification'));
    }

    notif.read = true;
    await notif.save();

    res.status(200).json(notif);
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
