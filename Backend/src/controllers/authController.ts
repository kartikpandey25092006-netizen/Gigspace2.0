import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ApiError } from '../middlewares/errorMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_jwt_secret_key_12345';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'fallback_refresh_secret_key_67890';

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
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        college: newUser.college,
        ratingAvg: newUser.ratingAvg,
        ratingCount: newUser.ratingCount
      },
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

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    const tokens = generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        ratingAvg: user.ratingAvg,
        ratingCount: user.ratingCount
      },
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
