// ─────────────────────────────────────────────────────────────────────────────
// AI Workout Recommendation Engine (Rule-Based)
// Analyses user history → produces personalised weekly program suggestions.
// No external API needed — runs fully client-side.
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkoutEntry {
  id: string;
  name?: string;
  startTime: string;
  duration?: number;        // minutes
  exerciseSets?: Array<{
    exercise: { name: string; muscleGroup?: string };
    setNumber: number;
    reps?: number;
    weight?: number;
  }>;
}

export interface Recommendation {
  id: string;
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  category: 'recovery' | 'progression' | 'balance' | 'consistency' | 'technique';
  action?: string;          // CTA label
  actionRoute?: string;     // optional navigation target
}

export interface WeeklyPlan {
  day: string;
  type: string;
  focus: string;
  emoji: string;
  intensity: 'rest' | 'light' | 'moderate' | 'hard';
}

export interface AIReport {
  recommendations: Recommendation[];
  weeklyPlan: WeeklyPlan[];
  score: number;             // 0–100 "fitness score"
  scoreLabel: string;
  insights: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / 86_400_000;
}

function muscleFrequency(workouts: WorkoutEntry[]): Record<string, number> {
  const freq: Record<string, number> = {};
  workouts.forEach(w => {
    const muscles = new Set<string>();
    w.exerciseSets?.forEach(s => {
      const mg = (s.exercise.muscleGroup || '').toLowerCase();
      if (mg) muscles.add(mg);
    });
    muscles.forEach(m => { freq[m] = (freq[m] || 0) + 1; });
  });
  return freq;
}

function avgVolumePerSession(workouts: WorkoutEntry[]): number {
  if (!workouts.length) return 0;
  const total = workouts.reduce((sum, w) =>
    sum + (w.exerciseSets?.reduce((s, set) => s + ((set.reps || 0) * (set.weight || 0)), 0) || 0), 0);
  return total / workouts.length;
}

function workoutsInLast(workouts: WorkoutEntry[], days: number): WorkoutEntry[] {
  return workouts.filter(w => daysSince(w.startTime) <= days);
}

function personalRecords(workouts: WorkoutEntry[]): Record<string, number> {
  const prs: Record<string, number> = {};
  workouts.forEach(w => {
    w.exerciseSets?.forEach(s => {
      const name = s.exercise.name;
      const w1rm = (s.weight || 0) * (1 + (s.reps || 0) / 30); // Epley formula
      if (!prs[name] || w1rm > prs[name]) prs[name] = w1rm;
    });
  });
  return prs;
}

// ── Main Engine ───────────────────────────────────────────────────────────────

