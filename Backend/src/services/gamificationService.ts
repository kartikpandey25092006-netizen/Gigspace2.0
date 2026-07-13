import { User } from '../models/User';
import { createNotification } from './notificationService';

// ─── XP Award Amounts ────────────────────────────────────────────────────────
export const XP_REWARDS = {
  POST_GIG: 20,
  ACCEPT_GIG: 15,
  COMPLETE_GIG_POSTER: 50,
  COMPLETE_GIG_WORKER: 60,
  LIST_RENTAL: 20,
  COMPLETE_RENTAL_OWNER: 50,
  COMPLETE_RENTAL_RENTER: 30,
  RECEIVE_5_STAR: 30,
  RECEIVE_4_STAR: 15,
  LOGIN_STREAK: 10,
} as const;

// ─── Level Thresholds ─────────────────────────────────────────────────────────
export const LEVELS = [
  { name: 'Freshman',  minXp: 0,    icon: '🎒' },
  { name: 'Sophomore', minXp: 100,  icon: '📚' },
  { name: 'Junior',    minXp: 300,  icon: '🔬' },
  { name: 'Senior',    minXp: 600,  icon: '🎓' },
  { name: 'Graduate',  minXp: 1000, icon: '🏆' },
];

export const getLevelInfo = (xp: number) => {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || LEVELS[i];
      break;
    }
  }
  const progressXp = xp - current.minXp;
  const rangeXp = next.minXp - current.minXp || 1;
  const progressPercent = Math.min(100, Math.round((progressXp / rangeXp) * 100));
  return { current, next, progressPercent, progressXp, rangeXp };
};

// ─── Badge Definitions ────────────────────────────────────────────────────────
export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const ALL_BADGES: Badge[] = [
  { id: 'first_gig',       name: 'First Hustle',    icon: '🚀', description: 'Posted your first gig' },
  { id: 'first_rental',    name: 'Landlord Jr.',    icon: '🔑', description: 'Listed your first rental item' },
  { id: 'gig_worker',      name: 'Gig Worker',      icon: '🤝', description: 'Accepted and completed 3 gigs' },
  { id: 'top_rated',       name: 'Top Rated',       icon: '⭐', description: 'Received 10 five-star ratings' },
  { id: 'side_hustler',    name: 'Side Hustler',    icon: '💼', description: 'Completed 5 gigs total' },
  { id: 'gear_guru',       name: 'Gear Guru',       icon: '🎒', description: 'Listed 3+ rental items' },
  { id: 'streak_3',        name: 'On Fire!',        icon: '🔥', description: '3-day activity streak' },
  { id: 'scholar',         name: 'Scholar',         icon: '🎓', description: 'Reached Senior level (600+ XP)' },
  { id: 'early_adopter',   name: 'Early Adopter',   icon: '⚡', description: 'One of the first on campus' },
];

// ─── Award XP ─────────────────────────────────────────────────────────────────
export const awardXP = async (userId: string, amount: number, reason: string) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { xp: amount } },
      { new: true }
    );
    if (!user) return;

    // Check if user levelled up
    const oldLevel = getLevelInfo(user.xp - amount);
    const newLevel = getLevelInfo(user.xp);
    if (newLevel.current.name !== oldLevel.current.name) {
      await createNotification(
        userId,
        'system',
        `🎉 Level Up! You're now a ${newLevel.current.icon} ${newLevel.current.name}`,
        `You earned ${amount} XP for: ${reason}. Keep going!`,
      );

      // Scholar badge on reaching Senior
      if (newLevel.current.name === 'Senior') {
        await awardBadge(userId, 'scholar');
      }
    }

    return user;
  } catch (err) {
    console.error('[Gamification] awardXP error:', err);
  }
};

// ─── Award Badge ──────────────────────────────────────────────────────────────
export const awardBadge = async (userId: string, badgeId: string) => {
  try {
    const badge = ALL_BADGES.find(b => b.id === badgeId);
    if (!badge) return;

    // Only award if not already earned
    const user = await User.findById(userId);
    if (!user) return;
    if (user.badges?.includes(badgeId)) return;

    await User.findByIdAndUpdate(userId, { $addToSet: { badges: badgeId } });

    await createNotification(
      userId,
      'system',
      `${badge.icon} Badge Unlocked: ${badge.name}`,
      badge.description,
    );
  } catch (err) {
    console.error('[Gamification] awardBadge error:', err);
  }
};

// ─── Check & Award Badges ─────────────────────────────────────────────────────
export const checkAndAwardBadges = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Import models here to avoid circular deps
    const { Gig } = await import('../models/Gig');
    const { Rental } = await import('../models/Rental');
    const { Rating } = await import('../models/Rating');

    const [postedGigs, rentals, completedAsWorker, fiveStarRatings] = await Promise.all([
      Gig.countDocuments({ posterId: userId }),
      Rental.countDocuments({ ownerId: userId }),
      Gig.countDocuments({ acceptedById: userId, status: 'completed' }),
      Rating.countDocuments({ rateeId: userId, stars: 5 }),
    ]);

    const completedGigsTotal = await Gig.countDocuments({
      $or: [{ posterId: userId }, { acceptedById: userId }],
      status: 'completed'
    });

    if (postedGigs >= 1)           await awardBadge(userId, 'first_gig');
    if (rentals >= 1)              await awardBadge(userId, 'first_rental');
    if (completedAsWorker >= 3)    await awardBadge(userId, 'gig_worker');
    if (fiveStarRatings >= 10)     await awardBadge(userId, 'top_rated');
    if (completedGigsTotal >= 5)   await awardBadge(userId, 'side_hustler');
    if (rentals >= 3)              await awardBadge(userId, 'gear_guru');

    // Early adopter: first 20 users
    const userCount = await User.countDocuments({ _id: { $lte: userId } });
    if (userCount <= 20)           await awardBadge(userId, 'early_adopter');

  } catch (err) {
    console.error('[Gamification] checkAndAwardBadges error:', err);
  }
};

// ─── Update Streak ────────────────────────────────────────────────────────────
export const updateStreak = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const now = new Date();
    const last = user.lastActivityDate;

    let newStreak = 1;
    if (last) {
      const diffMs = now.getTime() - new Date(last).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak = (user.streak || 0) + 1;
      } else if (diffDays === 0) {
        newStreak = user.streak || 1; // same day, no change
      } else {
        newStreak = 1; // streak broken
      }
    }

    await User.findByIdAndUpdate(userId, {
      streak: newStreak,
      lastActivityDate: now,
    });

    // Award streak badge at 3 days
    if (newStreak >= 3) {
      await awardBadge(userId, 'streak_3');
    }

    // Award XP for maintaining streak (once per day)
    const isNewDay = !last || Math.floor((now.getTime() - new Date(last).getTime()) / (1000 * 60 * 60 * 24)) >= 1;
    if (isNewDay && newStreak > 1) {
      await awardXP(userId, XP_REWARDS.LOGIN_STREAK, `${newStreak}-day streak`);
    }

    return newStreak;
  } catch (err) {
    console.error('[Gamification] updateStreak error:', err);
  }
};

// ─── Reputation Score ─────────────────────────────────────────────────────────
export const calculateReputationScore = (ratingAvg: number, badgesCount: number, streak: number) => {
  const ratingWeight = 100;
  const badgeWeight = 50;
  const streakWeight = 10;
  
  return Math.round((ratingAvg * ratingWeight) + (badgesCount * badgeWeight) + (streak * streakWeight));
};
