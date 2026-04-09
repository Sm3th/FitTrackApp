import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Navbar from '../components/Navbar';
import { calculateXP, getLevelInfo } from '../utils/statsHelper';

interface WorkoutSession {
  id: string;
  startTime: string;
  exerciseSets?: Array<{
    exercise: { name: string };
    reps?: number;
    weight?: number;
  }>;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  type: 'daily' | 'weekly' | 'milestone';
  target: number;
  unit: string;
  color: string;
  checkCompletion: (workouts: WorkoutSession[], completedToday: string[]) => { current: number; completed: boolean };
}

const CHALLENGES: Challenge[] = [
  {
    id: 'daily_workout',
    title: 'Daily Warrior',
    description: 'Complete 1 workout today',
    icon: '⚔️',
    xpReward: 100,
    type: 'daily',
    target: 1,
    unit: 'workout',
    color: 'from-orange-500 to-red-500',
    checkCompletion: (workouts) => {
      const today = new Date().toISOString().split('T')[0];
      const todayCount = workouts.filter(w => new Date(w.startTime).toISOString().split('T')[0] === today).length;
      return { current: todayCount, completed: todayCount >= 1 };
    },
  },
  {
    id: 'daily_sets',
    title: 'Set Crusher',
    description: 'Log 10 sets today',
    icon: '💥',
    xpReward: 150,
    type: 'daily',
    target: 10,
    unit: 'sets',
    color: 'from-purple-500 to-pink-500',
    checkCompletion: (workouts) => {
      const today = new Date().toISOString().split('T')[0];
      const todaySets = workouts
        .filter(w => new Date(w.startTime).toISOString().split('T')[0] === today)
        .reduce((sum, w) => sum + (w.exerciseSets?.length || 0), 0);
      return { current: todaySets, completed: todaySets >= 10 };
    },
  },
  {
    id: 'weekly_3',
    title: 'Three-Day Week',
    description: 'Work out 3 times this week',
    icon: '📅',
    xpReward: 300,
    type: 'weekly',
    target: 3,
    unit: 'workouts',
    color: 'from-blue-500 to-cyan-500',
    checkCompletion: (workouts) => {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekWorkouts = workouts.filter(w => new Date(w.startTime) >= weekStart);
      const uniqueDays = new Set(weekWorkouts.map(w => new Date(w.startTime).toISOString().split('T')[0]));
      return { current: uniqueDays.size, completed: uniqueDays.size >= 3 };
    },
  },
  {
    id: 'weekly_5',
    title: 'Five-Day Champion',
    description: 'Work out 5 times this week',
    icon: '🏆',
    xpReward: 600,
    type: 'weekly',
    target: 5,
    unit: 'workouts',
    color: 'from-yellow-400 to-orange-500',
    checkCompletion: (workouts) => {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekWorkouts = workouts.filter(w => new Date(w.startTime) >= weekStart);
      const uniqueDays = new Set(weekWorkouts.map(w => new Date(w.startTime).toISOString().split('T')[0]));
      return { current: uniqueDays.size, completed: uniqueDays.size >= 5 };
    },
  },
  {
    id: 'milestone_10',
    title: 'Double Digits',
    description: 'Complete 10 total workouts',
    icon: '🎯',
    xpReward: 500,
    type: 'milestone',
    target: 10,
    unit: 'workouts',
    color: 'from-green-500 to-teal-500',
    checkCompletion: (workouts) => ({ current: workouts.length, completed: workouts.length >= 10 }),
  },
  {
    id: 'milestone_50',
    title: 'Fifty Club',
    description: 'Complete 50 total workouts',
    icon: '⭐',
    xpReward: 2000,
    type: 'milestone',
    target: 50,
    unit: 'workouts',
    color: 'from-indigo-500 to-purple-600',
    checkCompletion: (workouts) => ({ current: workouts.length, completed: workouts.length >= 50 }),
  },
  {
    id: 'milestone_100',
    title: 'Century Club',
    description: 'Complete 100 total workouts',
    icon: '👑',
    xpReward: 5000,
    type: 'milestone',
    target: 100,
    unit: 'workouts',
    color: 'from-pink-500 to-rose-600',
    checkCompletion: (workouts) => ({ current: workouts.length, completed: workouts.length >= 100 }),
  },
  {
    id: 'milestone_1000_sets',
    title: 'Set Master',
    description: 'Log 1000 total sets',
    icon: '💪',
    xpReward: 3000,
    type: 'milestone',
    target: 1000,
    unit: 'sets',
    color: 'from-cyan-500 to-blue-600',
    checkCompletion: (workouts) => {
      const total = workouts.reduce((s, w) => s + (w.exerciseSets?.length || 0), 0);
      return { current: total, completed: total >= 1000 };
    },
  },
  {
    id: 'daily_volume',
    title: 'Volume King',
    description: 'Lift 5,000 kg of volume today',
    icon: '🏋️',
    xpReward: 250,
    type: 'daily',
    target: 5000,
    unit: 'kg',
    color: 'from-red-500 to-rose-600',
    checkCompletion: (workouts) => {
      const today = new Date().toISOString().split('T')[0];
      const vol = workouts
        .filter(w => new Date(w.startTime).toISOString().split('T')[0] === today)
        .reduce((sum, w) => sum + (w.exerciseSets?.reduce((s, set) => s + (set.reps || 0) * (set.weight || 0), 0) || 0), 0);
      return { current: Math.round(vol), completed: vol >= 5000 };
    },
  },
  {
    id: 'streak_7',
    title: 'Week Streak',
    description: 'Maintain a 7-day workout streak',
    icon: '🔥',
    xpReward: 1000,
    type: 'milestone',
    target: 7,
    unit: 'days',
    color: 'from-orange-400 to-red-500',
    checkCompletion: (workouts) => {
      // Simple streak calculation
      const sorted = [...workouts].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      let streak = 0;
      let current = new Date();
      current.setHours(0, 0, 0, 0);
      for (const w of sorted) {
        const d = new Date(w.startTime); d.setHours(0, 0, 0, 0);
        const diff = Math.floor((current.getTime() - d.getTime()) / 86400000);
        if (diff === streak) streak++;
        else if (diff > streak) break;
      }
      return { current: streak, completed: streak >= 7 };
    },
  },
];

