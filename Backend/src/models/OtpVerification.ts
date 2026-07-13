import mongoose, { Schema, Document } from 'mongoose';

export interface IOtpVerificationDocument extends Document {
  email: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const OtpVerificationSchema = new Schema<IOtpVerificationDocument>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  attempts: { type: Number, default: 0, min: 0, max: 5 }
}, {
  timestamps: true
});

export const OtpVerification = mongoose.model<IOtpVerificationDocument>('OtpVerification', OtpVerificationSchema);
