import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Profile } from 'passport-google-oauth20';
import { User } from '../models/User';
import { ApiError } from '../middlewares/errorMiddleware';
import { updateStreak } from '../services/gamificationService';
import { generateAndSendOtp, verifyOtp, VIT_EMAIL_REGEX } from '../services/otpService';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_jwt_secret_key_12345';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'fallback_refresh_secret_key_67890';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const generateTokens = (user: { id: string; email: string; role: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const buildAuthUser = (user: any) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  primaryEmail: user.primaryEmail || user.email,
  googleId: user.googleId,
  collegeEmail: user.collegeEmail,
  isVerified: Boolean(user.isVerified),
  role: user.role,
  college: user.college,
  ratingAvg: user.ratingAvg,
  ratingCount: user.ratingCount,
  xp: user.xp,
  streak: user.streak,
  badges: user.badges,
  leaderboardOptIn: user.leaderboardOptIn,
  lastActivityDate: user.lastActivityDate
});

export const findOrCreateGoogleUser = async (_accessToken: string, _refreshToken: string, profile: Profile, done: (error: any, user?: any) => void) => {
  try {
    const primaryEmail = profile.emails?.[0]?.value?.toLowerCase();
    if (!primaryEmail) {
      return done(new ApiError(400, 'Google account did not provide an email address'));
    }

    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      user = await User.findOne({ primaryEmail });
    }

    if (!user) {
      user = await User.create({
        name: profile.displayName || primaryEmail.split('@')[0],
        email: primaryEmail,
        primaryEmail,
        googleId: profile.id,
        role: 'student',
        college: 'VIT'
      });
    } else if (!user.googleId) {
      user.googleId = profile.id;
      user.primaryEmail = user.primaryEmail || primaryEmail;
      user.email = user.email || primaryEmail;
      await user.save();
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
};

export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any;
    if (!user) {
      return next(new ApiError(401, 'Google authentication failed'));
    }

    const tokens = generateTokens({
      id: user._id.toString(),
      email: user.primaryEmail || user.email,
      role: user.role
    });

    await updateStreak(user._id.toString());
    const updatedUser = await User.findById(user._id);
    const authUser = buildAuthUser(updatedUser || user);
    const params = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: JSON.stringify(authUser)
    });

    res.redirect(`${FRONTEND_URL}/login?${params.toString()}`);
  } catch (error) {
    next(error);
  }
};

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, college } = req.body;

    if (!name || !email || !password || !college) {
      return next(new ApiError(400, 'All fields are required'));
    }

    // Verify college email (.edu or containing college domain)
    const emailRegex = /^[^\s@]+@[^\s@]+\.(edu|ac\.[a-z]{2})$/i;
    if (!emailRegex.test(email)) {
      return next(new ApiError(400, 'Must register using a valid college email address (.edu)'));
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new ApiError(400, 'A user with this email already exists'));
    }

    if (password.length < 6) {
      return next(new ApiError(400, 'Password must be at least 6 characters long'));
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      primaryEmail: email.toLowerCase(),
      passwordHash,
      role: 'student',
      college
    });

    const tokens = generateTokens({
      id: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role
    });

    res.status(201).json({
      user: buildAuthUser(newUser),
      ...tokens
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ApiError(400, 'Email and password are required'));
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    if (!user.passwordHash) {
      return next(new ApiError(401, 'Use Google sign-in for this account'));
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    const tokens = generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role
    });

    // Update login streak
    await updateStreak(user._id.toString());
    const updatedUser = await User.findById(user._id);

    res.status(200).json({
      user: buildAuthUser(updatedUser || user),
      ...tokens
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) {
      return next(new ApiError(400, 'Refresh token is required'));
    }

    jwt.verify(token, REFRESH_SECRET, async (err: any, decoded: any) => {
      if (err) {
        return next(new ApiError(403, 'Invalid or expired refresh token'));
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new ApiError(404, 'User not found'));
      }

      const tokens = generateTokens({
        id: user._id.toString(),
        email: user.email,
        role: user.role
      });

    res.status(200).json(tokens);
    });
  } catch (error) {
    next(error);
  }
};

export const linkCollegeEmail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { collegeEmail } = req.body;

    if (!collegeEmail || typeof collegeEmail !== 'string') {
      return next(new ApiError(400, 'VIT email is required'));
    }

    const normalizedEmail = collegeEmail.toLowerCase().trim();
    if (!VIT_EMAIL_REGEX.test(normalizedEmail)) {
      return next(new ApiError(400, 'Use a valid VIT email ending in @vitstudent.ac.in or @vit.ac.in'));
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return next(new ApiError(404, 'User not found'));
    }

    if (currentUser.collegeEmail && currentUser.isVerified) {
      return next(new ApiError(400, 'A VIT email is already linked to this account'));
    }

    const linkedUser = await User.findOne({ collegeEmail: normalizedEmail, _id: { $ne: userId } });
    if (linkedUser) {
      return next(new ApiError(409, 'This VIT email is already linked to another account'));
    }

    await generateAndSendOtp(normalizedEmail);
    res.status(200).json({ message: 'OTP sent to your VIT email', collegeEmail: normalizedEmail });
  } catch (error) {
    next(error);
  }
};

export const verifyCollegeEmailOtp = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { collegeEmail, otp } = req.body;

    if (!collegeEmail || !otp) {
      return next(new ApiError(400, 'VIT email and OTP are required'));
    }

    const normalizedEmail = String(collegeEmail).toLowerCase().trim();
    if (!VIT_EMAIL_REGEX.test(normalizedEmail)) {
      return next(new ApiError(400, 'Use a valid VIT email ending in @vitstudent.ac.in or @vit.ac.in'));
    }

    const updatedUser = await verifyOtp(userId, normalizedEmail, String(otp).trim());
    res.status(200).json({
      message: 'VIT email verified successfully',
      user: buildAuthUser(updatedUser)
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return next(new ApiError(400, 'Old and new passwords are required'));
    }

    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    if (!user.passwordHash) {
      return next(new ApiError(400, 'Password changes are not available for Google sign-in accounts'));
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return next(new ApiError(400, 'Incorrect old password'));
    }

    if (newPassword.length < 6) {
      return next(new ApiError(400, 'New password must be at least 6 characters long'));
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const toggleLeaderboardOptIn = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { optIn } = req.body;

    if (optIn === undefined) {
      return next(new ApiError(400, 'optIn boolean is required'));
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { leaderboardOptIn: optIn },
      { new: true }
    );

    if (!updatedUser) {
      return next(new ApiError(404, 'User not found'));
    }

    res.status(200).json({
      user: buildAuthUser(updatedUser)
    });
  } catch (error) {
    next(error);
  }
};