const STORAGE_KEY = 'claimedXP';

const DailyChallengesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<'all' | 'daily' | 'weekly' | 'milestone'>('all');
  const [totalBonusXP, setTotalBonusXP] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    // Load claimed challenges
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const today = new Date().toISOString().split('T')[0];
      // Daily challenges reset each day
      const claimed = new Set<string>();
      Object.entries(stored).forEach(([id, claimedDate]) => {
        const challenge = CHALLENGES.find(c => c.id === id);
        if (!challenge) return;
        if (challenge.type === 'daily' && claimedDate !== today) return;
        claimed.add(id);
      });
      setClaimedIds(claimed);

      // Total bonus XP from all claimed milestone/weekly challenges
      let bonus = 0;
      Object.keys(stored).forEach(id => {
        const ch = CHALLENGES.find(c => c.id === id);
        if (ch && (ch.type === 'milestone' || ch.type === 'weekly')) bonus += ch.xpReward;
      });
      setTotalBonusXP(bonus);
    } catch {}

    fetchWorkouts();
  }, [navigate]);

  const fetchWorkouts = async () => {
    try {
      const response = await apiClient.get('/workouts/sessions');
      setWorkouts(response.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = (challenge: Challenge) => {
    const newClaimed = new Set(claimedIds);
    newClaimed.add(challenge.id);
    setClaimedIds(newClaimed);

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      stored[challenge.id] = new Date().toISOString().split('T')[0];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {}

    if (challenge.type !== 'daily') {
      setTotalBonusXP(prev => prev + challenge.xpReward);
    }
  };

  const baseXP = calculateXP(workouts);
  const totalXP = baseXP + totalBonusXP;
  const levelInfo = getLevelInfo(totalXP);

  const filtered = CHALLENGES.filter(c => activeFilter === 'all' || c.type === activeFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-gray-600 dark:text-gray-400">{t('challenges.loadingChallenges')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      <div className="relative bg-slate-950 overflow-hidden py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-2">{t('challenges.xpRewards')}</p>
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">{t('challenges.title')}</h1>
          <p className="text-white/40 text-sm mb-6">{t('challenges.subtitle')}</p>

          {/* Level Display */}
          <div className="inline-flex items-center gap-4 bg-white/10 border border-white/15 backdrop-blur-sm rounded-2xl px-5 py-3">
            <span className="text-3xl">{levelInfo.badge}</span>
            <div>
              <div className="font-bold text-white">{levelInfo.name} — {t('challenges.level', { n: levelInfo.level })}</div>
              <div className="text-xs text-white/50">{totalXP.toLocaleString()} XP</div>
            </div>
            {levelInfo.nextLevel && (
              <div className="ml-2">
                <div className="flex justify-between text-xs text-white/40 mb-1">
                  <span>{levelInfo.progressXP}</span>
                  <span>{levelInfo.rangeXP} XP</span>
                </div>
                <div className="w-28 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"
                    style={{ width: `${levelInfo.progressPct}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 sm:py-8 sm:px-6">

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: t('challenges.all') },
            { key: 'daily', label: t('challenges.daily') },
            { key: 'weekly', label: t('challenges.weekly') },
            { key: 'milestone', label: t('challenges.milestones') },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key as any)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeFilter === f.key ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Challenges Grid */}
        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map(challenge => {
            const { current, completed } = challenge.checkCompletion(workouts, []);
            const isClaimed = claimedIds.has(challenge.id);
            const progress = Math.min(100, Math.round((current / challenge.target) * 100));
            const canClaim = completed && !isClaimed;

            return (
              <div
                key={challenge.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all ${
                  isClaimed ? 'opacity-75' : 'hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                <div className={`bg-gradient-to-r ${challenge.color} p-5 text-white`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{challenge.icon}</span>
                      <div>
                        <div className="font-bold text-lg">{challenge.title}</div>
                        <div className="text-white/80 text-sm">{challenge.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">+{challenge.xpReward}</div>
                      <div className="text-white/70 text-xs">XP</div>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      {current} / {challenge.target} {challenge.unit}
                    </span>
                    <span className={`font-semibold ${completed ? 'text-green-500' : 'text-gray-400'}`}>
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2.5 mb-4">
                    <div
                      className={`h-2.5 rounded-full transition-all ${completed ? 'bg-green-500' : 'bg-indigo-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                      challenge.type === 'daily' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                      challenge.type === 'weekly' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {challenge.type}
                    </span>

                    {isClaimed ? (
                      <span className="text-green-600 dark:text-green-400 font-semibold text-sm flex items-center gap-1">
                        {t('challenges.claimed')}
                      </span>
                    ) : canClaim ? (
                      <button
                        onClick={() => handleClaim(challenge)}
                        className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700 animate-pulse"
                      >
                        {t('challenges.claimXP')}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">
                        {t('challenges.remaining', { n: challenge.target - current, unit: challenge.unit })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* XP Summary */}
        <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
          <h3 className="text-xl font-bold mb-4">{t('challenges.xpBreakdown')}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{baseXP.toLocaleString()}</div>
              <div className="text-white/70 text-sm">{t('challenges.workoutXP')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{totalBonusXP.toLocaleString()}</div>
              <div className="text-white/70 text-sm">{t('challenges.challengeXP')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{totalXP.toLocaleString()}</div>
              <div className="text-white/70 text-sm">{t('challenges.totalXP')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyChallengesPage;
