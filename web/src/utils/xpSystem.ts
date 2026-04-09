// XP & Level progression system

export interface LevelInfo {
  level: number;
  title: string;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPct: number;
  color: string;
  gradient: string;
}

export interface XPGain {
  base: number;
  durationBonus: number;
  setsBonus: number;
  ratingBonus: number;
  total: number;
}

const LEVEL_TITLES = [
  'Newcomer', 'Beginner', 'Rookie', 'Athlete', 'Trainer',
  'Advanced', 'Expert', 'Elite', 'Champion', 'Legend',
];

const LEVEL_COLORS = [
  '#94a3b8', '#64748b', '#22d3ee', '#3b82f6', '#8b5cf6',
  '#a855f7', '#f59e0b', '#f97316', '#ef4444', '#ec4899',
];

const LEVEL_GRADIENTS = [
  'from-slate-400 to-slate-500',
  'from-slate-500 to-slate-600',
  'from-cyan-400 to-blue-500',
  'from-blue-400 to-indigo-500',
  'from-violet-400 to-purple-500',
  'from-purple-400 to-fuchsia-500',
  'from-amber-400 to-yellow-500',
  'from-orange-400 to-red-500',
  'from-red-400 to-rose-500',
  'from-pink-400 to-fuchsia-600',
];

/** XP thresholds for each level boundary (index = level, value = total XP needed) */
function xpThreshold(level: number): number {
  if (level <= 0) return 0;
  // Gentle curve: 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3300, ...
  return Math.floor(100 * level + 25 * level * (level - 1));
}

export function getLevelFromXP(totalXP: number): LevelInfo {
  let level = 0;
  while (xpThreshold(level + 1) <= totalXP) {
    level++;
    if (level >= 99) break;
  }

  const tierIdx = Math.min(Math.floor(level / 10), LEVEL_TITLES.length - 1);
  const xpForCurrentLevel = xpThreshold(level);
  const xpForNextLevel = xpThreshold(level + 1);
  const range = xpForNextLevel - xpForCurrentLevel;
  const progressPct = range > 0 ? Math.round(((totalXP - xpForCurrentLevel) / range) * 100) : 100;

  return {
    level,
    title: LEVEL_TITLES[tierIdx],
    currentXP: totalXP,
    xpForCurrentLevel,
    xpForNextLevel,
    progressPct,
    color: LEVEL_COLORS[tierIdx],
    gradient: LEVEL_GRADIENTS[tierIdx],
  };
}

export function calculateWorkoutXP(
  durationSeconds: number,
  setsCount: number,
  rating: number,
): XPGain {
  const base = 50;
  const durationBonus = Math.floor(Math.min(durationSeconds / 60, 90) * 0.8); // up to 72 XP
  const setsBonus = Math.min(setsCount * 3, 60); // up to 60 XP
  const ratingBonus = rating > 0 ? (rating - 1) * 5 : 0; // 0–20 XP
  const total = base + durationBonus + setsBonus + ratingBonus;
  return { base, durationBonus, setsBonus, ratingBonus, total };
}

const XP_KEY = 'fittrack_total_xp';

export function getTotalXP(): number {
  return parseInt(localStorage.getItem(XP_KEY) || '0', 10);
}

export function addXP(amount: number): { newTotal: number; leveledUp: boolean; newLevel: number } {
  const prev = getTotalXP();
  const prevLevel = getLevelFromXP(prev).level;
  const newTotal = prev + amount;
  localStorage.setItem(XP_KEY, String(newTotal));
  const newLevel = getLevelFromXP(newTotal).level;
  return { newTotal, leveledUp: newLevel > prevLevel, newLevel };
}
