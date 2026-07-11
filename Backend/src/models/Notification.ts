import mongoose, { Schema, Document } from 'mongoose';
import { INotification } from '../../../Shared/src/types';

export interface INotificationDocument extends Omit<INotification, '_id' | 'createdAt' | 'userId'>, Document {
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['gig_accepted', 'gig_completed', 'rental_booked', 'rental_returned', 'new_message', 'new_rating', 'system'],
    required: true
  },
  payload: {
    title: { type: String, required: true },
    message: { type: String, required: true },
    referenceId: { type: String },
    referenceType: { type: String, enum: ['gig', 'rental', 'transaction', 'chat'] }
  },
  read: { type: Boolean, default: false, index: true }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const Notification = mongoose.model<INotificationDocument>('Notification', NotificationSchema);
