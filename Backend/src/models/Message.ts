import mongoose, { Schema, Document } from 'mongoose';
import { IMessage } from '../../../Shared/src/types';

export interface IMessageDocument extends Omit<IMessage, '_id' | 'senderId' | 'receiverId' | 'sentAt'>, Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  sentAt: Date;
}

const MessageSchema = new Schema<IMessageDocument>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  body: { type: String, required: true },
  read: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'sentAt', updatedAt: false }
});

export const Message = mongoose.model<IMessageDocument>('Message', MessageSchema);
