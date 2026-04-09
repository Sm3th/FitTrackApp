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

const STREAK_COLOR = (streak: number) => {
  if (streak === 0) return 'text-gray-400';
  if (streak < 3)  return 'text-green-400';
  if (streak < 7)  return 'text-yellow-400';
  if (streak < 14) return 'text-orange-400';
  if (streak < 30) return 'text-pink-400';
  return 'text-yellow-300';
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
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const calculateStreak = (workouts: any[]): number => {
    if (!workouts.length) return 0;
    const sorted = [...workouts].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    let streak = 0;
    let cur = new Date(); cur.setHours(0, 0, 0, 0);
    for (const w of sorted) {
      const d = new Date(w.startTime); d.setHours(0, 0, 0, 0);
      const diff = Math.floor((cur.getTime() - d.getTime()) / 86400000);
      if (diff === streak) streak++;
      else if (diff > streak) break;
    }
    return streak;
  };

  const { t } = useTranslation();

  const getStreakMsg = (streak: number) => {
    const keys = ['home.streakStart','home.streakKeepUp','home.streakDontBreak','home.streakOnFire','home.streakIncredible','home.streakLegendary'] as const;
    const idx = streak === 0 ? 0 : streak < 3 ? 1 : streak < 7 ? 2 : streak < 14 ? 3 : streak < 30 ? 4 : 5;
    return { text: t(keys[idx]), color: STREAK_COLOR(streak) };
  };

  const streakMsg = getStreakMsg(stats.currentStreak);
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

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: '#080a12' }}>
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

        {/* Gradient orbs — larger, more vibrant */}
        <div className="absolute -top-32 left-1/4 w-[700px] h-[700px] rounded-full blur-[140px] animate-orb-1 pointer-events-none"
          style={{ background: 'var(--p-from)', opacity: 0.22 }} />
        <div className="absolute -bottom-32 right-1/4 w-[600px] h-[600px] rounded-full blur-[120px] animate-orb-2 pointer-events-none"
          style={{ background: 'var(--p-to)', opacity: 0.18 }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: 'var(--p-mid)', opacity: 0.08 }} />

        {/* Fine grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)',
            backgroundSize: '48px 48px'
          }} />

        {/* Bottom fade to page bg */}
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #080a12)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-36 text-center">
          {/* Badge */}
          {isLoggedIn ? (
            <div className="inline-flex items-center gap-2.5 text-sm font-semibold px-5 py-2.5 rounded-full mb-8 animate-fade-up"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(8px)',
              }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50" />
              {t('home.welcomeBack')} {user.username || 'Champion'} 👋
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-full mb-8 animate-fade-up tracking-widest uppercase"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.5)',
              }}>
              <span style={{ color: 'var(--p-from)' }}>◆</span> Your fitness journey starts here
            </div>
          )}

          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black text-white leading-[0.95] tracking-tight mb-6 animate-fade-up delay-100"
            style={{ fontFeatureSettings: '"cv02","cv03","cv04","cv11"' }}>
            {t('home.heroTitle1')}<br />
            <span
              className="relative inline-block"
              style={{
                backgroundImage: 'linear-gradient(135deg, var(--p-from) 0%, var(--p-to) 50%, var(--p-from) 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer 4s linear infinite',
              }}>
              {t('home.heroTitle2')}
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-white/45 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up delay-200 font-normal">
            {t('home.heroSubtitle')}
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10 animate-fade-up delay-250">
            {['🤖 AI Coach', '📊 Analytics', '🏆 Achievements', '💧 Nutrition', '📅 Calendar', '🌍 3 Languages'].map(f => (
              <span key={f}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.55)',
                }}>{f}</span>
            ))}
          </div>

          {!isLoggedIn ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up delay-300">
              <button onClick={() => navigate('/register')}
                className="text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 active:scale-95 group relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, var(--p-from), var(--p-to))', boxShadow: '0 16px 48px var(--p-shadow), 0 1px 0 rgba(255,255,255,0.15) inset' }}>
                <span className="relative z-10">{t('home.getStarted')} <span className="inline-block transition-transform group-hover:translate-x-1">→</span></span>
              </button>
              <button onClick={() => navigate('/login')}
                className="font-bold text-lg px-10 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(8px)',
                }}>
                {t('home.signIn')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up delay-300">
              <button onClick={() => navigate('/workout')}
                className="text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 active:scale-95 group relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, var(--p-from), var(--p-to))', boxShadow: '0 16px 48px var(--p-shadow), 0 1px 0 rgba(255,255,255,0.15) inset' }}>
                <span className="relative z-10">{t('home.startWorkout')} <span className="inline-block transition-transform group-hover:translate-x-1">→</span></span>
              </button>
              <button onClick={() => navigate('/workout-plans')}
                className="font-bold text-lg px-10 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(8px)',
                }}>
                {t('home.browsePlans')}
              </button>
            </div>
          )}

          {/* Social proof */}
          {!isLoggedIn && (
            <div className="mt-12 flex items-center justify-center gap-3 animate-fade-up delay-400">
              <div className="flex -space-x-2">
                {['🧑‍💻','👩‍🏫','🧑‍🔬','👨‍🎓','👩‍💼'].map((e, i) => (
                  <div key={i}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm"
                    style={{ border: '2px solid #080a12', background: 'rgba(255,255,255,0.08)' }}>{e}</div>
                ))}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)' }} className="text-sm">
                Trusted by <span style={{ color: 'rgba(255,255,255,0.65)' }} className="font-bold">1,200+</span> athletes worldwide
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Stats Dashboard ─────────────────────────────────── */}
      {isLoggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Workouts */}
            <button onClick={() => navigate('/workout-history')}
              className="surface-elevated surface-stat-blue card-glow group text-left rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] overflow-hidden">
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 8px 20px rgba(59,130,246,0.35)' }}>
                  💪
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/50">
                  {t('common.today')}
                </span>
              </div>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-1 tabular-nums">
                {loading ? <span className="opacity-20">—</span> : animatedWorkouts}
              </div>
              <div className="text-sm font-semibold text-gray-400 dark:text-gray-500">{t('home.totalWorkouts')}</div>
            </button>

            {/* Total Sets */}
            <button onClick={() => navigate('/stats')}
              className="surface-elevated surface-stat-emerald card-glow group text-left rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] overflow-hidden">
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300"
                  style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 8px 20px rgba(16,185,129,0.35)' }}>
                  🎯
                </div>
                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 px-2.5 py-1 rounded-full border border-cyan-100 dark:border-cyan-900/50">
                  {t('common.sets')}
                </span>
              </div>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-1 tabular-nums">
                {loading ? <span className="opacity-20">—</span> : animatedSets.toLocaleString()}
              </div>
              <div className="text-sm font-semibold text-gray-400 dark:text-gray-500">{t('home.setsLogged')}</div>
            </button>

            {/* Streak */}
            <button onClick={() => navigate('/calendar')}
              className={`surface-elevated card-glow group text-left rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] overflow-hidden ${
                stats.currentStreak >= 7 ? 'streak-hot' : 'surface-stat-orange'
              }`}>
              <div className="flex items-start justify-between mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 ${stats.currentStreak >= 3 ? 'animate-float' : ''}`}
                  style={{
                    background: stats.currentStreak >= 7
                      ? 'linear-gradient(135deg, #f97316, #ef4444)'
                      : 'linear-gradient(135deg, #fb923c, #f97316)',
                    boxShadow: '0 8px 20px rgba(249,115,22,0.35)',
                  }}>
                  🔥
                </div>
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2.5 py-1 rounded-full border border-orange-100 dark:border-orange-900/50">
                  {stats.currentStreak > 0 ? `${stats.currentStreak} ${t('water.days')}` : '🔥'}
                </span>
              </div>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-1 tabular-nums">
                {loading ? <span className="opacity-20">—</span> : animatedStreak}
              </div>
              <div className="text-sm font-semibold text-gray-400 dark:text-gray-500">{t('home.dayStreak')}</div>
              {!loading && <div className={`text-xs font-bold mt-1 ${streakMsg.color}`}>{streakMsg.text}</div>}
            </button>
          </div>
        </section>
      )}

      {/* ── Today's Summary ─────────────────────────────────── */}
      {isLoggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Calories */}
            <button onClick={() => navigate('/nutrition')}
              className="surface-tinted-green group text-left rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base group-hover:scale-110 inline-block transition-transform">🥗</span>
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('home.todayNutrition')}</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{todayCalories.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">{t('home.kcalLoggedToday')}</div>
                  {todayCalories === 0 ? (
                    <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold">{t('home.startTracking')}</div>
                  ) : calorieStreak > 1 ? (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-xs">{calorieStreak >= 7 ? '🔥' : '✅'}</span>
                      <span className={`text-xs font-black ${calorieStreak >= 7 ? 'text-orange-500' : 'text-emerald-500'}`}>
                        {calorieStreak}d streak
                      </span>
                    </div>
                  ) : null}
                </div>
                <TodayRing
                  pct={Math.min((todayCalories / 2000) * 100, 100)}
                  color="#10b981"
                  trackColor="rgba(16,185,129,0.12)"
                  label={`${Math.round((todayCalories / 2000) * 100)}%`}
                />
              </div>
            </button>

            {/* Water */}
            <button onClick={() => navigate('/water')}
              className="surface-tinted-cyan group text-left rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base group-hover:scale-110 inline-block transition-transform">💧</span>
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('home.waterToday')}</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">
                    {todayWater.current}<span className="text-sm font-semibold text-gray-400 dark:text-gray-500 ml-0.5">ml</span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">{t('home.waterConsumed')}</div>
                </div>
                <TodayRing
                  pct={Math.min((todayWater.current / todayWater.goal) * 100, 100)}
                  color="#06b6d4"
                  trackColor="rgba(6,182,212,0.12)"
                  label={`${Math.round((todayWater.current / todayWater.goal) * 100)}%`}
                />
              </div>
            </button>
          </div>
        </section>
      )}

      {/* ── Weekly Muscle Activity ───────────────────────── */}
      {isLoggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <button
            onClick={() => navigate('/body-score')}
            className="w-full text-left surface-elevated card-glow rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0.5">
                  📅 {t('home.thisWeek', 'This Week')}
                </div>
                <div className="text-sm font-black text-gray-900 dark:text-white">
                  {t('home.muscleActivity', 'Muscle Activity')}
                </div>
              </div>
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1">
                {t('home.viewBodyScore', 'Body Score')} →
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
                        style={{ color: trained ? col : 'rgba(107,114,128,0.5)' }}>
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
                  <span className="text-xs text-gray-400 dark:text-gray-600 font-medium">
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
              <div className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">🧬 Body Score</div>
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
              <div className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">💪 {t('nav.workoutHistory')}</div>
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
            <div className="text-xs font-black uppercase tracking-widest mb-2"
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
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: 'rgba(255,255,255,0.06)' }}>⚡</div>
              <div>
                <div className="text-sm font-black text-white">Explore all features</div>
                <div className="text-xs text-white/30 font-medium">Programs · Tools · Social · Settings</div>
              </div>
            </div>
            <svg className="w-4 h-4 text-white/20 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="text-[9px] text-gray-400 dark:text-gray-600 font-bold tracking-widest uppercase -mt-0.5">Your fitness companion</div>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-600 font-medium">{t('home.footerTagline')}</p>
            <div className="flex gap-5 text-xs text-gray-400 dark:text-gray-600 font-semibold">
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