export function generateAIReport(allWorkouts: WorkoutEntry[]): AIReport {
  const recommendations: Recommendation[] = [];
  const insights: string[] = [];

  const recent7  = workoutsInLast(allWorkouts, 7);
  const recent30 = workoutsInLast(allWorkouts, 30);
  const recent14 = workoutsInLast(allWorkouts, 14);

  const freq30 = muscleFrequency(recent30);
  const avgVol = avgVolumePerSession(recent30);
  const prs    = personalRecords(allWorkouts);

  const lastWorkoutDate = allWorkouts.length
    ? allWorkouts.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0].startTime
    : null;
  const daysSinceLast = lastWorkoutDate ? daysSince(lastWorkoutDate) : 999;

  // ── Frequency Analysis ────────────────────────────────────────────────────

  const totalLast7 = recent7.length;
  const totalLast30 = recent30.length;

  if (totalLast7 === 0 && allWorkouts.length > 0) {
    recommendations.push({
      id: 'inactivity',
      title: 'Time to Get Back on Track',
      reason: `No workouts logged in the last 7 days. Consistency is the #1 driver of results.`,
      priority: 'high',
      icon: '🔥',
      category: 'consistency',
      action: 'Start Workout',
      actionRoute: '/workout',
    });
  } else if (totalLast7 >= 6) {
    recommendations.push({
      id: 'overtraining',
      title: 'Consider a Rest Day',
      reason: `You've trained ${totalLast7} days this week. Your muscles need 48h to recover — a rest day will improve your gains.`,
      priority: 'high',
      icon: '😴',
      category: 'recovery',
    });
    insights.push('High training frequency detected — recovery is part of the programme.');
  } else if (totalLast7 >= 4) {
    insights.push(`Solid week — ${totalLast7} sessions logged. You're building great consistency.`);
  }

  // ── Muscle Balance ────────────────────────────────────────────────────────

  const pushMuscles = (freq30.chest || 0) + (freq30.shoulders || 0) + (freq30.triceps || 0);
  const pullMuscles = (freq30.back || 0) + (freq30.biceps || 0);

  if (pushMuscles > 0 && pullMuscles === 0) {
    recommendations.push({
      id: 'no-pull',
      title: 'Add Pull Exercises',
      reason: 'You\'ve been doing push movements but no pull work. Imbalanced training leads to posture problems and injury risk.',
      priority: 'high',
      icon: '⚖️',
      category: 'balance',
      action: 'View Exercise Library',
      actionRoute: '/exercise-library',
    });
  } else if (pullMuscles > 0 && pushMuscles === 0) {
    recommendations.push({
      id: 'no-push',
      title: 'Add Push Exercises',
      reason: 'You\'ve been doing pull movements but no push work. Balance your programme with chest, shoulder and tricep work.',
      priority: 'high',
      icon: '⚖️',
      category: 'balance',
      action: 'View Exercise Library',
      actionRoute: '/exercise-library',
    });
  } else if (pushMuscles > 0 && pullMuscles > 0) {
    const ratio = pushMuscles / pullMuscles;
    if (ratio > 2.5) {
      recommendations.push({
        id: 'push-pull-imbalance',
        title: 'More Pulling Work Needed',
        reason: `Your push-to-pull ratio is ${ratio.toFixed(1)}:1. Ideal is 1:1 or 1:1.5 favouring pull for shoulder health.`,
        priority: 'medium',
        icon: '🔄',
        category: 'balance',
      });
    }
  }

  if (!(freq30.legs || freq30.quads || freq30.hamstrings) && totalLast30 >= 4) {
    recommendations.push({
      id: 'skip-leg-day',
      title: "Don't Skip Leg Day",
      reason: 'No leg work detected in the last 30 days. Legs are your largest muscle group — training them boosts testosterone and overall strength.',
      priority: 'medium',
      icon: '🦵',
      category: 'balance',
      action: 'Leg Workout Plans',
      actionRoute: '/workout-plans',
    });
  }

  if (!(freq30.core || freq30.abs) && totalLast30 >= 4) {
    recommendations.push({
      id: 'no-core',
      title: 'Core Work Missing',
      reason: 'A strong core improves performance in every lift and reduces lower back injury risk. Add 10 min of core work 2–3x per week.',
      priority: 'low',
      icon: '🎯',
      category: 'balance',
    });
  }

  // ── Progressive Overload ─────────────────────────────────────────────────

  const prCount = Object.keys(prs).length;
  if (prCount > 0 && recent14.length >= 3) {
    const recentExercises = new Set(recent14.flatMap(w =>
      w.exerciseSets?.map(s => s.exercise.name) || []
    ));
    const staleExercises = [...recentExercises].filter(name => {
      const lastSets = recent14.flatMap(w =>
        w.exerciseSets?.filter(s => s.exercise.name === name) || []
      );
      if (lastSets.length < 2) return false;
      const weights = lastSets.map(s => s.weight || 0).filter(Boolean);
      if (weights.length < 2) return false;
      return Math.max(...weights) === Math.min(...weights); // no weight increase
    });

    if (staleExercises.length >= 2) {
      recommendations.push({
        id: 'progressive-overload',
        title: 'Time to Add Weight',
        reason: `${staleExercises[0]} and ${staleExercises.length - 1} other exercise(s) haven't seen a weight increase in 2 weeks. Progressive overload is key to muscle growth.`,
        priority: 'medium',
        icon: '📈',
        category: 'progression',
      });
    }
  }

  // ── Volume Insights ───────────────────────────────────────────────────────

  if (avgVol > 5000) {
    insights.push(`High average volume: ${(avgVol / 1000).toFixed(1)}t per session — you're training hard.`);
  } else if (avgVol > 0 && avgVol < 1000) {
    recommendations.push({
      id: 'low-volume',
      title: 'Increase Training Volume',
      reason: `Your average session volume is ${avgVol.toFixed(0)} kg. Gradually increasing sets or weight will accelerate progress.`,
      priority: 'low',
      icon: '📊',
      category: 'progression',
    });
  }

  // ── Workout Duration ──────────────────────────────────────────────────────

  const avgDuration = recent30.length
    ? recent30.reduce((s, w) => s + (w.duration || 0), 0) / recent30.length
    : 0;

  if (avgDuration > 90) {
    recommendations.push({
      id: 'long-sessions',
      title: 'Shorten Your Sessions',
      reason: `Average session is ${Math.round(avgDuration)} min. After 60–75 min cortisol rises and performance drops. Focus on intensity over duration.`,
      priority: 'low',
      icon: '⏱️',
      category: 'technique',
    });
  }

  // ── Cardio ────────────────────────────────────────────────────────────────

  const cardioSessions = recent30.filter(w =>
    w.exerciseSets?.some(s => (s.exercise.muscleGroup || '').toLowerCase().includes('cardio'))
  ).length;

  if (cardioSessions === 0 && totalLast30 >= 6) {
    recommendations.push({
      id: 'no-cardio',
      title: 'Add Cardio for Heart Health',
      reason: 'No cardio detected in the last 30 days. 2–3 sessions of 20–30 min cardio per week improves endurance and recovery.',
      priority: 'low',
      icon: '❤️',
      category: 'balance',
    });
  }

  // ── Fitness Score ─────────────────────────────────────────────────────────

  let score = 50;

  // Frequency contribution (up to 20 pts)
  const weeklyFreq = totalLast7;
  if (weeklyFreq >= 3 && weeklyFreq <= 5) score += 20;
  else if (weeklyFreq === 2) score += 10;
  else if (weeklyFreq >= 6) score += 10; // slight penalty for overtraining risk
  else score -= 10;

  // Consistency contribution (up to 20 pts)
  const consistencyScore = Math.min((totalLast30 / 12) * 20, 20);
  score += consistencyScore;

  // Balance contribution (up to 10 pts)
  const muscleVariety = Object.keys(freq30).length;
  score += Math.min(muscleVariety * 2, 10);

  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  const scoreLabel =
    score >= 85 ? 'Elite' :
    score >= 70 ? 'Advanced' :
    score >= 55 ? 'Intermediate' :
    score >= 40 ? 'Beginner' : 'Just Starting';

  // ── Weekly Plan Generator ─────────────────────────────────────────────────

  const weeklyPlan: WeeklyPlan[] = buildWeeklyPlan(totalLast7);

  // ── General Insights ──────────────────────────────────────────────────────

  if (totalLast30 >= 12) insights.push('Excellent monthly consistency — you\'re in the top tier of users.');
  if (prCount >= 5) insights.push(`You have ${prCount} tracked personal records. Keep pushing those numbers!`);
  if (daysSinceLast < 1) insights.push('You worked out today — great dedication!');

  return {
    recommendations: recommendations.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    }),
    weeklyPlan,
    score,
    scoreLabel,
    insights,
  };
}

