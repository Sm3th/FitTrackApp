// Body score system — per-muscle-group scoring from workout history

export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'legs' | 'core' | 'cardio';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core', 'cardio',
];

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders',
  biceps: 'Biceps', triceps: 'Triceps', legs: 'Legs',
  core: 'Core', cardio: 'Cardio',
};

export const MUSCLE_EMOJI: Record<MuscleGroup, string> = {
  chest: '🫀', back: '🏋️', shoulders: '💪', biceps: '💪',
  triceps: '💪', legs: '🦵', core: '⚡', cardio: '❤️',
};

// Exercise name → muscle group mapping
const EXERCISE_MUSCLE_MAP: Record<string, MuscleGroup> = {
  // Chest
  bench: 'chest', 'bench press': 'chest', 'chest press': 'chest', 'push-up': 'chest',
  pushup: 'chest', 'push up': 'chest', 'chest fly': 'chest', fly: 'chest',
  'cable fly': 'chest', 'incline bench': 'chest', 'decline bench': 'chest',
  dip: 'chest', 'pec deck': 'chest',

  // Back
  'pull-up': 'back', pullup: 'back', 'pull up': 'back', 'chin-up': 'back',
  'lat pulldown': 'back', 'seated row': 'back', 'cable row': 'back',
  deadlift: 'back', 'bent over row': 'back', 'barbell row': 'back',
  't-bar row': 'back', 'single arm row': 'back', 'face pull': 'back',
  hyperextension: 'back', 'good morning': 'back',

  // Shoulders
  'overhead press': 'shoulders', 'shoulder press': 'shoulders', 'ohp': 'shoulders',
  'military press': 'shoulders', 'arnold press': 'shoulders', 'lateral raise': 'shoulders',
  'front raise': 'shoulders', 'rear delt': 'shoulders', 'upright row': 'shoulders',
  'shrug': 'shoulders',

  // Biceps
  'bicep curl': 'biceps', 'biceps curl': 'biceps', curl: 'biceps',
  'hammer curl': 'biceps', 'concentration curl': 'biceps', 'preacher curl': 'biceps',
  'cable curl': 'biceps', 'barbell curl': 'biceps',

  // Triceps
  tricep: 'triceps', 'skull crusher': 'triceps',
  'triceps pushdown': 'triceps', 'tricep extension': 'triceps', 'close grip bench': 'triceps',
  'overhead tricep': 'triceps', 'cable pushdown': 'triceps',

  // Legs
  squat: 'legs', 'leg press': 'legs', lunge: 'legs', 'leg extension': 'legs',
  'leg curl': 'legs', 'romanian deadlift': 'legs', 'rdl': 'legs', 'calf raise': 'legs',
  'hip thrust': 'legs', 'glute bridge': 'legs', 'sumo deadlift': 'legs',
  'hack squat': 'legs', 'front squat': 'legs', 'step up': 'legs', 'box jump': 'legs',

  // Core
  plank: 'core', crunch: 'core', situp: 'core', 'sit-up': 'core', 'sit up': 'core',
  'russian twist': 'core', 'leg raise': 'core', 'ab wheel': 'core', 'cable crunch': 'core',
  'mountain climber': 'core', 'hanging leg raise': 'core',

  // Cardio
  run: 'cardio', running: 'cardio', treadmill: 'cardio', cycling: 'cardio',
  bike: 'cardio', rowing: 'cardio', 'jump rope': 'cardio', hiit: 'cardio',
  cardio: 'cardio', elliptical: 'cardio', 'stair climber': 'cardio',
};

export function detectMuscleGroup(exerciseName: string): MuscleGroup {
  const lower = exerciseName.toLowerCase();

  // Direct match
  if (EXERCISE_MUSCLE_MAP[lower]) return EXERCISE_MUSCLE_MAP[lower];

  // Substring match
  for (const [keyword, muscle] of Object.entries(EXERCISE_MUSCLE_MAP)) {
    if (lower.includes(keyword)) return muscle;
  }

  // Fallback keywords
  if (lower.includes('press') || lower.includes('fly')) return 'chest';
  if (lower.includes('row') || lower.includes('pull')) return 'back';
  if (lower.includes('curl')) return 'biceps';
  if (lower.includes('squat') || lower.includes('leg')) return 'legs';
  if (lower.includes('core') || lower.includes('ab')) return 'core';

  return 'core'; // default
}

export interface MuscleScore {
  muscle: MuscleGroup;
  totalSets: number;
  score: number; // 0–100 normalized
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  color: string;
  lastTrained?: string; // ISO date
}

export interface BodyScores {
  scores: Record<MuscleGroup, MuscleScore>;
  overallScore: number;
  lastUpdated: string;
}

