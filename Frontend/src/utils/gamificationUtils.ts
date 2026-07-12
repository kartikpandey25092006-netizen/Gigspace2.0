export const LEVELS = [
  { name: 'Freshman',  minXp: 0,    icon: '🎒' },
  { name: 'Sophomore', minXp: 100,  icon: '📚' },
  { name: 'Junior',    minXp: 300,  icon: '🔬' },
  { name: 'Senior',    minXp: 600,  icon: '🎓' },
  { name: 'Graduate',  minXp: 1000, icon: '🏆' },
];

export const ALL_BADGES = [
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
