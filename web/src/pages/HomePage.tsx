import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Navbar from '../components/Navbar';
import { useCountUp } from '../hooks/useCountUp';
import { useTranslation } from 'react-i18next';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { calculateBodyScores, loadWorkoutSetsFromHistory, MuscleGroup, MUSCLE_EMOJI, getWeeklyMuscleActivity } from '../utils/bodyScore';
import { getLevelFromXP, getTotalXP } from '../utils/xpSystem';

const MUSCLE_EXERCISES: Record<MuscleGroup, string[]> = {
  chest: ['Bench Press', 'Push-Up', 'Cable Fly'],
  back: ['Pull-Up', 'Barbell Row', 'Lat Pulldown'],
  shoulders: ['Overhead Press', 'Lateral Raise', 'Arnold Press'],
  biceps: ['Barbell Curl', 'Hammer Curl', 'Preacher Curl'],
  triceps: ['Skull Crusher', 'Triceps Pushdown', 'Dips'],
  legs: ['Squat', 'Romanian Deadlift', 'Leg Press'],
  core: ['Plank', 'Hanging Leg Raise', 'Ab Wheel'],
  cardio: ['Treadmill Run', 'Jump Rope', 'Rowing Machine'],
};


const features = [
  { icon: '🔥', title: 'Guided Workouts',   desc: 'Follow professionally designed plans with built-in timers.' },
  { icon: '📊', title: 'Progress Tracking', desc: 'Monitor strength gains, volume, and personal records.' },
  { icon: '🏆', title: 'Achievements',      desc: 'Unlock badges and celebrate every milestone you reach.' },
  { icon: '⏱️', title: 'Smart Timers',      desc: 'Auto rest timers keep your workouts efficient.' },
  { icon: '📈', title: 'Analytics',         desc: 'Charts and graphs that visualize your full fitness journey.' },
  { icon: '📚', title: 'Exercise Library',  desc: '36+ exercises with instructions, tips, and muscle breakdowns.' },
];

const getTodayKey = () => new Date().toISOString().slice(0, 10);

// ── Animated ring for today's metrics ────────────────────────────────────────
const TodayRing = React.memo<{ pct: number; color: string; trackColor: string; label: string }>(({
  pct, color, trackColor, label,
}) => {
  const size = 56;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  // Start from 0, transition to actual pct via CSS
  return (
    <div className="flex-shrink-0 relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1) 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-black tabular-nums" style={{ color }}>{label}</span>
      </div>
    </div>
  );
});

const getTodayCalories = (): number => {
  try {
    const entries: { calories: number }[] = JSON.parse(localStorage.getItem(`nutrition_${getTodayKey()}`) || '[]');
    return entries.reduce((s, e) => s + e.calories, 0);
  } catch { return 0; }
};

const getCalorieStreak = (): number => {
  try {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `nutrition_${d.toISOString().slice(0, 10)}`;
      const entries: { calories: number }[] = JSON.parse(localStorage.getItem(key) || '[]');
      const cal = entries.reduce((s, e) => s + e.calories, 0);
      if (cal > 0) streak++;
      else if (i > 0) break; // allow today to be 0 without breaking
    }
    return streak;
  } catch { return 0; }
};

