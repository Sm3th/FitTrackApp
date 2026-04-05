import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import Navbar from '../components/Navbar';
import { StatsSkeleton } from '../components/LoadingSkeleton';
import {
  calculateStreak,
  getWeeklyWorkoutData,
  getTotalVolume,
  getExerciseStats,
  getPersonalRecords,
  getVolumeOverTime,
  getWorkoutsOverTime,
  getMuscleGroupBreakdown,
  calculateXP,
  getLevelInfo,
  getWeekComparison,
  getSmartInsights,
} from '../utils/statsHelper';
import { calculateAchievements } from '../utils/achievements';
import { generateWorkoutPDF } from '../utils/pdfGenerator';
import { exportWorkoutsToCsv, exportPersonalRecordsToCsv } from '../utils/csvExporter';
import EmptyState from '../components/EmptyState';
import MuscleHeatmap from '../components/MuscleHeatmap';
import { useTranslation } from 'react-i18next';

interface WorkoutSession {
  id: string;
  startTime: string;
  duration?: number;
  exerciseSets?: Array<{
    exercise: { name: string; muscleGroup?: string };
    setNumber: number;
    reps?: number;
    weight?: number;
  }>;
}

type ChartTab = 'weekly' | 'volume' | 'workouts' | 'muscle';

const StatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState<ChartTab>('weekly');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchWorkouts();
  }, [navigate]);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/workouts/sessions');
      setWorkouts(response.data.data || []);
    } catch (error) {
      console.error('Fetch workouts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const streak = calculateStreak(workouts);
  const weeklyData = getWeeklyWorkoutData(workouts);
  const totalVolume = getTotalVolume(workouts);
  const totalSets = workouts.reduce((sum, w) => sum + (w.exerciseSets?.length || 0), 0);
  const achievements = calculateAchievements({ totalWorkouts: workouts.length, totalSets, totalVolume, streak });
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const topExercises = getExerciseStats(workouts);
  const personalRecords = getPersonalRecords(workouts);
  const volumeOverTime = getVolumeOverTime(workouts);
  const workoutsOverTime = getWorkoutsOverTime(workouts);
  const muscleBreakdown = getMuscleGroupBreakdown(workouts);
  const xp = calculateXP(workouts);
  const levelInfo = getLevelInfo(xp);
  const weekComparison = getWeekComparison(workouts);
  const smartInsights = getSmartInsights(workouts);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-40 animate-pulse" />
          <StatsSkeleton />
          <StatsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      {workouts.length === 0 ? (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <EmptyState
            icon="📊"
            title={t('stats.noStats')}
            description={t('stats.noStatsDesc')}
            actionLabel="🔥 Start Working Out"
            actionPath="/workout-plans"
            variant="gradient"
          />
        </div>
      ) : (
        <>
          {/* Hero Header */}
          <div className="relative bg-slate-950 overflow-hidden py-14">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-blue-600/10" />
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-2">{t('stats.analytics')}</p>
                  <h1 className="text-4xl font-black text-white tracking-tight mb-3">{t('stats.title')}</h1>
                  {/* Level badge */}
                  <div className="inline-flex items-center gap-3 bg-white/10 border border-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5">
                    <span className="text-3xl">{levelInfo.badge}</span>
                    <div>
                      <div className="font-bold text-white text-sm">{levelInfo.name} — Level {levelInfo.level}</div>
                      <div className="text-xs text-white/50">{xp.toLocaleString()} XP total</div>
                    </div>
                  </div>
                  {levelInfo.nextLevel && (
                    <div className="mt-3 w-64">
                      <div className="flex justify-between text-xs text-white/40 mb-1.5">
                        <span>{levelInfo.progressXP} XP</span>
                        <span>{levelInfo.rangeXP} XP to Level {levelInfo.level + 1}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all"
                          style={{ width: `${levelInfo.progressPct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => exportWorkoutsToCsv(workouts)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm px-4 py-2.5 rounded-xl font-semibold transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    {t('stats.exportCsv')}
                  </button>
                  <button onClick={() => exportPersonalRecordsToCsv(personalRecords)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm px-4 py-2.5 rounded-xl font-semibold transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                    {t('stats.exportPrs')}
                  </button>
                  <button onClick={() => generateWorkoutPDF(workouts)}
                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white text-sm px-4 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    {t('stats.pdfReport')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: '🔥', value: streak, label: t('stats.dayStreak'), from: 'from-orange-500', to: 'to-red-500', shadow: 'shadow-orange-500/20' },
                { icon: '💪', value: workouts.length, label: t('stats.workoutsDone'), from: 'from-emerald-500', to: 'to-teal-500', shadow: 'shadow-emerald-500/20' },
                { icon: '🏋️', value: `${(totalVolume / 1000).toFixed(1)}t`, label: t('stats.volumeLifted'), from: 'from-violet-500', to: 'to-purple-500', shadow: 'shadow-violet-500/20' },
                { icon: '🎯', value: unlockedCount, label: t('stats.achievements'), from: 'from-blue-500', to: 'to-cyan-500', shadow: 'shadow-blue-500/20' },
              ].map((stat, i) => (
                <div key={i} className={`bg-gradient-to-br ${stat.from} ${stat.to} rounded-2xl p-6 text-white text-center shadow-xl ${stat.shadow}`}>
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-black mb-1">{stat.value}</div>
                  <div className="text-xs text-white/70 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* This Week vs Last Week */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                <h2 className="font-bold text-gray-900 dark:text-white">{t('stats.thisWeek')}</h2>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-full font-medium">{t('stats.vsLastWeek')}</span>
              </div>
              <div className="p-5 grid grid-cols-3 gap-4">
                {[
                  { label: t('stats.workouts'), curr: weekComparison.thisWeek.workouts, prev: weekComparison.lastWeek.workouts, delta: weekComparison.delta.workouts, unit: '' },
                  { label: t('stats.sets'), curr: weekComparison.thisWeek.sets, prev: weekComparison.lastWeek.sets, delta: weekComparison.delta.sets, unit: '' },
                  { label: t('stats.volume'), curr: weekComparison.thisWeek.volume, prev: weekComparison.lastWeek.volume, delta: weekComparison.delta.volume, unit: 'kg' },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <div className="text-2xl font-black text-gray-900 dark:text-white">
                      {item.unit === 'kg' && item.curr >= 1000
                        ? `${(item.curr / 1000).toFixed(1)}t`
                        : `${item.curr}${item.unit}`}
                    </div>
                    <div className="text-xs text-gray-400 font-medium mb-1.5">{item.label}</div>
                    <div className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                      item.delta > 0 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' :
                      item.delta < 0 ? 'bg-red-100 dark:bg-red-900/40 text-red-500' :
                      'bg-gray-100 dark:bg-slate-800 text-gray-400'
                    }`}>
                      {item.delta > 0 ? '↑' : item.delta < 0 ? '↓' : '–'}
                      {item.delta !== 0 ? `${Math.abs(item.delta)}%` : 'Same'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-4">
                <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  Last week: {weekComparison.lastWeek.workouts} workout{weekComparison.lastWeek.workouts !== 1 ? 's' : ''} · {weekComparison.lastWeek.sets} sets · {weekComparison.lastWeek.volume.toLocaleString()}kg
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { key: 'weekly', label: t('stats.tabs.weekly') },
                  { key: 'volume', label: t('stats.tabs.volume') },
                  { key: 'workouts', label: t('stats.tabs.workouts') },
                  { key: 'muscle', label: t('stats.tabs.muscle') },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setChartTab(tab.key as ChartTab)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      chartTab === tab.key
                        ? 'text-white'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                    style={chartTab === tab.key ? {
                      background: 'linear-gradient(to right, var(--p-from), var(--p-to))',
                      boxShadow: '0 4px 14px var(--p-shadow)',
                    } : undefined}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {chartTab === 'weekly' && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('stats.weeklyActivity')}</h2>
                  {weeklyData.some(d => d.count > 0) ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={weeklyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                        <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value) => [`${value} workout(s)`, 'Workouts']}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', background: '#1e293b', color: '#f1f5f9' }} />
                        <Bar dataKey="count" fill="url(#blueGrad)" radius={[6, 6, 0, 0]}
                          isAnimationActive animationDuration={800} animationEasing="ease-out" />
                        <defs>
                          <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-600">{t('stats.noWorkoutsThisWeek')}</div>
                  )}
                </div>
              )}

              {chartTab === 'volume' && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('stats.volumeTrend')}</h2>
                  {volumeOverTime.length >= 2 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={volumeOverTime} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value) => [`${value} kg`, 'Volume']}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', background: '#1e293b', color: '#f1f5f9' }} />
                        <Line type="monotone" dataKey="volume" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }}
                          isAnimationActive animationDuration={1000} animationEasing="ease-out" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-2">
                      <span className="text-4xl">📈</span>
                      <p>{t('stats.needMoreWorkouts')}</p>
                    </div>
                  )}
                </div>
              )}

              {chartTab === 'workouts' && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('stats.frequency')}</h2>
                  {workoutsOverTime.length >= 2 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={workoutsOverTime} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value) => [`${value} workout(s)`, 'Frequency']}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', background: '#1e293b', color: '#f1f5f9' }} />
                        <Line type="monotone" dataKey="workouts" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }}
                          isAnimationActive animationDuration={1000} animationEasing="ease-out" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-2">
                      <span className="text-4xl">🏃</span>
                      <p>{t('stats.needMoreWorkouts')}</p>
                    </div>
                  )}
                </div>
              )}

              {chartTab === 'muscle' && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('stats.muscleGroups')}</h2>
                  {muscleBreakdown.length > 0 ? (
                    <MuscleHeatmap muscleBreakdown={muscleBreakdown} />
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 gap-2">
                      <span className="text-4xl">💪</span>
                      <p>{t('stats.noMuscleData')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Top Exercises & Personal Records */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">{t('stats.topExercises')}</h2>
                {topExercises.length > 0 ? (() => {
                  const maxSets = Math.max(...topExercises.map(e => e.totalSets));
                  return (
                    <div className="space-y-3 stagger-children">
                      {topExercises.map((exercise, index) => (
                        <div key={index} className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-white ${
                              index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                              index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                              index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                              'bg-gradient-to-br from-blue-500 to-indigo-500'
                            }`}>{index + 1}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{exercise.name}</div>
                            </div>
                            <div className="text-sm font-black text-orange-500 tabular-nums">{exercise.totalSets}×</div>
                          </div>
                          {/* Animated bar */}
                          <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500 progress-animated"
                              style={{
                                width: `${(exercise.totalSets / maxSets) * 100}%`,
                                transitionDelay: `${index * 80 + 200}ms`,
                              }} />
                          </div>
                          <div className="text-xs text-gray-400 mt-1">Max {exercise.maxWeight}kg</div>
                        </div>
                      ))}
                    </div>
                  );
                })() : (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-600">{t('stats.noExercises')}</div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('stats.personalRecords')}</h2>
                  {personalRecords.length > 0 && (
                    <button onClick={() => exportPersonalRecordsToCsv(personalRecords)}
                      className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 font-medium transition-colors">
                      Export
                    </button>
                  )}
                </div>
                {personalRecords.length > 0 ? (
                  <div className="space-y-3 stagger-children">
                    {personalRecords.map((pr, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 card-lift">
                        <div className="flex-shrink-0 text-2xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{pr.name}</div>
                          <div className="text-xs text-gray-400">{pr.weight}kg × {pr.reps} reps</div>
                        </div>
                        <div className="text-xs text-gray-400">{new Date(pr.date).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-600">{t('stats.noRecords')}</div>
                )}
              </div>
            </div>

            {/* Smart Insights */}
            {smartInsights.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm">✨</div>
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white">{t('stats.smartInsights')}</h2>
                    <p className="text-xs text-gray-400">{t('stats.smartInsightsDesc')}</p>
                  </div>
                </div>
                <div className="p-5 grid sm:grid-cols-2 gap-3">
                  {smartInsights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl">
                      <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-violet-500" />
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { path: '/calendar', icon: '📅', label: 'Calendar', color: 'from-blue-500/10 to-blue-600/10 border-blue-500/20' },
                { path: '/measurements', icon: '📏', label: 'Measurements', color: 'from-purple-500/10 to-purple-600/10 border-purple-500/20' },
                { path: '/calculators', icon: '💯', label: 'Calculators', color: 'from-emerald-500/10 to-emerald-600/10 border-emerald-500/20' },
                { path: '/challenges', icon: '🎯', label: 'Challenges', color: 'from-orange-500/10 to-orange-600/10 border-orange-500/20' },
              ].map(link => (
                <button key={link.path} onClick={() => navigate(link.path)}
                  className={`bg-gradient-to-br ${link.color} border rounded-2xl p-5 text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}>
                  <div className="text-3xl mb-2">{link.icon}</div>
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{link.label}</div>
                </button>
              ))}
            </div>

            <div className="text-center pb-4">
              <button onClick={() => navigate('/workout-plans')} className="btn-primary text-base px-10 py-4">
                {t('stats.startNewWorkout')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatsPage;
