import { Notification } from '../models/Notification';
import { emitToUser } from '../config/socket';
import { NotificationType } from '../../../Shared/src/types';

export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  referenceId?: string,
  referenceType?: 'gig' | 'rental' | 'transaction' | 'chat'
) => {
  try {
    // 1. Create notification in database
    const notif = await Notification.create({
      userId,
      type,
      payload: {
        title,
        message,
        referenceId,
        referenceType
      },
      read: false
    });

    // 2. Push via Socket.io for immediate UI rendering
    emitToUser(userId, 'notification', notif);

    // 3. Simulated external delivery: Email and Push notifications
    console.log(`[MOCK EMAIL & PUSH] Dispatching notification to ${userId}:`);
    console.log(` -> Title: ${title}`);
    console.log(` -> Message: ${message}`);
    console.log(` -> Channel: Email & SMS/Push Simulation`);

    return notif;
  } catch (error) {
    console.error('Failed to dispatch notification:', error);
    throw error;
  }
};
