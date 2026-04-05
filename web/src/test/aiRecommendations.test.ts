import { describe, it, expect } from 'vitest';
import { generateAIReport, type WorkoutEntry } from '../utils/aiRecommendations';

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function makeWorkout(
  daysBack: number,
  muscleGroups: string[] = ['chest'],
  opts: Partial<WorkoutEntry> = {}
): WorkoutEntry {
  return {
    id: `w-${daysBack}-${Math.random()}`,
    startTime: daysAgo(daysBack),
    duration: 45,
    exerciseSets: muscleGroups.map((mg, i) => ({
      exercise: { name: `Exercise ${mg}`, muscleGroup: mg },
      setNumber: i + 1,
      reps: 10,
      weight: 60,
    })),
    ...opts,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('generateAIReport', () => {
  it('returns a valid report structure for empty input', () => {
    const report = generateAIReport([]);
    expect(report).toHaveProperty('recommendations');
    expect(report).toHaveProperty('weeklyPlan');
    expect(report).toHaveProperty('score');
    expect(report).toHaveProperty('scoreLabel');
    expect(report).toHaveProperty('insights');
    expect(Array.isArray(report.recommendations)).toBe(true);
    expect(Array.isArray(report.weeklyPlan)).toBe(true);
    expect(report.weeklyPlan).toHaveLength(7);
  });

  it('score is within 0–100 range for any input', () => {
    const report = generateAIReport([]);
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
  });

  it('score increases with more frequent recent workouts', () => {
    const sparse = [makeWorkout(20), makeWorkout(27)];
    const active = Array.from({ length: 12 }, (_, i) => makeWorkout(i * 2));
    const sparseReport = generateAIReport(sparse);
    const activeReport = generateAIReport(active);
    expect(activeReport.score).toBeGreaterThan(sparseReport.score);
  });

  it('detects inactivity when no workout in last 7 days', () => {
    const workouts = [makeWorkout(10), makeWorkout(14), makeWorkout(20)];
    const { recommendations } = generateAIReport(workouts);
    const inactivity = recommendations.find(r => r.id === 'inactivity');
    expect(inactivity).toBeDefined();
    expect(inactivity!.priority).toBe('high');
  });

  it('does NOT flag inactivity for a new user with zero workouts', () => {
    const { recommendations } = generateAIReport([]);
    expect(recommendations.find(r => r.id === 'inactivity')).toBeUndefined();
  });

  it('detects overtraining when 6+ workouts in last 7 days', () => {
    const workouts = Array.from({ length: 7 }, (_, i) => makeWorkout(i));
    const { recommendations } = generateAIReport(workouts);
    expect(recommendations.find(r => r.id === 'overtraining')).toBeDefined();
  });

  it('does NOT flag overtraining for 5 workouts per week', () => {
    const workouts = Array.from({ length: 5 }, (_, i) => makeWorkout(i));
    const { recommendations } = generateAIReport(workouts);
    expect(recommendations.find(r => r.id === 'overtraining')).toBeUndefined();
  });

  it('flags no-pull when only push muscles trained', () => {
    const workouts = Array.from({ length: 8 }, (_, i) =>
      makeWorkout(i * 2, ['chest', 'shoulders'])
    );
    const { recommendations } = generateAIReport(workouts);
    expect(recommendations.find(r => r.id === 'no-pull')).toBeDefined();
  });

  it('flags push-pull-imbalance when push:pull ratio > 2.5', () => {
    // 9 push sessions vs 2 pull sessions → ratio ~4.5
    const pushWorkouts = Array.from({ length: 9 }, (_, i) =>
      makeWorkout(i * 2, ['chest', 'shoulders', 'triceps'])
    );
    const pullWorkouts = Array.from({ length: 2 }, (_, i) =>
      makeWorkout(i * 5 + 1, ['back'])
    );
    const { recommendations } = generateAIReport([...pushWorkouts, ...pullWorkouts]);
    expect(recommendations.find(r => r.id === 'push-pull-imbalance')).toBeDefined();
  });

  it('detects missing leg day when no legs trained', () => {
    const workouts = Array.from({ length: 8 }, (_, i) =>
      makeWorkout(i * 2, ['chest', 'back', 'shoulders'])
    );
    const { recommendations } = generateAIReport(workouts);
    expect(recommendations.find(r => r.id === 'skip-leg-day')).toBeDefined();
  });

  it('does NOT flag skip-leg-day when quads are trained', () => {
    const workouts = Array.from({ length: 6 }, (_, i) =>
      makeWorkout(i * 3, ['chest', 'quads', 'back'])
    );
    const { recommendations } = generateAIReport(workouts);
    expect(recommendations.find(r => r.id === 'skip-leg-day')).toBeUndefined();
  });

  it('weekly plan always has exactly 7 days', () => {
    const { weeklyPlan } = generateAIReport([makeWorkout(1), makeWorkout(3)]);
    expect(weeklyPlan).toHaveLength(7);
  });

  it('each weekly plan day has required fields', () => {
    const { weeklyPlan } = generateAIReport([]);
    weeklyPlan.forEach(day => {
      expect(day).toHaveProperty('day');
      expect(day).toHaveProperty('type');
      expect(day).toHaveProperty('focus');
      expect(day).toHaveProperty('emoji');
      expect(['rest', 'light', 'moderate', 'hard']).toContain(day.intensity);
    });
  });

  it('every recommendation has required fields', () => {
    const workouts = [makeWorkout(10)]; // trigger inactivity
    const { recommendations } = generateAIReport(workouts);
    recommendations.forEach(rec => {
      expect(rec).toHaveProperty('id');
      expect(rec).toHaveProperty('title');
      expect(rec).toHaveProperty('reason');
      expect(['high', 'medium', 'low']).toContain(rec.priority);
      expect(rec).toHaveProperty('icon');
      expect(['recovery', 'progression', 'balance', 'consistency', 'technique']).toContain(rec.category);
    });
  });
});