const GRADE_THRESHOLDS = [
  { min: 90, grade: 'S' as const, color: '#f59e0b' },
  { min: 75, grade: 'A' as const, color: '#22c55e' },
  { min: 55, grade: 'B' as const, color: '#3b82f6' },
  { min: 35, grade: 'C' as const, color: '#8b5cf6' },
  { min: 15, grade: 'D' as const, color: '#f97316' },
  { min: 0,  grade: 'F' as const, color: '#ef4444' },
];

function gradeFromScore(score: number): { grade: MuscleScore['grade']; color: string } {
  for (const t of GRADE_THRESHOLDS) {
    if (score >= t.min) return { grade: t.grade, color: t.color };
  }
  return { grade: 'F', color: '#ef4444' };
}

export interface WorkoutSet {
  exerciseName: string;
  reps?: number;
  weight?: number;
  timestamp?: string;
}

export function calculateBodyScores(recentSets: WorkoutSet[]): BodyScores {
  // Count sets per muscle over the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const setCounts: Record<MuscleGroup, number> = {
    chest: 0, back: 0, shoulders: 0, biceps: 0,
    triceps: 0, legs: 0, core: 0, cardio: 0,
  };

  const lastTrained: Record<MuscleGroup, string | undefined> = {
    chest: undefined, back: undefined, shoulders: undefined, biceps: undefined,
    triceps: undefined, legs: undefined, core: undefined, cardio: undefined,
  };

  recentSets.forEach(s => {
    const muscle = detectMuscleGroup(s.exerciseName);
    setCounts[muscle]++;
    if (s.timestamp) {
      const curr = lastTrained[muscle];
      if (!curr || s.timestamp > curr) lastTrained[muscle] = s.timestamp;
    }
  });

  // Recommended sets per muscle per week for "full balance": ~12–20 sets/week
  // Over 30 days that's ~36 sets per muscle for perfect score
  const TARGET_SETS = 36;

  const scores: Record<MuscleGroup, MuscleScore> = {} as Record<MuscleGroup, MuscleScore>;
  let totalScore = 0;

  MUSCLE_GROUPS.forEach(muscle => {
    const sets = setCounts[muscle];
    const rawScore = Math.min(Math.round((sets / TARGET_SETS) * 100), 100);
    const { grade, color } = gradeFromScore(rawScore);
    scores[muscle] = {
      muscle,
      totalSets: sets,
      score: rawScore,
      grade,
      color,
      lastTrained: lastTrained[muscle],
    };
    totalScore += rawScore;
  });

  return {
    scores,
    overallScore: Math.round(totalScore / MUSCLE_GROUPS.length),
    lastUpdated: new Date().toISOString(),
  };
}

// Load persisted workout sets from localStorage history
export function loadWorkoutSetsFromHistory(): WorkoutSet[] {
  try {
    const raw = localStorage.getItem('workout_sets_history');
    if (!raw) return [];
    return JSON.parse(raw) as WorkoutSet[];
  } catch {
    return [];
  }
}

// Save new sets to history (call after each workout)
export function appendWorkoutSets(sets: WorkoutSet[]): void {
  const existing = loadWorkoutSetsFromHistory();
  const now = new Date().toISOString();
  const tagged = sets.map(s => ({ ...s, timestamp: s.timestamp || now }));
  // Keep max 1000 entries
  const combined = [...existing, ...tagged].slice(-1000);
  localStorage.setItem('workout_sets_history', JSON.stringify(combined));
}

// Calculate overall body score for a specific date window
export function getOverallScoreForPeriod(
  allSets: WorkoutSet[],
  periodStart: Date,
  periodEnd: Date,
  targetSetsPerMuscle = 12,
): number {
  const inPeriod = allSets.filter(s => {
    if (!s.timestamp) return false;
    const d = new Date(s.timestamp);
    return d >= periodStart && d < periodEnd;
  });

  const counts: Record<MuscleGroup, number> = {
    chest: 0, back: 0, shoulders: 0, biceps: 0,
    triceps: 0, legs: 0, core: 0, cardio: 0,
  };
  inPeriod.forEach(s => { counts[detectMuscleGroup(s.exerciseName)]++; });

  let total = 0;
  MUSCLE_GROUPS.forEach(m => {
    total += Math.min(Math.round((counts[m] / targetSetsPerMuscle) * 100), 100);
  });
  return Math.round(total / MUSCLE_GROUPS.length);
}

// Get sets per muscle group for the past 7 days
export function getWeeklyMuscleActivity(): Record<MuscleGroup, number> {
  const sets = loadWorkoutSetsFromHistory();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const counts: Record<MuscleGroup, number> = {
    chest: 0, back: 0, shoulders: 0, biceps: 0,
    triceps: 0, legs: 0, core: 0, cardio: 0,
  };

  sets.forEach(s => {
    if (!s.timestamp || new Date(s.timestamp) < cutoff) return;
    counts[detectMuscleGroup(s.exerciseName)]++;
  });

  return counts;
}
