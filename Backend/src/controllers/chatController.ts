import { Response, NextFunction } from 'express';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { ApiError } from '../middlewares/errorMiddleware';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { emitToUser } from '../config/socket';
import { createNotification } from '../services/notificationService';

export const sendMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { receiverId, body } = req.body;
    const senderId = req.user?.id;

    if (!receiverId || !body) {
      return next(new ApiError(400, 'Receiver ID and message body are required'));
    }

    if (receiverId === senderId) {
      return next(new ApiError(400, 'You cannot send a message to yourself'));
    }

    const recipient = await User.findById(receiverId);
    if (!recipient) {
      return next(new ApiError(404, 'Recipient user not found'));
    }

    const message = await Message.create({
      senderId,
      receiverId,
      body,
      read: false
    });

    // Load sender details for the UI payload
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name email college ratingAvg')
      .populate('receiverId', 'name email college ratingAvg');

    // Trigger instant Socket.io event if recipient is connected
    const sentRealtime = emitToUser(receiverId, 'new_message', populatedMessage);

    // If recipient is offline or not actively viewing, create an in-app notification
    if (!sentRealtime) {
      const sender = await User.findById(senderId);
      await createNotification(
        receiverId,
        'new_message',
        `New message from ${sender?.name || 'Peer'}`,
        body.length > 60 ? `${body.substring(0, 57)}...` : body,
        senderId,
        'chat'
      );
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    // Find all messages involving current user
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ sentAt: -1 });

    // Group in memory to find unique conversation partners and their last message
    const conversationMap = new Map<string, any>();

    for (const msg of messages) {
      const partnerId = msg.senderId.toString() === userId 
        ? msg.receiverId.toString() 
        : msg.senderId.toString();

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, msg);
      }
    }

    const conversationList = [];
    for (const [partnerId, lastMsg] of conversationMap.entries()) {
      const partnerInfo = await User.findById(partnerId).select('name email college ratingAvg');
      if (partnerInfo) {
        conversationList.push({
          partner: partnerInfo,
          lastMessage: lastMsg
        });
      }
    }

    res.status(200).json(conversationList);
  } catch (error) {
    next(error);
  }
};

export const getMessageHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const partnerId = req.params.partnerId;

    // Retrieve all messages exchanged between the two users
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId }
      ]
    })
      .populate('senderId', 'name email college')
      .populate('receiverId', 'name email college')
      .sort({ sentAt: 1 }); // Chronological order

    // Mark messages sent by the partner to us as read
    await Message.updateMany(
      { senderId: partnerId, receiverId: userId, read: false },
      { read: true }
    );

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};