// ── Weekly Plan Builder ───────────────────────────────────────────────────────

function buildWeeklyPlan(recentFreq: number): WeeklyPlan[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Beginner: 3-day full body
  if (recentFreq <= 2) {
    return [
      { day: days[0], type: 'Full Body',    focus: 'Compound lifts',    emoji: '💪', intensity: 'moderate' },
      { day: days[1], type: 'Rest / Walk',  focus: 'Active recovery',   emoji: '🚶', intensity: 'light' },
      { day: days[2], type: 'Full Body',    focus: 'Strength focus',    emoji: '🏋️', intensity: 'hard' },
      { day: days[3], type: 'Rest',         focus: 'Recovery',          emoji: '😴', intensity: 'rest' },
      { day: days[4], type: 'Full Body',    focus: 'Volume day',        emoji: '🔥', intensity: 'moderate' },
      { day: days[5], type: 'Cardio',       focus: '30 min easy run',   emoji: '🏃', intensity: 'light' },
      { day: days[6], type: 'Rest',         focus: 'Complete rest',     emoji: '😴', intensity: 'rest' },
    ];
  }

  // Intermediate: Push / Pull / Legs
  if (recentFreq >= 3 && recentFreq <= 4) {
    return [
      { day: days[0], type: 'Push',         focus: 'Chest, Shoulders, Triceps', emoji: '💪', intensity: 'hard' },
      { day: days[1], type: 'Pull',         focus: 'Back & Biceps',             emoji: '🔙', intensity: 'hard' },
      { day: days[2], type: 'Legs',         focus: 'Quads, Hamstrings, Glutes', emoji: '🦵', intensity: 'hard' },
      { day: days[3], type: 'Rest',         focus: 'Recovery',                  emoji: '😴', intensity: 'rest' },
      { day: days[4], type: 'Upper',        focus: 'Compound upper body',       emoji: '🏋️', intensity: 'moderate' },
      { day: days[5], type: 'Lower + Core', focus: 'Legs & Abs',               emoji: '🔥', intensity: 'moderate' },
      { day: days[6], type: 'Rest / Cardio',focus: 'Active recovery',           emoji: '🚶', intensity: 'light' },
    ];
  }

  // Advanced: 6-day PPL x2
  return [
    { day: days[0], type: 'Push A',        focus: 'Strength — Bench & OHP',    emoji: '💪', intensity: 'hard' },
    { day: days[1], type: 'Pull A',        focus: 'Strength — Deadlift & Row', emoji: '🔙', intensity: 'hard' },
    { day: days[2], type: 'Legs A',        focus: 'Squat focus',               emoji: '🦵', intensity: 'hard' },
    { day: days[3], type: 'Push B',        focus: 'Hypertrophy — Chest & Tris',emoji: '🔥', intensity: 'moderate' },
    { day: days[4], type: 'Pull B',        focus: 'Hypertrophy — Back & Bis',  emoji: '💥', intensity: 'moderate' },
    { day: days[5], type: 'Legs B',        focus: 'Romanian DL & Hip focus',   emoji: '🦵', intensity: 'moderate' },
    { day: days[6], type: 'Rest',          focus: 'Complete rest',             emoji: '😴', intensity: 'rest' },
  ];
}
