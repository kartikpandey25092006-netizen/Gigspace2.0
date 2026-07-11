import mongoose, { Schema, Document } from 'mongoose';
import { IRating } from '../../../Shared/src/types';

export interface IRatingDocument extends Omit<IRating, '_id' | 'createdAt' | 'transactionId' | 'raterId' | 'rateeId'>, Document {
  transactionId: mongoose.Types.ObjectId;
  raterId: mongoose.Types.ObjectId;
  rateeId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const RatingSchema = new Schema<IRatingDocument>({
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true, index: true },
  raterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rateeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  stars: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const Rating = mongoose.model<IRatingDocument>('Rating', RatingSchema);
