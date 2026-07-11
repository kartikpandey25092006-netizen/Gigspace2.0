import mongoose, { Schema, Document } from 'mongoose';
import { ICategory } from '../../../Shared/src/types';

export interface ICategoryDocument extends Omit<ICategory, '_id'>, Document {}

const CategorySchema = new Schema<ICategoryDocument>({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['gig', 'rental'], required: true, index: true },
  icon: { type: String }
});

// Compound index to guarantee uniqueness of categories by name and type
CategorySchema.index({ name: 1, type: 1 }, { unique: true });

export const Category = mongoose.model<ICategoryDocument>('Category', CategorySchema);
