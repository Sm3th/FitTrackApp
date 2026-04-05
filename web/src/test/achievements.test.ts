import { describe, it, expect } from 'vitest';
import {
  calculateAchievements,
  getRecentlyUnlocked,
  getNextAchievement,
  ACHIEVEMENTS,
} from '../utils/achievements';

const baseStats = { totalWorkouts: 0, totalSets: 0, totalVolume: 0, streak: 0 };

describe('calculateAchievements', () => {
  it('returns one Achievement per ACHIEVEMENTS entry', () => {
    const result = calculateAchievements(baseStats);
    expect(result.length).toBe(ACHIEVEMENTS.length);
  });

  it('all achievements locked with zero stats', () => {
    const result = calculateAchievements(baseStats);
    expect(result.every(a => !a.unlocked)).toBe(true);
  });

  it('unlocks first-workout at 1 workout', () => {
    const result = calculateAchievements({ ...baseStats, totalWorkouts: 1 });
    const fw = result.find(a => a.id === 'first-workout');
    expect(fw?.unlocked).toBe(true);
  });

  it('does not unlock workout-warrior at 1 workout', () => {
    const result = calculateAchievements({ ...baseStats, totalWorkouts: 1 });
    const ww = result.find(a => a.id === 'workout-warrior');
    expect(ww?.unlocked).toBe(false);
    expect(ww?.progress).toBe(1);
  });

  it('unlocks all workout achievements at 100 workouts', () => {
    const result = calculateAchievements({ ...baseStats, totalWorkouts: 100 });
    const workoutAchievements = result.filter(a => a.category === 'workouts');
    expect(workoutAchievements.every(a => a.unlocked)).toBe(true);
  });

  it('sets correct progress for volume category', () => {
    const result = calculateAchievements({ ...baseStats, totalVolume: 5000 });
    const hl = result.find(a => a.id === 'heavy-lifter');
    expect(hl?.progress).toBe(5000);
    expect(hl?.unlocked).toBe(false);
  });

  it('unlocks heavy-lifter at 10000 volume', () => {
    const result = calculateAchievements({ ...baseStats, totalVolume: 10000 });
    const hl = result.find(a => a.id === 'heavy-lifter');
    expect(hl?.unlocked).toBe(true);
  });

  it('unlocks weekly-warrior streak achievement at 7 streak', () => {
    const result = calculateAchievements({ ...baseStats, streak: 7 });
    const sw = result.find(a => a.id === 'streak-week');
    expect(sw?.unlocked).toBe(true);
  });

  it('does not unlock monthly-master at 7 streak', () => {
    const result = calculateAchievements({ ...baseStats, streak: 7 });
    const sm = result.find(a => a.id === 'streak-month');
    expect(sm?.unlocked).toBe(false);
  });

  it('unlocks set achievements at correct thresholds', () => {
    const result50 = calculateAchievements({ ...baseStats, totalSets: 50 });
    const result500 = calculateAchievements({ ...baseStats, totalSets: 500 });
    expect(result50.find(a => a.id === 'set-starter')?.unlocked).toBe(true);
    expect(result50.find(a => a.id === 'set-master')?.unlocked).toBe(false);
    expect(result500.find(a => a.id === 'set-master')?.unlocked).toBe(true);
  });

  it('each achievement has all required fields', () => {
    const result = calculateAchievements({ ...baseStats, totalWorkouts: 5 });
    result.forEach(a => {
      expect(a).toHaveProperty('id');
      expect(a).toHaveProperty('name');
      expect(a).toHaveProperty('icon');
      expect(a).toHaveProperty('color');
      expect(typeof a.unlocked).toBe('boolean');
      expect(typeof a.progress).toBe('number');
    });
  });
});

describe('getRecentlyUnlocked', () => {
  it('returns empty array when no achievements unlocked', () => {
    const achievements = calculateAchievements(baseStats);
    expect(getRecentlyUnlocked(achievements)).toEqual([]);
  });

  it('returns only unlocked achievements', () => {
    const achievements = calculateAchievements({ ...baseStats, totalWorkouts: 1 });
    const recent = getRecentlyUnlocked(achievements);
    expect(recent.every(a => a.unlocked)).toBe(true);
  });

  it('returns at most 3 achievements', () => {
    // Unlock many achievements
    const achievements = calculateAchievements({
      totalWorkouts: 100,
      totalSets: 1000,
      totalVolume: 50000,
      streak: 30,
    });
    expect(getRecentlyUnlocked(achievements).length).toBeLessThanOrEqual(3);
  });
});

describe('getNextAchievement', () => {
  it('returns null when all achievements unlocked', () => {
    const achievements = calculateAchievements({
      totalWorkouts: 100,
      totalSets: 1000,
      totalVolume: 50000,
      streak: 30,
    });
    expect(getNextAchievement(achievements)).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(getNextAchievement([])).toBeNull();
  });

  it('returns the achievement closest to completion', () => {
    // 1 workout logged — first-workout is unlocked (1/1)
    // Remaining: streak-week needs 7, workout-warrior needs 9, set-starter needs 50 → streak-week is closest
    const achievements = calculateAchievements({ ...baseStats, totalWorkouts: 1 });
    const next = getNextAchievement(achievements);
    expect(next).not.toBeNull();
    expect(next!.unlocked).toBe(false);
    expect(next!.id).toBe('streak-week');
  });

  it('returned achievement is always locked', () => {
    const achievements = calculateAchievements({ ...baseStats, totalWorkouts: 5 });
    const next = getNextAchievement(achievements);
    expect(next?.unlocked).toBe(false);
  });
});
