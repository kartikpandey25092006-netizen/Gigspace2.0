import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { OtpVerification } from '../models/OtpVerification';
import { User } from '../models/User';
import { ApiError } from '../middlewares/errorMiddleware';

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export const VIT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(vitstudent\.ac\.in|vit\.ac\.in)$/;

const createTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new ApiError(500, 'SMTP_USER and SMTP_PASS must be configured to send OTP emails');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
};

export const generateAndSendOtp = async (email: string): Promise<void> => {
  const normalizedEmail = email.toLowerCase().trim();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await OtpVerification.findOneAndUpdate(
    { email: normalizedEmail },
    { email: normalizedEmail, otpHash, expiresAt, attempts: 0 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: normalizedEmail,
    subject: 'Your Gigspace VIT verification code',
    text: `Your Gigspace verification code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    html: `<p>Your Gigspace verification code is <strong>${otp}</strong>.</p><p>It expires in ${OTP_TTL_MINUTES} minutes.</p>`
  });
};

export const verifyOtp = async (userId: string, email: string, otp: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  const verification = await OtpVerification.findOne({ email: normalizedEmail });

  if (!verification) {
    throw new ApiError(400, 'OTP not found or expired. Please request a new code.');
  }

  if (verification.expiresAt.getTime() < Date.now()) {
    await OtpVerification.deleteOne({ _id: verification._id });
    throw new ApiError(400, 'OTP expired. Please request a new code.');
  }

  if (verification.attempts >= MAX_ATTEMPTS) {
    await OtpVerification.deleteOne({ _id: verification._id });
    throw new ApiError(429, 'Too many incorrect attempts. Please request a new code.');
  }

  const isMatch = await bcrypt.compare(otp, verification.otpHash);
  if (!isMatch) {
    verification.attempts += 1;
    await verification.save();
    throw new ApiError(400, 'Incorrect OTP. Please try again.');
  }

  const currentUser = await User.findById(userId);
  if (!currentUser) {
    throw new ApiError(404, 'User not found');
  }

  if (currentUser.collegeEmail && currentUser.isVerified) {
    throw new ApiError(400, 'A VIT email is already linked to this account');
  }

  const linkedUser = await User.findOne({ collegeEmail: normalizedEmail, _id: { $ne: userId } });
  if (linkedUser) {
    throw new ApiError(409, 'This VIT email is already linked to another account');
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { collegeEmail: normalizedEmail, isVerified: true },
    { new: true }
  );

  await OtpVerification.deleteOne({ _id: verification._id });

  if (!updatedUser) {
    throw new ApiError(404, 'User not found');
  }

  return updatedUser;
};
