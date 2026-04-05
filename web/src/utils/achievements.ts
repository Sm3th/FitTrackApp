export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  category: 'workouts' | 'sets' | 'volume' | 'streak';
  unlocked: boolean;
  progress: number;
  color: string;
}

export const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'progress'>[] = [
  // Workout Achievements
  {
    id: 'first-workout',
    name: 'First Steps',
    description: 'Complete your first workout',
    icon: '🎯',
    requirement: 1,
    category: 'workouts',
    color: 'from-green-400 to-green-600',
  },
  {
    id: 'workout-warrior',
    name: 'Workout Warrior',
    description: 'Complete 10 workouts',
    icon: '⚔️',
    requirement: 10,
    category: 'workouts',
    color: 'from-blue-400 to-blue-600',
  },
  {
    id: 'century-club',
    name: 'Century Club',
    description: 'Complete 100 workouts',
    icon: '💯',
    requirement: 100,
    category: 'workouts',
    color: 'from-purple-400 to-purple-600',
  },

  // Set Achievements
  {
    id: 'set-starter',
    name: 'Set Starter',
    description: 'Log 50 sets',
    icon: '📝',
    requirement: 50,
    category: 'sets',
    color: 'from-yellow-400 to-yellow-600',
  },
  {
    id: 'set-master',
    name: 'Set Master',
    description: 'Log 500 sets',
    icon: '🎖️',
    requirement: 500,
    category: 'sets',
    color: 'from-orange-400 to-orange-600',
  },
  {
    id: 'set-legend',
    name: 'Set Legend',
    description: 'Log 1000 sets',
    icon: '👑',
    requirement: 1000,
    category: 'sets',
    color: 'from-red-400 to-red-600',
  },

  // Volume Achievements
  {
    id: 'heavy-lifter',
    name: 'Heavy Lifter',
    description: 'Lift 10,000 kg total',
    icon: '🏋️',
    requirement: 10000,
    category: 'volume',
    color: 'from-indigo-400 to-indigo-600',
  },
  {
    id: 'iron-giant',
    name: 'Iron Giant',
    description: 'Lift 50,000 kg total',
    icon: '💪',
    requirement: 50000,
    category: 'volume',
    color: 'from-pink-400 to-pink-600',
  },

  // Streak Achievements
  {
    id: 'streak-week',
    name: 'Weekly Warrior',
    description: '7 day workout streak',
    icon: '🔥',
    requirement: 7,
    category: 'streak',
    color: 'from-orange-400 to-red-600',
  },
  {
    id: 'streak-month',
    name: 'Monthly Master',
    description: '30 day workout streak',
    icon: '🔥',
    requirement: 30,
    category: 'streak',
    color: 'from-red-400 to-pink-600',
  },
];

export const calculateAchievements = (stats: {
  totalWorkouts: number;
  totalSets: number;
  totalVolume: number;
  streak: number;
}): Achievement[] => {
  return ACHIEVEMENTS.map(achievement => {
    let progress = 0;
    let unlocked = false;

    switch (achievement.category) {
      case 'workouts':
        progress = stats.totalWorkouts;
        break;
      case 'sets':
        progress = stats.totalSets;
        break;
      case 'volume':
        progress = stats.totalVolume;
        break;
      case 'streak':
        progress = stats.streak;
        break;
    }

    unlocked = progress >= achievement.requirement;

    return {
      ...achievement,
      progress,
      unlocked,
    };
  });
};

export const getRecentlyUnlocked = (achievements: Achievement[]): Achievement[] => {
  return achievements.filter(a => a.unlocked).slice(-3);
};

export const getNextAchievement = (achievements: Achievement[]): Achievement | null => {
  const locked = achievements.filter(a => !a.unlocked);
  if (locked.length === 0) return null;

  // Choose the locked achievement with the smallest remaining amount
  // (requirement - progress). This avoids showing a "next goal" that
  // appears to regress when a lower-requirement achievement is unlocked
  // and the UI jumps to a much larger milestone.
  return locked.sort((a, b) => {
    const aRemaining = Math.max(a.requirement - a.progress, 0);
    const bRemaining = Math.max(b.requirement - b.progress, 0);

    if (aRemaining !== bRemaining) return aRemaining - bRemaining;

    // Tie-breaker: prefer higher percent progress
    const aPct = a.progress / a.requirement;
    const bPct = b.progress / b.requirement;
    return bPct - aPct;
  })[0];
};