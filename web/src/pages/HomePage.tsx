import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Navbar from '../components/Navbar';
import { useCountUp } from '../hooks/useCountUp';
import { useTranslation } from 'react-i18next';

const STREAK_COLOR = (streak: number) => {
  if (streak === 0) return 'text-gray-400';
  if (streak < 3)  return 'text-green-400';
  if (streak < 7)  return 'text-yellow-400';
  if (streak < 14) return 'text-orange-400';
  if (streak < 30) return 'text-pink-400';
  return 'text-yellow-300';
};

const quickLinks = [
  { path: '/nutrition',       icon: '🥗', label: 'Nutrition',        grad: 'from-emerald-500 to-teal-500' },
  { path: '/challenges',      icon: '🎯', label: 'Challenges',       grad: 'from-violet-600 to-purple-600' },
  { path: '/measurements',   icon: '📏', label: 'Measurements',     grad: 'from-blue-600 to-cyan-500'    },
  { path: '/water',          icon: '💧', label: 'Water Intake',      grad: 'from-cyan-500 to-blue-500'    },
  { path: '/calculators',    icon: '💯', label: 'Calculators',       grad: 'from-amber-500 to-orange-500' },
  { path: '/calendar',       icon: '📅', label: 'Calendar',          grad: 'from-indigo-500 to-blue-600'  },
  { path: '/exercise-library',icon: '📚', label: 'Exercises',        grad: 'from-yellow-500 to-orange-500'},
  { path: '/tips',           icon: '💡', label: 'Fitness Tips',      grad: 'from-pink-500 to-rose-500'    },
];

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

  useEffect(() => {
    if (isLoggedIn) {
      fetchStats();
      setTodayCalories(getTodayCalories());
      setTodayWater(getTodayWater());
      setCalorieStreak(getCalorieStreak());
    }
  }, [isLoggedIn]);

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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-36 text-center">
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
              className="group text-left rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 active:scale-98 overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.97)',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8) inset',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 28px 80px rgba(0,0,0,0.14), 0 6px 24px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8) inset')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8) inset')}
            >
              <style>{`.dark .stat-lift { background: rgba(18,20,31,0.98) !important; border-color: rgba(255,255,255,0.07) !important; box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset !important; }`}</style>
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 8px 20px rgba(59,130,246,0.35)' }}>
                  💪
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  {t('common.today')}
                </span>
              </div>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-1 tabular-nums">
                {loading ? <span className="opacity-20">—</span> : animatedWorkouts}
              </div>
              <div className="text-sm font-semibold text-gray-400">{t('home.totalWorkouts')}</div>
            </button>

            {/* Total Sets */}
            <button onClick={() => navigate('/stats')}
              className="stat-lift group text-left rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 active:scale-98 overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.97)',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8) inset',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 28px 80px rgba(0,0,0,0.14), 0 6px 24px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8) inset')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8) inset')}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300"
                  style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 8px 20px rgba(16,185,129,0.35)' }}>
                  🎯
                </div>
                <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-100">
                  {t('common.sets')}
                </span>
              </div>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-1 tabular-nums">
                {loading ? <span className="opacity-20">—</span> : animatedSets.toLocaleString()}
              </div>
              <div className="text-sm font-semibold text-gray-400">{t('home.setsLogged')}</div>
            </button>

            {/* Streak */}
            <button onClick={() => navigate('/calendar')}
              className="stat-lift group text-left rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 active:scale-98 overflow-hidden"
              style={{
                background: stats.currentStreak >= 7
                  ? 'linear-gradient(135deg, rgba(249,115,22,0.06), rgba(239,68,68,0.04))'
                  : 'rgba(255,255,255,0.97)',
                border: stats.currentStreak >= 7 ? '1px solid rgba(249,115,22,0.2)' : '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8) inset',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 28px 80px rgba(0,0,0,0.14), 0 6px 24px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8) inset')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8) inset')}
            >
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
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  stats.currentStreak >= 7
                    ? 'text-orange-600 bg-orange-50 border border-orange-100'
                    : 'text-orange-500 bg-orange-50 border border-orange-100'
                }`}>
                  {stats.currentStreak > 0 ? `${stats.currentStreak} ${t('water.days')}` : '🔥'}
                </span>
              </div>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-1 tabular-nums">
                {loading ? <span className="opacity-20">—</span> : animatedStreak}
              </div>
              <div className="text-sm font-semibold text-gray-400">{t('home.dayStreak')}</div>
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
              className="group stat-lift text-left rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.04))',
                border: '1px solid rgba(16,185,129,0.15)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              }}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base group-hover:scale-110 inline-block transition-transform">🥗</span>
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('home.todayNutrition')}</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{todayCalories.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">{t('home.kcalLoggedToday')}</div>
                  {todayCalories === 0 ? (
                    <div className="mt-2 text-xs text-emerald-500 font-bold">{t('home.startTracking')}</div>
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
                  trackColor="rgba(16,185,129,0.1)"
                  label={`${Math.round((todayCalories / 2000) * 100)}%`}
                />
              </div>
            </button>

            {/* Water */}
            <button onClick={() => navigate('/water')}
              className="group stat-lift text-left rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'linear-gradient(135deg, rgba(6,182,212,0.06), rgba(59,130,246,0.04))',
                border: '1px solid rgba(6,182,212,0.15)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              }}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base group-hover:scale-110 inline-block transition-transform">💧</span>
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('home.waterToday')}</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">
                    {todayWater.current}<span className="text-sm font-semibold text-gray-400 ml-0.5">ml</span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">{t('home.waterConsumed')}</div>
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

      {/* ── Quick Access ──────────────────────────────────── */}
      {isLoggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t('home.quickAccess')}</h2>
              <div className="h-0.5 w-10 rounded-full mt-1" style={{ background: 'linear-gradient(to right, var(--p-from), var(--p-to))' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
            {quickLinks.map(item => (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`quick-link-card bg-gradient-to-br ${item.grad} ripple-container`}
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                <div className="relative z-10">
                  <div className="text-3xl mb-3 icon-hover inline-block">{item.icon}</div>
                  <div className="font-bold text-sm leading-tight tracking-tight">{item.label}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Achievement teaser ──────────────────────────────── */}
      {isLoggedIn && stats.totalWorkouts > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="relative overflow-hidden rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(249,115,22,0.06))',
              border: '1px solid rgba(245,158,11,0.18)',
            }}>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-8xl opacity-[0.07] pointer-events-none select-none">🏆</div>
            <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-1">{t('home.achievements')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('home.achievementsDesc')}</p>
              </div>
              <button onClick={() => navigate('/achievements')}
                className="shrink-0 text-white px-6 py-2.5 rounded-xl font-bold transition-all duration-200 active:scale-95 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                  boxShadow: '0 6px 20px rgba(245,158,11,0.35)',
                }}>
                {t('common.viewAll')} →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Features ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-4"
            style={{
              background: 'color-mix(in srgb, var(--p-500) 10%, transparent)',
              color: 'var(--p-text)',
              border: '1px solid color-mix(in srgb, var(--p-500) 20%, transparent)',
            }}>
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
            <div key={f.title}
              className="group rounded-2xl p-7 transition-all duration-300 cursor-default card-hover"
              style={{
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.border = '1px solid color-mix(in srgb, var(--p-500) 30%, transparent)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.border = '1px solid rgba(0,0,0,0.06)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)';
              }}>
              <div className="text-4xl mb-4 icon-hover inline-block">{f.icon}</div>
              <h3 className="text-base font-black text-gray-900 dark:text-gray-100 mb-2 tracking-tight">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-normal">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA (guests) ───────────────────────────────────── */}
      {!isLoggedIn && (
        <section className="relative overflow-hidden py-28" style={{ background: '#060810' }}>
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