const getTodayWater = (): { current: number; goal: number } => {
  try {
    const data = JSON.parse(localStorage.getItem('waterIntake') || '{}');
    const todayData = data[getTodayKey()];
    if (!todayData) return { current: 0, goal: 2000 };
    const current = (todayData.entries || []).reduce((s: number, e: { amount: number }) => s + e.amount, 0);
    return { current, goal: todayData.goal || 2000 };
  } catch { return { current: 0, goal: 2000 }; }
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');
  const [stats, setStats] = useState({ totalWorkouts: 0, totalSets: 0, currentStreak: 0 });
  const [loading, setLoading] = useState(false);
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayWater, setTodayWater] = useState({ current: 0, goal: 8 });
  const [calorieStreak, setCalorieStreak] = useState(0);
  const [lastWorkout, setLastWorkout] = useState<{ name: string; date: string; sets: number } | null>(null);
  const [weeklyStats, setWeeklyStats] = useState({ workouts: 0, sets: 0, volume: 0, topMuscle: '' });

  const bodyScores    = useMemo(() => calculateBodyScores(loadWorkoutSetsFromHistory()), []);
  const weeklyActivity = useMemo(() => getWeeklyMuscleActivity(), []);
  const levelInfo      = useMemo(() => getLevelFromXP(getTotalXP()), []);

  const weakestMuscle = useMemo((): MuscleGroup => {
    let worst: MuscleGroup = 'core'; let low = Infinity;
    Object.entries(bodyScores.scores).forEach(([m, s]) => {
      if (s.score < low) { low = s.score; worst = m as MuscleGroup; }
    });
    return worst;
  }, [bodyScores]);

  const loadData = async () => {
    setTodayCalories(getTodayCalories());
    setTodayWater(getTodayWater());
    setCalorieStreak(getCalorieStreak());
    await fetchStats();
  };

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn]);

  const { pullY, refreshing } = usePullToRefresh({
    onRefresh: loadData,
    disabled: !isLoggedIn,
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/workouts/sessions');
      const workouts = data.data || [];
      setStats({
        totalWorkouts: workouts.length,
        totalSets: workouts.reduce((s: number, w: any) => s + (w.exerciseSets?.length || 0), 0),
        currentStreak: calculateStreak(workouts),
      });
      if (workouts.length > 0) {
        const last = workouts[0];
        setLastWorkout({
          name: last.name || 'Workout',
          date: last.startTime,
          sets: last.exerciseSets?.length || 0,
        });
      }
      // Weekly stats
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thisWeek = workouts.filter((w: any) => new Date(w.startTime) >= sevenDaysAgo);
      const weeklySets = thisWeek.reduce((s: number, w: any) => s + (w.exerciseSets?.length || 0), 0);
      const weeklyVol = thisWeek.reduce((s: number, w: any) =>
        s + (w.exerciseSets || []).reduce((a: number, e: any) => a + (e.reps || 0) * (e.weight || 0), 0), 0);
      const muscleCounts: Record<string, number> = {};
      thisWeek.forEach((w: any) => (w.exerciseSets || []).forEach((e: any) => {
        const mg = e.exercise?.muscleGroup || 'Other';
        muscleCounts[mg] = (muscleCounts[mg] || 0) + 1;
      }));
      const topMuscle = Object.entries(muscleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
      setWeeklyStats({ workouts: thisWeek.length, sets: weeklySets, volume: Math.round(weeklyVol), topMuscle });
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  // Streak freeze helpers
  const getStreakFreezes = (): number => parseInt(localStorage.getItem('streakFreezes') || '1', 10);
  const getFreezeDates = (): string[] => { try { return JSON.parse(localStorage.getItem('freezeDates') || '[]'); } catch { return []; } };
  const [streakFreezes, setStreakFreezes] = useState(getStreakFreezes);
  const [frozenToday, setFrozenToday] = useState(() => getFreezeDates().includes(new Date().toISOString().slice(0, 10)));

  const handleUseFreeze = () => {
    if (streakFreezes < 1) return;
    const today = new Date().toISOString().slice(0, 10);
    const dates = [...getFreezeDates(), today];
    localStorage.setItem('freezeDates', JSON.stringify(dates));
    const newCount = streakFreezes - 1;
    localStorage.setItem('streakFreezes', String(newCount));
    setStreakFreezes(newCount);
    setFrozenToday(true);
  };

  const calculateStreak = (workouts: any[]): number => {
    if (!workouts.length && !frozenToday) return 0;
    const sorted = [...workouts].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    const freezeDates = new Set(getFreezeDates());
    let streak = 0;
    let cur = new Date(); cur.setHours(0, 0, 0, 0);
    let workoutIdx = 0;

    for (let day = 0; day <= 365; day++) {
      const dateStr = new Date(cur.getTime() - day * 86400000).toISOString().slice(0, 10);
      // Check if there's a workout on this day
      let hasWorkout = false;
      while (workoutIdx < sorted.length) {
        const d = new Date(sorted[workoutIdx].startTime);
        const wDateStr = d.toISOString().slice(0, 10);
        if (wDateStr === dateStr) { hasWorkout = true; workoutIdx++; break; }
        if (wDateStr < dateStr) break;
        workoutIdx++;
      }
      if (hasWorkout || freezeDates.has(dateStr)) streak++;
      else break;
    }
    return streak;
  };

  const { t } = useTranslation();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Animated counters — only run once data is loaded
  const animatedWorkouts = useCountUp(stats.totalWorkouts, 900, !loading);
  const animatedSets = useCountUp(stats.totalSets, 900, !loading);
  const animatedStreak = useCountUp(stats.currentStreak, 700, !loading);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d0f1a] transition-colors duration-300">
      {/* Pull-to-refresh indicator */}
      {(pullY > 0 || refreshing) && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ height: Math.max(pullY, refreshing ? 48 : 0), transition: refreshing ? 'none' : 'height 0.2s' }}>
          <div className={`w-8 h-8 rounded-full border-4 border-white/20 border-t-white flex items-center justify-center ${refreshing ? 'animate-spin' : ''}`}
            style={{ background: 'linear-gradient(135deg, var(--p-from), var(--p-to))', opacity: Math.min(pullY / 48, 1) }}>
            {!refreshing && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>}
          </div>
        </div>
      )}
      <Navbar />

      {/* ── Logged-in: Compact personal greeting ─────────── */}
      {isLoggedIn ? (
        <section className="relative overflow-hidden" style={{ background: '#080a12' }}>
          {/* Subtle orb — one only, much smaller */}
          <div className="absolute top-0 right-1/4 w-[400px] h-[200px] rounded-full blur-[100px] pointer-events-none"
            style={{ background: 'var(--p-from)', opacity: 0.14 }} />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent, #080a12)' }} />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-7 pb-16 sm:pb-20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/40 text-sm font-medium mb-1">
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {t('home.welcomeBack')}, {user.username || 'Champion'}
                </h1>
              </div>
              <button
                onClick={() => navigate('/workout')}
                className="flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-2xl active:scale-95 transition-all touch-manipulation"
                style={{
                  background: 'linear-gradient(135deg, var(--p-from), var(--p-to))',
                  boxShadow: '0 8px 24px var(--p-shadow)',
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                </svg>
                {t('home.startWorkout')}
              </button>
            </div>
          </div>
        </section>
      ) : (
        /* ── Guest: Full marketing hero ─────────────────────── */
        <section className="relative overflow-hidden" style={{ background: '#080a12' }}>
          <div className="absolute -top-32 left-1/4 w-[700px] h-[700px] rounded-full blur-[140px] animate-orb-1 pointer-events-none"
            style={{ background: 'var(--p-from)', opacity: 0.22 }} />
          <div className="absolute -bottom-32 right-1/4 w-[600px] h-[600px] rounded-full blur-[120px] animate-orb-2 pointer-events-none"
            style={{ background: 'var(--p-to)', opacity: 0.18 }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)',
              backgroundSize: '48px 48px'
            }} />
          <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent, #080a12)' }} />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-36 text-center">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-8 animate-fade-up"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
              Your fitness journey starts here
            </div>

            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-white leading-[0.95] tracking-tight mb-6 animate-fade-up delay-100">
              {t('home.heroTitle1')}<br />
              <span style={{
                backgroundImage: 'linear-gradient(135deg, var(--p-from) 0%, var(--p-to) 50%, var(--p-from) 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer 4s linear infinite',
                display: 'inline-block',
              }}>
                {t('home.heroTitle2')}
              </span>
            </h1>
            <p className="text-base sm:text-lg text-white/40 max-w-xl mx-auto mb-10 leading-relaxed animate-fade-up delay-200">
              {t('home.heroSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up delay-300">
              <button onClick={() => navigate('/register')}
                className="text-white font-bold text-base px-8 py-3.5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                style={{ background: 'linear-gradient(135deg, var(--p-from), var(--p-to))', boxShadow: '0 12px 32px var(--p-shadow)' }}>
                {t('home.getStarted')} →
              </button>
              <button onClick={() => navigate('/login')}
                className="font-semibold text-base px-8 py-3.5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}>
                {t('home.signIn')}
              </button>
            </div>

            <div className="mt-10 flex items-center justify-center gap-3 animate-fade-up delay-400">
              <div className="flex -space-x-2">
                {['🧑‍💻','👩‍🏫','🧑‍🔬','👨‍🎓','👩‍💼'].map((e, i) => (
                  <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{ border: '2px solid #080a12', background: 'rgba(255,255,255,0.07)' }}>{e}</div>
                ))}
              </div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Trusted by <span style={{ color: 'rgba(255,255,255,0.6)' }} className="font-semibold">1,200+</span> athletes
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Stats Dashboard ─────────────────────────────────── */}
      {isLoggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-14 relative z-10">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {/* Total Workouts */}
            <button onClick={() => navigate('/workout-history')}
              className="metric-card text-left p-4 sm:p-5 active:scale-[0.97] transition-all duration-200 touch-manipulation">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(59,130,246,0.12)' }}>
                <svg className="w-4 h-4" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>
                </svg>
              </div>
              <div className="text-2xl sm:text-3xl font-black tabular-nums leading-none mb-1" style={{ color: '#3b82f6' }}>
                {loading ? <span className="text-gray-300 dark:text-gray-400">—</span> : animatedWorkouts}
              </div>
              <div className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 leading-snug">{t('home.totalWorkouts')}</div>
            </button>

            {/* Total Sets */}
            <button onClick={() => navigate('/stats')}
              className="metric-card text-left p-4 sm:p-5 active:scale-[0.97] transition-all duration-200 touch-manipulation">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(16,185,129,0.12)' }}>
                <svg className="w-4 h-4" style={{ color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <div className="text-2xl sm:text-3xl font-black tabular-nums leading-none mb-1" style={{ color: '#10b981' }}>
                {loading ? <span className="text-gray-300 dark:text-gray-400">—</span> : animatedSets.toLocaleString()}
              </div>
              <div className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 leading-snug">{t('home.setsLogged')}</div>
            </button>

            {/* Streak */}
            <div className="metric-card p-4 sm:p-5">
              <button onClick={() => navigate('/calendar')} className="text-left w-full active:scale-[0.97] transition-all touch-manipulation">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'rgba(249,115,22,0.12)' }}>
                  <svg className="w-4 h-4" style={{ color: '#f97316' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="text-2xl sm:text-3xl font-black tabular-nums leading-none mb-1" style={{ color: '#f97316' }}>
                  {loading ? <span className="text-gray-300 dark:text-gray-400">—</span> : animatedStreak}
                </div>
                <div className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 leading-snug">{t('home.dayStreak')}</div>
              </button>
              {/* Streak freeze button */}
              {streakFreezes > 0 && !frozenToday && stats.currentStreak > 0 && (
                <button
                  onClick={e => { e.stopPropagation(); handleUseFreeze(); }}
                  className="mt-2 text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1">
                  🧊 Use freeze ({streakFreezes})
                </button>
              )}
              {frozenToday && (
                <div className="mt-2 text-[10px] font-bold text-blue-400 flex items-center gap-1">🧊 Frozen today!</div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── This Week Summary ───────────────────────────────── */}
      {isLoggedIn && weeklyStats.workouts > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3">
          <button
            onClick={() => navigate('/stats')}
            className="w-full metric-card p-4 sm:p-5 text-left active:scale-[0.99] transition-all duration-200 touch-manipulation"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="section-label">This Week</span>
              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">Mon – Today →</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xl font-black tabular-nums leading-none mb-0.5" style={{ color: 'var(--p-text)' }}>
                  {weeklyStats.workouts}
                </div>
                <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Workouts</div>
              </div>
              <div>
                <div className="text-xl font-black tabular-nums leading-none mb-0.5" style={{ color: 'var(--p-text)' }}>
                  {weeklyStats.sets}
                </div>
                <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Sets</div>
              </div>
              <div>
                <div className="text-xl font-black tabular-nums leading-none mb-0.5" style={{ color: 'var(--p-text)' }}>
                  {weeklyStats.volume >= 1000 ? `${(weeklyStats.volume / 1000).toFixed(1)}k` : weeklyStats.volume}
                </div>
                <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400">kg volume</div>
              </div>
            </div>
            {weeklyStats.topMuscle && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800 text-[11px] text-gray-400 dark:text-gray-500">
                Top muscle: <span className="font-bold text-gray-700 dark:text-gray-300">{weeklyStats.topMuscle}</span>
              </div>
            )}
          </button>
        </section>
      )}

      {/* ── Today's Summary ─────────────────────────────────── */}
      {isLoggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Calories */}
            <button onClick={() => navigate('/nutrition')}
              className="metric-card text-left p-4 sm:p-5 active:scale-[0.97] transition-all duration-200 touch-manipulation">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="section-label mb-2">{t('home.todayNutrition')}</div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                    {todayCalories.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('home.kcalLoggedToday')}</div>
                  {calorieStreak > 1 && (
                    <div className="mt-1.5 text-xs font-semibold text-emerald-500">
                      {calorieStreak}d streak
                    </div>
                  )}
                </div>
                <TodayRing
                  pct={Math.min((todayCalories / 2000) * 100, 100)}
                  color="#10b981"
                  trackColor="rgba(16,185,129,0.1)"
                  label={`${Math.round((todayCalories / 2000) * 100)}%`}
                />
              </div>
            </button>

            {/* Water */}
            <button onClick={() => navigate('/water')}
              className="metric-card text-left p-4 sm:p-5 active:scale-[0.97] transition-all duration-200 touch-manipulation">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="section-label mb-2">{t('home.waterToday')}</div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                    {todayWater.current}
                    <span className="text-sm font-medium text-gray-400 dark:text-gray-500 ml-1">ml</span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('home.waterConsumed')}</div>
                </div>
                <TodayRing
                  pct={Math.min((todayWater.current / todayWater.goal) * 100, 100)}
                  color="#06b6d4"
                  trackColor="rgba(6,182,212,0.1)"
                  label={`${Math.round((todayWater.current / todayWater.goal) * 100)}%`}
                />
              </div>
            </button>
          </div>
        </section>
      )}

      {/* ── Weekly Muscle Activity ───────────────────────── */}
      {isLoggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3">
          <button
            onClick={() => navigate('/body-score')}
            className="w-full text-left metric-card rounded-2xl p-5 active:scale-[0.99] transition-all duration-200 touch-manipulation"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="section-label mb-0.5">{t('home.thisWeek', 'This Week')}</div>
                <div className="text-base font-bold text-gray-900 dark:text-white">
                  {t('home.muscleActivity', 'Muscle Activity')}
                </div>
              </div>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1">
                {t('home.viewBodyScore', 'Body Score')}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </span>
            </div>

            {/* Muscle bars — 4 columns */}
            <div className="grid grid-cols-4 gap-2.5">
              {(['chest','back','shoulders','legs','biceps','triceps','core','cardio'] as MuscleGroup[]).map(muscle => {
                const sets = weeklyActivity[muscle];
                const maxSets = Math.max(...Object.values(weeklyActivity), 1);
                const pct = sets > 0 ? Math.max((sets / maxSets) * 100, 14) : 0;
                const col = bodyScores.scores[muscle].color;
                const trained = sets > 0;
                return (
                  <div key={muscle} className="flex flex-col items-center gap-1.5">
                    {/* Vertical fill bar */}
                    <div
                      className="w-full rounded-xl relative overflow-hidden"
                      style={{ height: 48, background: trained ? `${col}15` : 'rgba(0,0,0,0.05)', border: trained ? `1px solid ${col}22` : '1px solid transparent' }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-xl transition-all duration-700"
                        style={{ height: `${pct}%`, background: trained ? col : 'transparent', opacity: 0.7 }}
                      />
                      {trained && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[11px] font-black text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                            {sets}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Emoji + label */}
                    <div className="text-center leading-none">
                      <div className="text-base leading-none">{MUSCLE_EMOJI[muscle]}</div>
                      <div className="text-[8px] font-bold mt-0.5 uppercase tracking-wide"
                        style={{ color: trained ? col : 'rgba(75,85,99,0.8)' }}>
                        {muscle.slice(0, 4)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer — total sets */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
              <div className="flex gap-3">
                {Object.values(weeklyActivity).reduce((s, n) => s + n, 0) === 0 ? (
                  <span className="text-xs text-gray-400 dark:text-gray-400 font-medium">
                    {t('home.noActivityThisWeek', 'No workouts this week yet')}
                  </span>
                ) : (
                  <>
                    <span className="text-xs font-black text-gray-700 dark:text-gray-300 tabular-nums">
                      {Object.values(weeklyActivity).reduce((s, n) => s + n, 0)} {t('common.sets', 'sets')}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {Object.values(weeklyActivity).filter(n => n > 0).length} / 8 {t('home.musclesTrained', 'muscles')}
                    </span>
                  </>
                )}
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'color-mix(in srgb, var(--p-500) 12%, transparent)', color: 'var(--p-text)' }}>
                {bodyScores.overallScore}/100
              </span>
            </div>
          </button>
        </section>
      )}

      {/* ── Personalized Dashboard (logged in) ──────────────── */}
      {isLoggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-4 pb-8">

          {/* XP Level card */}
          <button onClick={() => navigate('/profile')}
            className="w-full text-left rounded-2xl p-5 overflow-hidden relative transition-all active:scale-[0.99]"
            style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20"
              style={{ background: 'var(--p-to)', transform: 'translate(20%, -20%)' }} />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--p-from), var(--p-to))', boxShadow: '0 8px 20px var(--p-shadow)' }}>
                {levelInfo.level}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-black text-base">{levelInfo.title}</span>
                  <span className="text-white/50 text-xs font-bold">{getTotalXP().toLocaleString()} XP</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${levelInfo.progressPct}%`, background: 'linear-gradient(90deg, var(--p-from), var(--p-to))' }} />
                </div>
                <div className="text-white/40 text-xs mt-1">{levelInfo.progressPct}% {t('xp.toLevel', { n: levelInfo.level + 1 })}</div>
              </div>
            </div>
          </button>

          {/* Body Score + Workout Suggestion — 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            {/* Body Score */}
            <button onClick={() => navigate('/body-score')}
              className="text-left rounded-2xl p-4 transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-xs font-medium text-white/40 uppercase tracking-wide mb-3">🧬 Body Score</div>
              <div className="text-4xl font-black text-white leading-none mb-1">{bodyScores.overallScore}</div>
              <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full" style={{ width: `${bodyScores.overallScore}%`, background: 'linear-gradient(90deg, var(--p-from), var(--p-to))' }} />
              </div>
              <div className="text-white/40 text-xs font-medium">
                {MUSCLE_EMOJI[weakestMuscle]} {t(`bodyScore.muscles.${weakestMuscle}` as any, weakestMuscle)} needs work →
              </div>
            </button>

            {/* Last Workout */}
            <button onClick={() => navigate('/workout-history')}
              className="text-left rounded-2xl p-4 transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-xs font-medium text-white/40 uppercase tracking-wide mb-3">💪 {t('nav.workoutHistory')}</div>
              {lastWorkout ? (
                <>
                  <div className="text-sm font-black text-white leading-tight mb-1 truncate">{lastWorkout.name}</div>
                  <div className="text-3xl font-black text-white leading-none mb-1">{lastWorkout.sets}</div>
                  <div className="text-white/40 text-xs font-medium">
                    {t('common.sets')} · {new Date(lastWorkout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </>
              ) : (
                <div className="text-white/30 text-sm mt-2">{t('home.noWorkoutsYet', 'Start your first workout!')}</div>
              )}
            </button>
          </div>

          {/* Today's Suggestion */}
          <button
            onClick={() => navigate('/body-score', { state: { muscle: weakestMuscle } })}
            className="w-full text-left rounded-2xl p-5 transition-all active:scale-[0.99] relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, color-mix(in srgb, ${bodyScores.scores[weakestMuscle].color} 15%, #0f172a), #0f172a)`,
              border: `1px solid color-mix(in srgb, ${bodyScores.scores[weakestMuscle].color} 25%, transparent)`,
            }}>
            <div className="absolute right-4 top-4 text-5xl opacity-10 select-none">💡</div>
            <div className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: bodyScores.scores[weakestMuscle].color }}>
              {t('home.todaySuggestion', "Today's Suggestion")}
            </div>
            <div className="text-white font-black text-lg mb-3">
              {MUSCLE_EMOJI[weakestMuscle]} {t(`bodyScore.muscles.${weakestMuscle}` as any, weakestMuscle)} Day
            </div>
            <div className="flex flex-wrap gap-2">
              {(MUSCLE_EXERCISES[weakestMuscle] || []).map(ex => (
                <span key={ex} className="text-xs font-semibold px-2.5 py-1 rounded-lg text-white/70"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  {ex}
                </span>
              ))}
            </div>
            <div className="mt-3 text-xs font-bold" style={{ color: bodyScores.scores[weakestMuscle].color }}>
              Start workout →
            </div>
          </button>

          {/* Explore shortcut */}
          <button
            onClick={() => navigate('/explore')}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all active:scale-[0.99]"
            style={{ background: 'linear-gradient(135deg, #16213e, #1a2744)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: 'rgba(255,255,255,0.08)' }}>⚡</div>
              <div>
                <div className="text-sm font-bold text-white">Explore all features</div>
                <div className="text-xs text-white/55 font-medium">Programs · Tools · Social · Settings</div>
              </div>
            </div>
            <svg className="w-4 h-4 text-white/35 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

        </section>
      )}

      {/* ── Features — only for guests ──────────────────────── */}
      {!isLoggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-4"
              style={{ background: 'color-mix(in srgb, var(--p-500) 10%, transparent)', color: 'var(--p-text)', border: '1px solid color-mix(in srgb, var(--p-500) 20%, transparent)' }}>
              ◆ FEATURES
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
              {t('home.everythingYouNeed')}
            </h2>
            <p className="text-gray-400 dark:text-gray-500 text-lg max-w-xl mx-auto font-normal">
              {t('home.everythingSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {features.map((f) => (
              <div key={f.title} className="surface-feature group rounded-2xl p-7 transition-all duration-300 cursor-default">
                <div className="text-4xl mb-4 icon-hover inline-block">{f.icon}</div>
                <h3 className="text-base font-black text-gray-900 dark:text-gray-100 mb-2 tracking-tight">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-normal">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA (guests) ───────────────────────────────────── */}
      {!isLoggedIn && (
        <section className="relative overflow-hidden py-16 sm:py-28" style={{ background: '#060810' }}>
          {/* Orbs */}
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-20"
            style={{ background: 'var(--p-from)' }} />
          <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none opacity-15"
            style={{ background: 'var(--p-to)' }} />
          <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-5xl sm:text-6xl font-black text-white mb-4 tracking-tight leading-none">{t('home.readyToBegin')}</h2>
            <p className="text-xl text-white/40 mb-10 font-normal">{t('home.readySubtitle')}</p>
            <button onClick={() => navigate('/register')}
              className="text-white font-black text-lg px-14 py-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, var(--p-from), var(--p-to))',
                boxShadow: '0 20px 60px var(--p-shadow), 0 1px 0 rgba(255,255,255,0.15) inset',
              }}>
              {t('home.createFreeAccount')} →
            </button>
          </div>
        </section>
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="py-10"
        style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.6)' }}>
        <style>{`.dark footer { background: rgba(13,15,26,0.8) !important; border-top-color: rgba(255,255,255,0.05) !important; }`}</style>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--p-from), var(--p-to))',
                  boxShadow: '0 4px 12px var(--p-shadow)',
                }}>
                <span className="text-white text-xs font-black">F</span>
              </div>
              <div>
                <div className="text-sm font-black tracking-tight"
                  style={{ backgroundImage: 'linear-gradient(135deg, var(--p-from), var(--p-to))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>FitTrack Pro</div>
                <div className="text-[9px] text-gray-400 dark:text-gray-400 font-bold tracking-wide uppercase -mt-0.5">Your fitness companion</div>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-400 font-medium">{t('home.footerTagline')}</p>
            <div className="flex gap-5 text-xs text-gray-400 dark:text-gray-400 font-semibold">
              <button onClick={() => navigate('/tips')} className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Fitness Tips</button>
              <button onClick={() => navigate('/exercise-library')} className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Exercises</button>
              <button onClick={() => navigate('/calculators')} className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Calculators</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
