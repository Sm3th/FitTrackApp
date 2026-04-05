import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

const getTodayCalories = (): number => {
  try {
    const entries: { calories: number }[] = JSON.parse(localStorage.getItem(`nutrition_${getTodayKey()}`) || '[]');
    return entries.reduce((s, e) => s + e.calories, 0);
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

  useEffect(() => {
    if (isLoggedIn) {
      fetchStats();
      setTodayCalories(getTodayCalories());
      setTodayWater(getTodayWater());
    }
  }, [isLoggedIn]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:3000/api/workouts/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] animate-orb-1 pointer-events-none opacity-20"
          style={{ background: 'var(--p-from)' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] animate-orb-2 pointer-events-none opacity-15"
          style={{ background: 'var(--p-to)' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28 text-center">
          {isLoggedIn && (
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-sm font-medium px-4 py-2 rounded-full mb-8 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {t('home.welcomeBack')} {user.username || 'Champion'} 👋
            </div>
          )}

          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black text-white leading-none tracking-tight mb-6 animate-fade-up delay-100">
            {t('home.heroTitle1')}<br />
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, var(--p-from), var(--p-to), var(--p-from))' }}>
              {t('home.heroTitle2')}
            </span>
          </h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up delay-200">
            {t('home.heroSubtitle')}
          </p>

          {!isLoggedIn ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up delay-300">
              <button onClick={() => navigate('/register')}
                className="text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                style={{ background: 'linear-gradient(to right, var(--p-from), var(--p-to))', boxShadow: '0 16px 40px var(--p-shadow)' }}>
                {t('home.getStarted')}
              </button>
              <button onClick={() => navigate('/login')}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-lg px-10 py-4 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 active:scale-95">
                {t('home.signIn')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up delay-300">
              <button onClick={() => navigate('/workout')}
                className="text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                style={{ background: 'linear-gradient(to right, var(--p-from), var(--p-to))', boxShadow: '0 16px 40px var(--p-shadow)' }}>
                {t('home.startWorkout')}
              </button>
              <button onClick={() => navigate('/workout-plans')}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-lg px-10 py-4 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 active:scale-95">
                {t('home.browsePlans')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Stats Dashboard ─────────────────────────────────── */}
      {isLoggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Workouts */}
            <button onClick={() => navigate('/workout-history')}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl shadow-black/5 dark:shadow-black/30 border border-gray-100 dark:border-slate-800 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 text-left">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-2xl group-hover:scale-110 transition-transform">
                  💪
                </div>
                <span className="text-xs font-semibold text-green-500 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">{t('common.today')}</span>
              </div>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">
                {loading ? <span className="opacity-30">—</span> : animatedWorkouts}
              </div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('home.totalWorkouts')}</div>
            </button>

            {/* Total Sets */}
            <button onClick={() => navigate('/stats')}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl shadow-black/5 dark:shadow-black/30 border border-gray-100 dark:border-slate-800 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 text-left">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-2xl group-hover:scale-110 transition-transform">
                  🎯
                </div>
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-full">{t('common.sets')}</span>
              </div>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">
                {loading ? <span className="opacity-30">—</span> : animatedSets.toLocaleString()}
              </div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('home.setsLogged')}</div>
            </button>

            {/* Streak */}
            <button onClick={() => navigate('/calendar')}
              className={`group bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl shadow-black/5 dark:shadow-black/30 border hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 text-left ${
                stats.currentStreak >= 7 ? 'border-orange-200 dark:border-orange-800/50' : 'border-gray-100 dark:border-slate-800'
              }`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg text-2xl group-hover:scale-110 transition-transform ${
                  stats.currentStreak >= 7
                    ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-500/30'
                    : 'bg-gradient-to-br from-orange-400 to-orange-500 shadow-orange-500/20'
                } ${stats.currentStreak >= 3 ? 'animate-float' : ''}`}>
                  🔥
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${streakMsg.color.replace('text-', 'text-')} bg-orange-50 dark:bg-orange-950/30`}>
                  {stats.currentStreak > 0 ? `${stats.currentStreak} ${t('water.days')}` : '🔥'}
                </span>
              </div>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">
                {loading ? <span className="opacity-30">—</span> : animatedStreak}
              </div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('home.dayStreak')}</div>
              {!loading && (
                <div className={`text-xs font-semibold mt-1 ${streakMsg.color}`}>{streakMsg.text}</div>
              )}
            </button>
          </div>
        </section>
      )}

      {/* ── Today's Summary ─────────────────────────────────── */}
      {isLoggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Calories today */}
            <button onClick={() => navigate('/nutrition')}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-base shadow-sm group-hover:scale-110 transition-transform">🥗</div>
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t('home.todayNutrition')}</span>
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">{todayCalories.toLocaleString()}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('home.kcalLoggedToday')}</div>
              {todayCalories === 0 && (
                <div className="mt-2 text-xs text-emerald-500 font-semibold">{t('home.startTracking')}</div>
              )}
            </button>

            {/* Water today */}
            <button onClick={() => navigate('/water')}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-base shadow-sm group-hover:scale-110 transition-transform">💧</div>
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t('home.waterToday')}</span>
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {todayWater.current}<span className="text-sm font-normal text-gray-400 ml-0.5">/{todayWater.goal} ml</span>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('home.waterConsumed')}</div>
              <div className="mt-2 h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((todayWater.current / todayWater.goal) * 100, 100)}%` }}/>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* ── Quick Access ──────────────────────────────────── */}
      {isLoggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t('home.quickAccess')}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map(item => (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`group bg-gradient-to-br ${item.grad} text-white rounded-2xl p-5 text-left hover:opacity-90 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 active:scale-95`}>
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                <div className="font-bold text-sm leading-tight">{item.label}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Achievement teaser ──────────────────────────────── */}
      {isLoggedIn && stats.totalWorkouts > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl p-6 border border-amber-200/60 dark:border-amber-800/30">
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-8xl opacity-10 pointer-events-none">🏆</div>
            <div className="relative flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-1">{t('home.achievements')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('home.achievementsDesc')}</p>
              </div>
              <button onClick={() => navigate('/achievements')}
                className="shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5 transition-all duration-200 active:scale-95">
                {t('common.viewAll')}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Features ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
            {t('home.everythingYouNeed')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
            {t('home.everythingSubtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={f.title}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-7 border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--p-500) 40%, transparent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ''; }}
              style={{ animationDelay: `${i * 80}ms` }}>
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA (guests) ───────────────────────────────────── */}
      {!isLoggedIn && (
        <section className="relative overflow-hidden bg-slate-950 py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
          <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-5xl font-black text-white mb-4 tracking-tight">{t('home.readyToBegin')}</h2>
            <p className="text-xl text-white/50 mb-10">{t('home.readySubtitle')}</p>
            <button onClick={() => navigate('/register')}
              className="text-white font-bold text-lg px-12 py-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 active:scale-95"
              style={{ background: 'linear-gradient(to right, var(--p-from), var(--p-to))', boxShadow: '0 16px 40px var(--p-shadow)' }}>
              {t('home.createFreeAccount')}
            </button>
          </div>
        </section>
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow"
                style={{ background: 'linear-gradient(135deg, var(--p-from), var(--p-to))' }}>
                <span className="text-white text-xs font-black">F</span>
              </div>
              <span className="text-sm font-black tracking-tight bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(to right, var(--p-from), var(--p-to))' }}>FitTrack Pro</span>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">{t('home.footerTagline')}</p>
            <div className="flex gap-5 text-sm text-gray-400 dark:text-gray-500">
              <button onClick={() => navigate('/tips')} className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Fitness Tips</button>
              <button onClick={() => navigate('/exercise-library')} className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Exercises</button>
              <button onClick={() => navigate('/calculators')} className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Calculators</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
