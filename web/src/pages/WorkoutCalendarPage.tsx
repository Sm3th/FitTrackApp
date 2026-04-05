import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Navbar from '../components/Navbar';
import { getCalendarHeatmapData } from '../utils/statsHelper';

interface WorkoutSession {
  id: string;
  startTime: string;
  exerciseSets?: Array<{
    exercise: { name: string };
    reps?: number;
    weight?: number;
  }>;
}

const WorkoutCalendarPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Use built-in Intl locale-aware day/month names
  const lang = i18n.resolvedLanguage || 'en';
  const DAYS = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, i).toLocaleDateString(lang, { weekday: 'short' })
  );
  const getMonthName = (year: number, month: number) =>
    new Date(year, month).toLocaleDateString(lang, { month: 'long' });
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [view, setView] = useState<'calendar' | 'heatmap'>('calendar');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
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

  const heatmapData = getCalendarHeatmapData(workouts);

  const getWorkoutsForDay = (dateStr: string) => {
    return workouts.filter(w => new Date(w.startTime).toISOString().split('T')[0] === dateStr);
  };

  const getDayIntensity = (count: number): string => {
    if (count === 0) return 'bg-gray-100 dark:bg-slate-800';
    if (count === 1) return 'bg-green-200 dark:bg-green-900';
    if (count === 2) return 'bg-green-400 dark:bg-green-700';
    if (count >= 3) return 'bg-green-600 dark:bg-green-500';
    return 'bg-gray-100 dark:bg-slate-800';
  };

  // Calendar view
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const calendarDays: Array<{ date: string | null; day: number | null }> = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push({ date: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ date: dateStr, day: d });
  }

  // Heatmap: last 26 weeks
  const getHeatmapWeeks = () => {
    const weeks: Array<Array<{ date: string; count: number }>> = [];
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 181); // ~26 weeks
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start on Sunday

    let current = new Date(startDate);
    while (current <= now) {
      const week: Array<{ date: string; count: number }> = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = current.toISOString().split('T')[0];
        week.push({ date: dateStr, count: heatmapData[dateStr] || 0 });
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  };

  const heatmapWeeks = getHeatmapWeeks();
  const totalWorkouts = workouts.length;
  const activeDays = Object.keys(heatmapData).length;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectedWorkouts = selectedDay ? getWorkoutsForDay(selectedDay) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-gray-600 dark:text-gray-400">{t('calendar.loadingCalendar')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      <div className="relative bg-slate-950 overflow-hidden py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-cyan-400 text-sm font-semibold uppercase tracking-widest mb-2">{t('calendar.historyBadge')}</p>
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">{t('calendar.title')}</h1>
          <p className="text-white/40 text-sm mb-5">{t('calendar.subtitle')}</p>
          <div className="flex gap-6">
            <div className="bg-white/10 border border-white/15 rounded-xl px-5 py-3 text-center">
              <div className="text-2xl font-black text-white">{totalWorkouts}</div>
              <div className="text-xs text-white/50 mt-0.5">{t('calendar.totalWorkouts')}</div>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-xl px-5 py-3 text-center">
              <div className="text-2xl font-black text-white">{activeDays}</div>
              <div className="text-xs text-white/50 mt-0.5">{t('calendar.activeDays')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 space-y-6">

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setView('calendar')}
            className={`px-5 py-2 rounded-lg font-medium transition-all ${view === 'calendar' ? 'text-white' : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}
            style={view === 'calendar' ? { background: 'linear-gradient(to right, var(--p-from), var(--p-to))' } : undefined}
          >
            {t('calendar.monthlyView')}
          </button>
          <button
            onClick={() => setView('heatmap')}
            className={`px-5 py-2 rounded-lg font-medium transition-all ${view === 'heatmap' ? 'text-white' : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}
            style={view === 'heatmap' ? { background: 'linear-gradient(to right, var(--p-from), var(--p-to))' } : undefined}
          >
            {t('calendar.heatmap')}
          </button>
        </div>

        {/* Calendar View */}
        {view === 'calendar' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                ←
              </button>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {getMonthName(year, month)} {year}
              </h2>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell, index) => {
                if (!cell.date) {
                  return <div key={index} />;
                }
                const dayWorkouts = getWorkoutsForDay(cell.date);
                const isToday = cell.date === today;
                const isSelected = cell.date === selectedDay;
                const hasWorkout = dayWorkouts.length > 0;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDay(isSelected ? null : cell.date)}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? 'text-white'
                        : isToday
                        ? 'ring-2'
                        : hasWorkout
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    style={
                      isSelected
                        ? { background: 'linear-gradient(135deg, var(--p-from), var(--p-to))' }
                        : isToday
                        ? { background: 'color-mix(in srgb, var(--p-500) 12%, transparent)', color: 'var(--p-text)', outline: '2px solid var(--p-500)', outlineOffset: '-2px' }
                        : undefined
                    }
                  >
                    {cell.day}
                    {hasWorkout && !isSelected && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {Array.from({ length: Math.min(dayWorkouts.length, 3) }).map((_, i) => (
                          <div key={i} className="w-1 h-1 bg-green-500 rounded-full" />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 rounded" />
                <span>{t('calendar.workoutDay')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: 'color-mix(in srgb, var(--p-500) 12%, transparent)', outline: '1px solid var(--p-500)' }} />
                <span>{t('calendar.today')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected Day Details */}
        {selectedDay && selectedWorkouts.length > 0 && view === 'calendar' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">
              💪 {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            {selectedWorkouts.map((w, i) => (
              <div key={i} className="border dark:border-slate-700 rounded-xl p-4 mb-3">
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t('calendar.workoutN', { n: i + 1 })} — {new Date(w.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {w.exerciseSets && w.exerciseSets.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(w.exerciseSets.map(s => s.exercise.name))].map(name => (
                      <span key={name} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Heatmap View */}
        {view === 'heatmap' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('calendar.last6Months')}</h2>
            <p className="text-sm text-gray-500 mb-6">{t('calendar.squareInfo')}</p>

            <div className="overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {/* Day labels */}
                <div className="flex flex-col gap-1 mr-1">
                  <div className="h-4" /> {/* spacer for month labels */}
                  {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                    <div key={i} className="h-4 text-xs text-gray-400 flex items-center" style={{ fontSize: '10px' }}>
                      {d}
                    </div>
                  ))}
                </div>

                {heatmapWeeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-1">
                    {/* Month label on first week of month */}
                    <div className="h-4 text-xs text-gray-400" style={{ fontSize: '10px' }}>
                      {week[0] && new Date(week[0].date).getDate() <= 7
                        ? new Date(week[0].date).toLocaleDateString('en-US', { month: 'short' })
                        : ''}
                    </div>
                    {week.map((day, di) => {
                      const isFuture = day.date > today;
                      return (
                        <div
                          key={di}
                          title={`${day.date}: ${day.count} workout(s)`}
                          className={`w-4 h-4 rounded-sm transition-all cursor-pointer hover:opacity-80 ${
                            isFuture ? 'bg-gray-50 dark:bg-slate-900' : getDayIntensity(day.count)
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
              <span>{t('calendar.less')}</span>
              {['bg-gray-100 dark:bg-slate-800', 'bg-green-200', 'bg-green-400', 'bg-green-600'].map((cls, i) => (
                <div key={i} className={`w-4 h-4 rounded-sm ${cls}`} />
              ))}
              <span>{t('calendar.more')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutCalendarPage;
