import mongoose, { Schema, Document } from 'mongoose';
import { ITransaction } from '../../../Shared/src/types';

export interface ITransactionDocument extends Omit<ITransaction, '_id' | 'createdAt' | 'updatedAt' | 'gigId' | 'rentalId' | 'buyerId' | 'sellerId'>, Document {
  gigId?: mongoose.Types.ObjectId;
  rentalId?: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>({
  type: { type: String, enum: ['gig', 'rental'], required: true, index: true },
  gigId: { type: Schema.Types.ObjectId, ref: 'Gig', index: true },
  rentalId: { type: Schema.Types.ObjectId, ref: 'Rental', index: true },
  buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'held_in_escrow', 'completed', 'cancelled'], default: 'pending', index: true },
  rentalStartDate: { type: Date },
  rentalEndDate: { type: Date },
  completedAt: { type: Date }
}, {
  timestamps: true
});

export const Transaction = mongoose.model<ITransactionDocument>('Transaction', TransactionSchema);
