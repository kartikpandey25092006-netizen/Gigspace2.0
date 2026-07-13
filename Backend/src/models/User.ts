import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../../Shared/src/types';

export interface IUserDocument extends Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>, Document {
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  xp: number;
  badges: string[];
  streak: number;
  leaderboardOptIn: boolean;
  lastActivityDate?: Date;
}

const UserSchema = new Schema<IUserDocument>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  college: { type: String, required: true, trim: true },
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  // Gamification fields
  xp: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  streak: { type: Number, default: 0 },
  leaderboardOptIn: { type: Boolean, default: false },
  lastActivityDate: { type: Date }
}, {
  timestamps: true
});

export const User = mongoose.model<IUserDocument>('User', UserSchema);
