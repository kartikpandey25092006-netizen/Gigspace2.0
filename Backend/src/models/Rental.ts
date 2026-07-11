import mongoose, { Schema, Document } from 'mongoose';
import { IRental } from '../../../Shared/src/types';

export interface IRentalDocument extends Omit<IRental, '_id' | 'createdAt' | 'updatedAt' | 'ownerId'>, Document {
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RentalSchema = new Schema<IRentalDocument>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  pricePerDay: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, index: true },
  status: { type: String, enum: ['available', 'rented', 'maintenance'], default: 'available', index: true },
  availabilityCalendar: [{ type: String }] // Array of date strings in YYYY-MM-DD format representing booked/rented days
}, {
  timestamps: true
});

export const Rental = mongoose.model<IRentalDocument>('Rental', RentalSchema);
