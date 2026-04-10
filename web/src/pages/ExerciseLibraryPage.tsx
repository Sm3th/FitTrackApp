import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useDebounce } from '../hooks/useDebounce';
import Navbar from '../components/Navbar';
import apiClient from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment: string;
  description: string;
  tips: string[];
  icon: string;
}

const EXERCISES: Exercise[] = [
  // Chest
  { id: '1', name: 'Barbell Bench Press', muscleGroup: 'Chest', difficulty: 'Intermediate', equipment: 'Barbell + Bench', icon: '🏋️',
    description: 'The king of chest exercises. Lie on a flat bench, grip the bar slightly wider than shoulder-width, lower to chest, and press up explosively.',
    tips: ['Keep your feet flat on the floor', 'Maintain a slight arch in your lower back', 'Squeeze your chest at the top of the movement'] },
  { id: '2', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', difficulty: 'Intermediate', equipment: 'Dumbbells + Incline Bench', icon: '🏋️',
    description: 'Targets the upper chest. Set bench to 30–45°, press dumbbells up from chest level, controlling the descent.',
    tips: ['Keep elbows at about 45° from your torso', 'Don\'t let dumbbells drift too far back', 'Full stretch at the bottom for maximum activation'] },
  { id: '3', name: 'Push-Up', muscleGroup: 'Chest', difficulty: 'Beginner', equipment: 'Bodyweight', icon: '💪',
    description: 'A fundamental bodyweight exercise. Start in a high plank, lower your chest to the floor, then push back up.',
    tips: ['Keep your body in a straight line from head to heels', 'Tuck elbows slightly to protect shoulders', 'Full range of motion — chest nearly touches floor'] },
  { id: '4', name: 'Cable Fly', muscleGroup: 'Chest', difficulty: 'Intermediate', equipment: 'Cable Machine', icon: '🔗',
    description: 'Isolates the chest with constant tension. Set cables at shoulder height, bring handles together in a wide arc.',
    tips: ['Keep a slight bend in your elbows throughout', 'Think of hugging a giant tree', 'Control the eccentric (opening) phase'] },
  { id: '5', name: 'Dips', muscleGroup: 'Chest', difficulty: 'Intermediate', equipment: 'Parallel Bars', icon: '⬇️',
    description: 'A compound movement hitting chest and triceps. Lean forward for more chest emphasis, stay upright for triceps.',
    tips: ['Lean forward 15–30° for chest focus', 'Lower until upper arms are parallel to floor', 'Avoid locking out fully at the top'] },
  // Back
  { id: '6', name: 'Pull-Up', muscleGroup: 'Back', difficulty: 'Intermediate', equipment: 'Pull-Up Bar', icon: '⬆️',
    description: 'The best bodyweight back builder. Pull your chin over the bar from a dead hang, using a pronated grip.',
    tips: ['Depress your shoulder blades before pulling', 'Lead with your chest to the bar', 'Full hang at the bottom for lat stretch'] },
  { id: '7', name: 'Barbell Row', muscleGroup: 'Back', difficulty: 'Intermediate', equipment: 'Barbell', icon: '🏋️',
    description: 'Hinge at hips to 45°, grip the bar, and pull it to your lower abdomen. One of the best mass builders for back.',
    tips: ['Keep your lower back neutral — no rounding', 'Pull elbows back, not out to sides', 'Hold the contracted position for 1 second'] },
  { id: '8', name: 'Lat Pulldown', muscleGroup: 'Back', difficulty: 'Beginner', equipment: 'Cable Machine', icon: '🔗',
    description: 'Great for beginners building pull strength. Pull the bar to your collarbone with a wide or shoulder-width grip.',
    tips: ['Lean back slightly — about 15°', 'Pull with your elbows, not your biceps', 'Control the bar on the way back up'] },
  { id: '9', name: 'Deadlift', muscleGroup: 'Back', difficulty: 'Advanced', equipment: 'Barbell', icon: '🏆',
    description: 'The ultimate full-body compound lift. Drive through the floor to lift the bar from ground to hip level.',
    tips: ['Hinge at hips and push the floor away', 'Keep the bar dragging against your legs', 'Never round your lumbar spine under load'] },
  { id: '10', name: 'Seated Cable Row', muscleGroup: 'Back', difficulty: 'Beginner', equipment: 'Cable Machine', icon: '🔗',
    description: 'Pull the cable handle to your abdomen while sitting upright. Great for mid-back thickness.',
    tips: ['Keep torso stationary — no swinging', 'Retract shoulder blades at full contraction', 'Pause briefly at the end of each rep'] },
  // Shoulders
  { id: '11', name: 'Overhead Press', muscleGroup: 'Shoulders', difficulty: 'Intermediate', equipment: 'Barbell', icon: '🏋️',
    description: 'Press the bar overhead from a front rack position. Builds massive shoulder and upper chest strength.',
    tips: ['Keep your core braced tight', 'Press in a slight arc, not perfectly vertical', 'Avoid hyperextending your lower back'] },
  { id: '12', name: 'Dumbbell Lateral Raise', muscleGroup: 'Shoulders', difficulty: 'Beginner', equipment: 'Dumbbells', icon: '↔️',
    description: 'Raise dumbbells out to your sides to develop the medial deltoid for wider-looking shoulders.',
    tips: ['Lead with your elbows, not your hands', 'Don\'t use momentum — slow and controlled', 'Keep a slight bend in the elbows'] },
  { id: '13', name: 'Face Pull', muscleGroup: 'Shoulders', difficulty: 'Beginner', equipment: 'Cable Machine', icon: '🔗',
    description: 'Pull a rope attachment toward your face to work rear deltoids and external rotators. Essential for shoulder health.',
    tips: ['Set the cable at upper chest or head height', 'Pull rope to face and flare elbows out', 'Great for posture and injury prevention'] },
  { id: '14', name: 'Arnold Press', muscleGroup: 'Shoulders', difficulty: 'Intermediate', equipment: 'Dumbbells', icon: '💪',
    description: 'Start with palms facing you, rotate hands outward as you press up. Hits all three deltoid heads.',
    tips: ['Start palms facing your face', 'Rotate externally as you press to the top', 'Full range of motion for maximum shoulder activation'] },
  // Biceps
  { id: '15', name: 'Barbell Curl', muscleGroup: 'Biceps', difficulty: 'Beginner', equipment: 'Barbell', icon: '💪',
    description: 'Classic mass builder for the biceps. Stand with barbell at thigh height, curl to shoulder level.',
    tips: ['Keep elbows fixed at your sides', 'Supinate your wrist at the top for a peak contraction', 'Lower the bar slowly — 2–3 seconds down'] },
  { id: '16', name: 'Hammer Curl', muscleGroup: 'Biceps', difficulty: 'Beginner', equipment: 'Dumbbells', icon: '🔨',
    description: 'Neutral grip curl that works the brachialis and brachioradialis muscles as well as the biceps.',
    tips: ['Keep palms facing each other throughout', 'Don\'t swing — isolate the arm', 'Works the long head of the bicep and forearm'] },
  { id: '17', name: 'Incline Dumbbell Curl', muscleGroup: 'Biceps', difficulty: 'Intermediate', equipment: 'Dumbbells + Incline Bench', icon: '📐',
    description: 'Performed on an incline bench to stretch the long head of the bicep maximally, creating a longer range of motion.',
    tips: ['Let arms hang straight down at the bottom', 'Don\'t let shoulders roll forward', 'Excellent for creating bicep peak'] },
  // Triceps
  { id: '18', name: 'Close-Grip Bench Press', muscleGroup: 'Triceps', difficulty: 'Intermediate', equipment: 'Barbell + Bench', icon: '🏋️',
    description: 'A narrower grip bench press that puts the emphasis on the triceps rather than the chest.',
    tips: ['Hands shoulder-width apart — not too narrow', 'Keep elbows tucked to your sides', 'Great for adding tricep mass'] },
  { id: '19', name: 'Tricep Rope Pushdown', muscleGroup: 'Triceps', difficulty: 'Beginner', equipment: 'Cable Machine', icon: '🔗',
    description: 'The most popular tricep isolation exercise. Push the rope attachment down to full extension.',
    tips: ['Keep upper arms locked to your sides', 'Spread the rope at the bottom for extra contraction', 'Use a full range of motion'] },
  { id: '20', name: 'Skull Crusher', muscleGroup: 'Triceps', difficulty: 'Intermediate', equipment: 'EZ-Bar + Bench', icon: '💀',
    description: 'Lower the bar toward your forehead while lying on a bench, then extend your arms back to start.',
    tips: ['Keep upper arms perpendicular to floor', 'Control the descent — the name says it all', 'Use an EZ-bar for wrist comfort'] },
  { id: '21', name: 'Tricep Dip', muscleGroup: 'Triceps', difficulty: 'Beginner', equipment: 'Parallel Bars / Bench', icon: '⬇️',
    description: 'Push yourself up and down between two parallel bars or on a bench. Stay upright for tricep focus.',
    tips: ['Keep torso upright for tricep emphasis', 'Don\'t flare elbows too wide', 'Add weight with a belt when bodyweight becomes easy'] },
  // Legs
  { id: '22', name: 'Barbell Squat', muscleGroup: 'Legs', difficulty: 'Intermediate', equipment: 'Barbell + Rack', icon: '🏋️',
    description: 'The king of all exercises. Bar on upper back, squat to parallel or below, then drive through the floor to stand.',
    tips: ['Keep chest tall and knees tracking over toes', 'Break parallel for full glute activation', 'Take a deep breath and brace before descending'] },
  { id: '23', name: 'Romanian Deadlift', muscleGroup: 'Legs', difficulty: 'Intermediate', equipment: 'Barbell / Dumbbells', icon: '🏋️',
    description: 'Hinge-based movement that powerfully targets the hamstrings and glutes. Lower the bar with a slight knee bend.',
    tips: ['Push your hips back, not down', 'Keep bar close to legs throughout', 'Feel the hamstring stretch at the bottom'] },
  { id: '24', name: 'Leg Press', muscleGroup: 'Legs', difficulty: 'Beginner', equipment: 'Leg Press Machine', icon: '🦵',
    description: 'A machine-based squat alternative that allows heavy loading with reduced spinal stress.',
    tips: ['Don\'t lock knees out at the top', 'Keep lower back pressed against pad', 'Foot placement determines muscle emphasis'] },
  { id: '25', name: 'Bulgarian Split Squat', muscleGroup: 'Legs', difficulty: 'Advanced', equipment: 'Dumbbells + Bench', icon: '🦵',
    description: 'Rear foot elevated single-leg squat. Brutally effective for quads and glutes.',
    tips: ['Keep front foot far enough forward', 'Drive through the heel of the front foot', 'One of the best unilateral leg exercises'] },
  { id: '26', name: 'Leg Curl', muscleGroup: 'Legs', difficulty: 'Beginner', equipment: 'Leg Curl Machine', icon: '🦵',
    description: 'Isolation exercise for the hamstrings. Curl the pad toward your glutes in a controlled manner.',
    tips: ['Perform slowly — especially the lowering phase', 'Fully extend at the bottom for full stretch', 'Keep hips down on the pad'] },
  { id: '27', name: 'Calf Raise', muscleGroup: 'Legs', difficulty: 'Beginner', equipment: 'Machine / Bodyweight', icon: '🦵',
    description: 'Rise up onto your toes against resistance to work the gastrocnemius and soleus.',
    tips: ['Full range of motion — full stretch at bottom', 'Pause at the top and squeeze', 'High reps (15–25) work well for calves'] },
  { id: '28', name: 'Walking Lunge', muscleGroup: 'Legs', difficulty: 'Beginner', equipment: 'Bodyweight / Dumbbells', icon: '🚶',
    description: 'Step forward into a lunge, lowering your back knee toward the floor, then step through with the back foot.',
    tips: ['Keep your torso upright throughout', 'Front knee should not go past your toes', 'Great for quad development and balance'] },
  // Core
  { id: '29', name: 'Plank', muscleGroup: 'Core', difficulty: 'Beginner', equipment: 'Bodyweight', icon: '🏄',
    description: 'Hold a push-up position on your forearms, maintaining a straight line from head to heels.',
    tips: ['Don\'t let hips sag or pike up', 'Squeeze your glutes and brace your abs', 'Work up to 60–90 second holds'] },
  { id: '30', name: 'Hanging Leg Raise', muscleGroup: 'Core', difficulty: 'Intermediate', equipment: 'Pull-Up Bar', icon: '⬆️',
    description: 'Hang from a bar and raise your legs to horizontal or above. Intense lower ab and hip flexor exercise.',
    tips: ['Control the descent — don\'t swing', 'Posterior pelvic tilt at the top for more ab activation', 'Bent knees for easier variation'] },
  { id: '31', name: 'Russian Twist', muscleGroup: 'Core', difficulty: 'Beginner', equipment: 'Bodyweight / Weight Plate', icon: '🔄',
    description: 'Sit at 45°, lift feet off the floor, and rotate torso side to side. Targets the obliques.',
    tips: ['Keep spine neutral — don\'t round it', 'Add a weight plate or medicine ball for progression', 'Rotate from the torso, not just the arms'] },
  { id: '32', name: 'Cable Crunch', muscleGroup: 'Core', difficulty: 'Intermediate', equipment: 'Cable Machine', icon: '🔗',
    description: 'Kneel in front of a high cable with a rope attachment and crunch downward against resistance.',
    tips: ['Round your spine — don\'t just bend your hips', 'Controlled movement in both directions', 'Allows heavy progressive overload for abs'] },
  // Cardio
  { id: '33', name: 'Burpee', muscleGroup: 'Cardio', difficulty: 'Intermediate', equipment: 'Bodyweight', icon: '⚡',
    description: 'Drop to a push-up, perform the push-up, jump feet to hands, then jump up explosively. Full-body conditioning.',
    tips: ['Modify by stepping instead of jumping if needed', 'Keep your core tight throughout', 'Perfect for HIIT or as workout finisher'] },
  { id: '34', name: 'Jump Rope', muscleGroup: 'Cardio', difficulty: 'Beginner', equipment: 'Jump Rope', icon: '🪃',
    description: 'Classic cardio tool that burns calories, improves coordination, and builds calf strength.',
    tips: ['Land softly on the balls of your feet', 'Keep elbows close to your sides', 'Start with 30-second intervals and build up'] },
  { id: '35', name: 'Mountain Climbers', muscleGroup: 'Cardio', difficulty: 'Beginner', equipment: 'Bodyweight', icon: '⛰️',
    description: 'Start in a plank and drive knees to chest alternately as fast as possible. Cardio and core combined.',
    tips: ['Keep hips level — don\'t bounce them', 'The faster you go, the more cardio benefit', 'Can be done slow for core focus or fast for cardio'] },
  { id: '36', name: 'Box Jump', muscleGroup: 'Cardio', difficulty: 'Intermediate', equipment: 'Plyo Box', icon: '📦',
    description: 'Jump from the floor onto a box. Builds explosive lower-body power and burns calories.',
    tips: ['Land softly with knees bent', 'Step down — don\'t jump down', 'Start with a lower box and build height gradually'] },
];

