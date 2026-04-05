import { describe, it, expect } from 'vitest';
import {
  calculateStreak,
  getTotalVolume,
  getExerciseStats,
  getPersonalRecords,
  getMuscleGroupBreakdown,
} from '../utils/statsHelper';

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function makeWorkout(daysBack: number, sets: Array<{ name: string; muscleGroup?: string; reps: number; weight: number }> = []) {
  return {
    id: `w${daysBack}`,
    startTime: daysAgo(daysBack),
    exerciseSets: sets.map((s, i) => ({
      exercise: { name: s.name, muscleGroup: s.muscleGroup },
      setNumber: i + 1,
      reps: s.reps,
      weight: s.weight,
    })),
  };
}

// ── calculateStreak ───────────────────────────────────────────────────────────

describe('calculateStreak', () => {
  it('returns 0 for empty workouts', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('returns 1 for a single workout today', () => {
    expect(calculateStreak([makeWorkout(0)])).toBe(1);
  });

  it('returns correct streak for consecutive days', () => {
    const workouts = [makeWorkout(0), makeWorkout(1), makeWorkout(2)];
    expect(calculateStreak(workouts)).toBe(3);
  });

  it('breaks streak at a gap', () => {
    // today + yesterday but NOT 2 days ago
    const workouts = [makeWorkout(0), makeWorkout(1), makeWorkout(3)];
    expect(calculateStreak(workouts)).toBe(2);
  });

  it('returns 0 when most recent workout was 2+ days ago', () => {
    const workouts = [makeWorkout(2), makeWorkout(3)];
    expect(calculateStreak(workouts)).toBe(0);
  });
});

// ── getTotalVolume ────────────────────────────────────────────────────────────

describe('getTotalVolume', () => {
  it('returns 0 for empty input', () => {
    expect(getTotalVolume([])).toBe(0);
  });

  it('calculates reps × weight correctly', () => {
    const workouts = [
      makeWorkout(0, [{ name: 'Bench', reps: 10, weight: 100 }]),
    ];
    expect(getTotalVolume(workouts)).toBe(1000);
  });

  it('sums across multiple sets and workouts', () => {
    const workouts = [
      makeWorkout(0, [
        { name: 'Bench', reps: 10, weight: 100 },
        { name: 'Squat', reps: 5, weight: 200 },
      ]),
      makeWorkout(1, [{ name: 'Deadlift', reps: 3, weight: 150 }]),
    ];
    // 10×100 + 5×200 + 3×150 = 1000 + 1000 + 450 = 2450
    expect(getTotalVolume(workouts)).toBe(2450);
  });

  it('ignores sets with zero weight', () => {
    const workouts = [makeWorkout(0, [{ name: 'Pull-up', reps: 10, weight: 0 }])];
    expect(getTotalVolume(workouts)).toBe(0);
  });
});

// ── getExerciseStats ──────────────────────────────────────────────────────────

describe('getExerciseStats', () => {
  it('returns empty array for no workouts', () => {
    expect(getExerciseStats([])).toEqual([]);
  });

  it('aggregates sets per exercise correctly', () => {
    const workouts = [
      makeWorkout(0, [
        { name: 'Bench', reps: 10, weight: 100 },
        { name: 'Bench', reps: 8, weight: 110 },
        { name: 'Squat', reps: 5, weight: 120 },
      ]),
    ];
    const stats = getExerciseStats(workouts);
    const bench = stats.find(s => s.name === 'Bench');
    const squat = stats.find(s => s.name === 'Squat');
    expect(bench).toBeDefined();
    expect(bench!.totalSets).toBe(2);
    expect(bench!.maxWeight).toBe(110);
    expect(squat!.totalSets).toBe(1);
  });
});

// ── getPersonalRecords ────────────────────────────────────────────────────────

describe('getPersonalRecords', () => {
  it('returns empty array for no workouts', () => {
    expect(getPersonalRecords([])).toEqual([]);
  });

  it('tracks the highest weight per exercise', () => {
    const workouts = [
      makeWorkout(5, [{ name: 'Bench', reps: 5, weight: 100 }]),
      makeWorkout(2, [{ name: 'Bench', reps: 3, weight: 120 }]),
      makeWorkout(0, [{ name: 'Bench', reps: 8, weight: 90 }]),
    ];
    const prs = getPersonalRecords(workouts);
    const bench = prs.find(p => p.name === 'Bench');
    expect(bench).toBeDefined();
    expect(bench!.weight).toBe(120);
  });

  it('returns at most 5 entries', () => {
    const workouts = [
      makeWorkout(0, [
        { name: 'Ex1', reps: 10, weight: 100 },
        { name: 'Ex2', reps: 10, weight: 90 },
        { name: 'Ex3', reps: 10, weight: 80 },
        { name: 'Ex4', reps: 10, weight: 70 },
        { name: 'Ex5', reps: 10, weight: 60 },
        { name: 'Ex6', reps: 10, weight: 50 },
      ]),
    ];
    expect(getPersonalRecords(workouts).length).toBeLessThanOrEqual(5);
  });
});

// ── getMuscleGroupBreakdown ───────────────────────────────────────────────────

describe('getMuscleGroupBreakdown', () => {
  it('returns empty array for no workouts', () => {
    expect(getMuscleGroupBreakdown([])).toEqual([]);
  });

  it('counts sets per muscle group', () => {
    const workouts = [
      makeWorkout(0, [
        { name: 'Bench', muscleGroup: 'Chest', reps: 10, weight: 80 },
        { name: 'Fly',   muscleGroup: 'Chest', reps: 12, weight: 30 },
        { name: 'Squat', muscleGroup: 'Legs',  reps: 8,  weight: 100 },
      ]),
    ];
    const breakdown = getMuscleGroupBreakdown(workouts);
    const chest = breakdown.find(b => b.name === 'Chest');
    const legs  = breakdown.find(b => b.name === 'Legs');
    expect(chest).toBeDefined();
    expect(chest!.value).toBe(2);
    expect(legs!.value).toBe(1);
  });

  it('assigns a color to each muscle group', () => {
    const workouts = [makeWorkout(0, [{ name: 'Squat', muscleGroup: 'Legs', reps: 5, weight: 100 }])];
    const breakdown = getMuscleGroupBreakdown(workouts);
    expect(breakdown[0]).toHaveProperty('color');
    expect(breakdown[0].color).toMatch(/^#/);
  });
});
