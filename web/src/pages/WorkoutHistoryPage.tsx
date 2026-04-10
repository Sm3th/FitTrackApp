import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';
import { ListSkeleton } from '../components/LoadingSkeleton';
import { generateWorkoutPDF } from '../utils/pdfGenerator';
import { useDebounce } from '../hooks/useDebounce';
import { useTranslation } from 'react-i18next';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import PullToRefresh from '../components/PullToRefresh';

interface WorkoutSession {
  id: string;
  name?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  exerciseSets?: ExerciseSet[];
}
interface ExerciseSet {
  id: string;
  exercise: { name: string };
  setNumber: number;
  reps?: number;
  weight?: number;
}
interface WorkoutRating { rating: number; note: string; }
type SortBy = 'newest' | 'oldest' | 'longest';

const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(s => (
      <span key={s} className={`text-xs ${s <= rating ? 'opacity-100' : 'opacity-15'}`}>⭐</span>
    ))}
  </div>
);


const WorkoutHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [ratings, setRatings] = useState<Record<string, WorkoutRating>>({});
  const [copied, setCopied] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    setRatings(JSON.parse(localStorage.getItem('workoutRatings') || '{}'));
    fetchWorkouts();
  }, [navigate]);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/workouts/sessions');
      const sessions = data.data || [];
      setWorkouts(sessions);
      // Merge ratings stored in session notes (backend) with localStorage ratings
      const localRatings: Record<string, WorkoutRating> = JSON.parse(localStorage.getItem('workoutRatings') || '{}');
      sessions.forEach((s: any) => {
        if (s.notes && !localRatings[s.id]) {
          try {
            const meta = JSON.parse(s.notes);
            if (meta.rating) localRatings[s.id] = { rating: meta.rating, note: meta.ratingNote || '' };
          } catch {}
        }
      });
      setRatings(localRatings);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const { pullY, refreshing } = usePullToRefresh({ onRefresh: fetchWorkouts });

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const fmtDur = (m?: number) => !m ? 'N/A' : m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`;

  const groupSetsByExercise = (sets?: ExerciseSet[]) => {
    if (!sets) return {};
    return sets.reduce((acc, s) => {
      const n = s.exercise.name;
      if (!acc[n]) acc[n] = [];
      acc[n].push(s);
      return acc;
    }, {} as Record<string, ExerciseSet[]>);
  };

  const debouncedSearch = useDebounce(searchQuery, 250);

  const filtered = useMemo(() =>
    workouts
      .filter(w => !debouncedSearch || (w.name || 'Workout Session').toLowerCase().includes(debouncedSearch.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        if (sortBy === 'oldest') return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        return (b.duration || 0) - (a.duration || 0);
      }),
    [workouts, debouncedSearch, sortBy]
  );

  // Reset visible count when filter/sort changes
  useEffect(() => { setVisibleCount(20); }, [debouncedSearch, sortBy]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisibleCount(c => c + 20);
    }, { rootMargin: '100px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [filtered.length]);

  const generateShareLink = useCallback((workout: WorkoutSession) => {
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : { username: 'FitTracker' };
    const exercises = Object.entries(groupSetsByExercise(workout.exerciseSets || []))
      .map(([name, sets]) => ({
        name,
        sets: sets.length,
        reps: sets[0]?.reps || 0,
        weight: sets[0]?.weight || 0,
      }));
    const vol = workout.exerciseSets?.reduce((s, e) => s + (e.reps||0)*(e.weight||0), 0) || 0;
    const data = {
      name: workout.name || 'Workout',
      date: workout.startTime,
      duration: workout.duration || 0,
      exercises,
      totalVolume: vol,
      sharedBy: user.username || 'FitTracker',
    };
    return `${window.location.origin}/shared-workout?data=${btoa(JSON.stringify(data))}`;
  }, [groupSetsByExercise]);

  const handleShare = useCallback(async () => {
    if (!selectedWorkout) return;
    const url = generateShareLink(selectedWorkout);
    try { await navigator.clipboard.writeText(url); }
    catch { const ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [selectedWorkout, generateShareLink]);

  const totalVolume = selectedWorkout?.exerciseSets?.reduce((s, e) => s + (e.reps||0)*(e.weight||0), 0) || 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <PullToRefresh pullY={pullY} refreshing={refreshing} />

      {/* Hero */}
      <div className="relative bg-slate-950 overflow-hidden py-8 sm:py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-blue-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-1">{t('history.title')}</h1>
            <p className="text-white/40 text-sm">{t('history.workoutsLogged', { count: workouts.length })}</p>
          </div>
          {workouts.length > 0 && (
            <button onClick={() => generateWorkoutPDF(workouts)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold px-5 py-2.5 rounded-xl backdrop-blur-sm transition-all active:scale-95">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {t('history.exportPdf')}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5 sm:py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><ListSkeleton /></div>
        ) : workouts.length === 0 ? (
          <EmptyState icon="🏋️" title={t('history.noWorkoutsTitle')} description={t('history.noWorkoutsDesc')} actionLabel={t('history.startFirst')} actionPath="/workout-plans" secondaryActionLabel={t('history.customWorkout')} secondaryActionPath="/workout" variant="gradient" />
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: List */}
            <div>
              {/* Search + Sort */}
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="flex-1 relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('history.searchPlaceholder')}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none transition-all focus-primary" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {([['newest', t('history.newest')], ['oldest', t('history.oldest')], ['longest', t('history.longest')]] as [SortBy,string][]).map(([s, label]) => (
                    <button key={s} onClick={() => setSortBy(s)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${sortBy === s ? 'text-white' : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700'}`}
                      style={sortBy === s ? {
                        background: 'linear-gradient(to right, var(--p-from), var(--p-to))',
                        boxShadow: '0 4px 12px var(--p-shadow)',
                      } : undefined}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <p className="text-sm">{t('history.noResults', { query: searchQuery })}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filtered.slice(0, visibleCount).map(workout => (
                    <button key={workout.id} onClick={() => setSelectedWorkout(workout)}
                      className={`w-full text-left bg-white dark:bg-slate-900 rounded-2xl p-4 border-2 transition-all duration-200 hover:shadow-md group ${
                        selectedWorkout?.id === workout.id
                          ? 'shadow-md'
                          : 'border-transparent hover:border-gray-200 dark:hover:border-slate-700'
                      }`}
                      style={selectedWorkout?.id === workout.id ? {
                        borderColor: 'var(--p-500)',
                        boxShadow: '0 4px 16px color-mix(in srgb, var(--p-500) 15%, transparent)',
                      } : undefined}>
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${selectedWorkout?.id === workout.id ? '' : 'bg-gray-200 dark:bg-slate-700'}`}
                              style={selectedWorkout?.id === workout.id ? { background: 'var(--p-500)' } : undefined} />
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                              {workout.name || 'Workout Session'}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 ml-4">
                            {fmt(workout.startTime)} at {fmtTime(workout.startTime)}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <div className="text-sm font-bold" style={{ color: 'var(--p-text)' }}>{fmtDur(workout.duration)}</div>
                          {workout.exerciseSets && <div className="text-xs text-gray-400">{workout.exerciseSets.length} sets</div>}
                        </div>
                      </div>
                      {ratings[workout.id] && (
                        <div className="mt-2 ml-4 flex items-center gap-2">
                          <StarDisplay rating={ratings[workout.id].rating} />
                          {ratings[workout.id].note && (
                            <span className="text-xs text-gray-400 italic truncate">"{ratings[workout.id].note}"</span>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                  {visibleCount < filtered.length && (
                    <div ref={sentinelRef} className="py-4 flex justify-center">
                      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--p-500)', borderTopColor: 'transparent' }} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Detail */}
            <div>
              {selectedWorkout ? (
                <div className="list-card sticky top-20 overflow-hidden animate-fade-up">
                  {/* Detail header */}
                  <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">
                        {selectedWorkout.name || 'Workout Session'}
                      </h3>
                      {ratings[selectedWorkout.id] && (
                        <div className="mt-1"><StarDisplay rating={ratings[selectedWorkout.id].rating} /></div>
                      )}
                    </div>
                    <button onClick={handleShare}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        copied ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'
                      }`}
                      onMouseEnter={e => { if (!copied) { e.currentTarget.style.color = 'var(--p-text)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--p-500) 10%, transparent)'; } }}
                      onMouseLeave={e => { if (!copied) { e.currentTarget.style.color = ''; e.currentTarget.style.background = ''; } }}>
                      {copied ? (
                        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Copied!</>
                      ) : (
                        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>{t('history.shareText')}</>
                      )}
                    </button>
                  </div>

                  <div className="p-6">
                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {[
                        { label: t('history.date'), value: fmt(selectedWorkout.startTime) },
                        { label: t('history.duration'), value: fmtDur(selectedWorkout.duration) },
                        { label: t('history.totalSets'), value: String(selectedWorkout.exerciseSets?.length || 0) },
                        ...(totalVolume > 0 ? [{ label: t('history.volume'), value: `${totalVolume.toLocaleString()} kg` }] : []),
                      ].map(item => (
                        <div key={item.label} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                          <div className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">{item.label}</div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</div>
                        </div>
                      ))}
                    </div>

                    {ratings[selectedWorkout.id]?.note && (
                      <div className="mb-5 p-3.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
                        <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">{t('history.yourNote')}</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 italic">"{ratings[selectedWorkout.id].note}"</div>
                      </div>
                    )}

                    {selectedWorkout.exerciseSets && selectedWorkout.exerciseSets.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">{t('history.exercises')}</p>
                        <div className="space-y-4">
                          {Object.entries(groupSetsByExercise(selectedWorkout.exerciseSets)).map(([name, sets]) => (
                            <div key={name}>
                              <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">{name}</p>
                              <div className="space-y-1.5">
                                {sets.map((set, i) => (
                                  <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl">
                                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 w-10">Set {set.setNumber}</span>
                                    <div className="flex gap-4 text-sm text-gray-900 dark:text-white">
                                      {set.reps && <span><strong>{set.reps}</strong> <span className="text-gray-400 text-xs">reps</span></span>}
                                      {set.weight && <span><strong>{set.weight}</strong> <span className="text-gray-400 text-xs">kg</span></span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p className="text-sm">{t('history.noExercises')}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="list-card p-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-3xl mx-auto mb-4">
                    👈
                  </div>
                  <p className="text-sm text-gray-400 dark:text-gray-500">{t('history.selectWorkout')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutHistoryPage;
