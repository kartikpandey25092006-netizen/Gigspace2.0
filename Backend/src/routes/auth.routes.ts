import { Router } from 'express';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import {
  signup,
  login,
  refreshToken,
  changePassword,
  toggleLeaderboardOptIn,
  findOrCreateGoogleUser,
  googleCallback,
  linkCollegeEmail,
  verifyCollegeEmailOtp
} from '../controllers/authController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();
const googleOAuthConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (googleOAuthConfigured) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/v1/auth/google/callback'
  }, findOrCreateGoogleUser));
}

const linkCollegeEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.id || req.ip,
  message: { message: 'Too many OTP requests. Please wait 15 minutes before trying again.' }
});

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refreshToken);
if (googleOAuthConfigured) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?oauthError=Google%20authentication%20failed` }),
    googleCallback as any
  );
} else {
  router.get(['/google', '/google/callback'], (_req, res) => {
    res.status(503).json({ message: 'Google sign-in is not configured' });
  });
}
router.post('/link-college-email', authenticateJWT as any, linkCollegeEmailLimiter as any, linkCollegeEmail as any);
router.post('/verify-otp', authenticateJWT as any, verifyCollegeEmailOtp as any);
router.post('/change-password', authenticateJWT as any, changePassword as any);
router.patch('/opt-in', authenticateJWT as any, toggleLeaderboardOptIn as any);

export default router;