const MUSCLE_GROUP_KEYS = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Cardio'] as const;
const DIFFICULTY_KEYS = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const;

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const MUSCLE_COLORS: Record<string, string> = {
  Chest: 'bg-red-500', Back: 'bg-blue-500', Shoulders: 'bg-purple-500',
  Biceps: 'bg-orange-500', Triceps: 'bg-pink-500', Legs: 'bg-green-500',
  Core: 'bg-yellow-500', Cardio: 'bg-cyan-500',
};

interface PRDataPoint { date: string; weight: number; reps: number; }

// ── Exercise Detail Content (shared between sidebar + mobile modal) ─────────
interface DetailProps {
  exercise: Exercise;
  prData: PRDataPoint[];
  prLoading: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: TFunction<'translation', undefined>;
}

const ExerciseDetailContent = React.memo<DetailProps>(({ exercise, prData, prLoading, isLoggedIn, onClose, t: tFunc }) => {
  const t = tFunc as (key: string, fallback?: string) => string;
  const pr = prData.length > 0 ? Math.max(...prData.map(d => d.weight)) : null;
  return (
    <div className="list-card p-6 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${MUSCLE_COLORS[exercise.muscleGroup] || 'bg-gray-400'} rounded-xl flex items-center justify-center text-2xl`}>
          {exercise.icon}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl transition-colors">✕</button>
      </div>

      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{exercise.name}</h2>
      <div className="flex gap-2 mb-4">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[exercise.difficulty]}`}>
          {exercise.difficulty}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
          {exercise.muscleGroup}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          🏋️ {t('library.equipment')}
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">{exercise.equipment}</p>
      </div>

      <div className="mb-5">
        <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          📖 {t('library.howTo')}
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{exercise.description}</p>
      </div>

      <div className="mb-5">
        <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          💡 {t('library.proTips')}
        </div>
        <ul className="space-y-2">
          {exercise.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-orange-500 font-bold shrink-0">{i + 1}.</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* PR History */}
      {isLoggedIn && (
        <div className="border-t border-gray-100 dark:border-slate-800 pt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">🏆 Personal Record</div>
            {pr && <span className="text-sm font-black text-orange-500">{pr} kg</span>}
          </div>
          {prLoading ? (
            <div className="h-24 flex items-center justify-center">
              <svg className="w-5 h-5 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
          ) : prData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={prData} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(249,115,22,0.08)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                  itemStyle={{ color: '#fdba74' }}
                  formatter={(v: number) => [`${v} kg`, 'Best set']} />
                <Line type="monotone" dataKey="weight" stroke="#f97316" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive animationDuration={800} animationEasing="ease-out" />
              </LineChart>
            </ResponsiveContainer>
          ) : prData.length === 1 ? (
            <div className="text-center py-4 text-sm text-gray-400">
              <div className="text-2xl mb-1">🌱</div>
              <p>First set logged: <strong className="text-orange-500">{prData[0].weight} kg × {prData[0].reps}</strong></p>
              <p className="text-xs mt-1">Log more sessions to see progress</p>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-gray-400 dark:text-slate-500">
              No sets logged yet — start a workout to track your progress
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ── Page ──────────────────────────────────────────────────────────────────────
const ExerciseLibraryPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'difficulty' | 'muscle'>('name');

  const muscleLabel = (key: string) => key === 'All' ? t('library.allMuscles') : t(`library.${key.toLowerCase()}` as any, key);
  const difficultyLabel = (key: string) => {
    if (key === 'All') return t('library.allMuscles');
    return t(`library.${key.toLowerCase()}` as any, key);
  };
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [prData, setPrData] = useState<PRDataPoint[]>([]);
  const [prLoading, setPrLoading] = useState(false);
  const isLoggedIn = !!localStorage.getItem('token');

  const fetchPRHistory = useCallback(async (exerciseName: string) => {
    if (!isLoggedIn) return;
    try {
      setPrLoading(true);
      const res = await apiClient.get('/workouts/sessions');
      const sessions: any[] = res.data.data || [];
      const points: PRDataPoint[] = [];
      for (const session of sessions) {
        for (const set of (session.exerciseSets || [])) {
          const name: string = set.exercise?.name || set.exerciseName || '';
          if (name.toLowerCase() === exerciseName.toLowerCase() && set.weight && set.reps) {
            points.push({
              date: new Date(session.startTime).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
              weight: set.weight,
              reps: set.reps,
            });
          }
        }
      }
      // Keep best set per date (max weight)
      const byDate = new Map<string, PRDataPoint>();
      for (const p of points) {
        const existing = byDate.get(p.date);
        if (!existing || p.weight > existing.weight) byDate.set(p.date, p);
      }
      setPrData([...byDate.values()].slice(-10));
    } catch { setPrData([]); } finally { setPrLoading(false); }
  }, [isLoggedIn]);

  useEffect(() => {
    if (selectedExercise) fetchPRHistory(selectedExercise.name);
    else setPrData([]);
  }, [selectedExercise, fetchPRHistory]);

  const debouncedSearch = useDebounce(searchQuery, 200);

  const DIFFICULTY_ORDER = { beginner: 0, intermediate: 1, advanced: 2 };

  const filtered = useMemo(() => {
    const results = EXERCISES.filter(e => {
      const matchesSearch = !debouncedSearch || e.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || e.description.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesMuscle = muscleFilter === 'All' || e.muscleGroup === muscleFilter;
      const matchesDifficulty = difficultyFilter === 'All' || e.difficulty === difficultyFilter;
      return matchesSearch && matchesMuscle && matchesDifficulty;
    });
    if (sortBy === 'difficulty') {
      results.sort((a, b) => (DIFFICULTY_ORDER[a.difficulty as keyof typeof DIFFICULTY_ORDER] || 0) - (DIFFICULTY_ORDER[b.difficulty as keyof typeof DIFFICULTY_ORDER] || 0));
    } else if (sortBy === 'muscle') {
      results.sort((a, b) => a.muscleGroup.localeCompare(b.muscleGroup));
    } else {
      results.sort((a, b) => a.name.localeCompare(b.name));
    }
    return results;
  }, [debouncedSearch, muscleFilter, difficultyFilter, sortBy]);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Header */}
      <div className="relative bg-slate-950 overflow-hidden py-8 sm:py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-orange-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-amber-400 text-sm font-semibold uppercase tracking-wide mb-2">{t('library.reference')}</p>
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">{t('library.title')}</h1>
          <p className="text-white/40 text-sm">{EXERCISES.length} {t('library.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5 sm:py-8 sm:px-6 lg:px-8">
        {/* Search + Filters */}
        <div className="list-card p-5 mb-6 space-y-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('library.searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-400 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
            )}
          </div>

          {/* Muscle Group Tabs */}
          <div className="flex flex-wrap gap-2">
            {MUSCLE_GROUP_KEYS.map(mg => (
              <button
                key={mg}
                onClick={() => setMuscleFilter(mg)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  muscleFilter === mg
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {muscleLabel(mg)}
              </button>
            ))}
          </div>

          {/* Difficulty + Sort row */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {DIFFICULTY_KEYS.map(d => (
                <button
                  key={d}
                  onClick={() => setDifficultyFilter(d)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    difficultyFilter === d
                      ? 'bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {difficultyLabel(d)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">Sort:</span>
              {(['name', 'muscle', 'difficulty'] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    sortBy === s ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
                  }`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t('library.showing', { count: filtered.length, total: EXERCISES.length })}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exercise Cards */}
          <div className={`space-y-3 ${selectedExercise ? 'lg:col-span-2' : 'lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 space-y-0'}`}>
            {filtered.length === 0 ? (
              <div className="col-span-3 text-center py-16 text-gray-400 dark:text-gray-500">
                <div className="text-5xl mb-3">🔍</div>
                <p>{t('library.noResults')}</p>
              </div>
            ) : (
              filtered.map(exercise => (
                <div
                  key={exercise.id}
                  onClick={() => setSelectedExercise(selectedExercise?.id === exercise.id ? null : exercise)}
                  className={`bg-white dark:bg-slate-900 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md border-2 ${
                    selectedExercise?.id === exercise.id
                      ? 'border-orange-400'
                      : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 ${MUSCLE_COLORS[exercise.muscleGroup] || 'bg-gray-400'} rounded-xl flex items-center justify-center text-xl shrink-0`}>
                      {exercise.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{exercise.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{exercise.muscleGroup} · {exercise.equipment}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${DIFFICULTY_COLORS[exercise.difficulty]}`}>
                      {exercise.difficulty}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail Panel — desktop sidebar */}
          {selectedExercise && (
            <div className="hidden lg:block lg:col-span-1">
              <ExerciseDetailContent
                exercise={selectedExercise}
                prData={prData}
                prLoading={prLoading}
                isLoggedIn={isLoggedIn}
                onClose={() => setSelectedExercise(null)}
                t={t}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile modal */}
      {selectedExercise && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedExercise(null)} />
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-3xl max-h-[90vh] overflow-y-auto animate-fade-up">
            <div className="sticky top-0 bg-white dark:bg-slate-900 px-5 py-3 flex items-center justify-between border-b border-gray-100 dark:border-slate-800 z-10">
              <div className="w-10 h-1 bg-gray-300 dark:bg-slate-700 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
              <div className="w-8 h-8" />
              <button onClick={() => setSelectedExercise(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">✕</button>
            </div>
            <div className="p-5">
              <ExerciseDetailContent
                exercise={selectedExercise}
                prData={prData}
                prLoading={prLoading}
                isLoggedIn={isLoggedIn}
                onClose={() => setSelectedExercise(null)}
                t={t}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseLibraryPage;
