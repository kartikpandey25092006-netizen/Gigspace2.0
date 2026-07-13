import mongoose, { Schema, Document } from 'mongoose';
import { IGig } from '../../../Shared/src/types';

export interface IGigDocument extends Omit<IGig, '_id' | 'createdAt' | 'updatedAt' | 'posterId' | 'acceptedById'>, Document {
  posterId: mongoose.Types.ObjectId;
  acceptedById?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GigSchema = new Schema<IGigDocument>({
  posterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  acceptedById: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, index: true },
  locationDetails: { type: String, trim: true, default: '' },
  requirementNotes: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['open', 'accepted', 'completed', 'cancelled'], default: 'open', index: true }
}, {
  timestamps: true
});

export const Gig = mongoose.model<IGigDocument>('Gig', GigSchema);
