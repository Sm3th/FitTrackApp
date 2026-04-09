import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

interface SearchResult {
  title: string;
  subtitle?: string;
  icon: string;
  path: string;
  category: 'page' | 'exercise' | 'workout';
}

const PAGES: SearchResult[] = [
  { title: 'Workout', subtitle: 'Start or track a workout', icon: '💪', path: '/workout', category: 'page' },
  { title: 'Workout History', subtitle: 'View past sessions', icon: '📋', path: '/workout-history', category: 'page' },
  { title: 'Workout Plans', subtitle: 'Browse training plans', icon: '📅', path: '/workout-plans', category: 'page' },
  { title: 'Statistics', subtitle: 'Charts & analytics', icon: '📊', path: '/stats', category: 'page' },
  { title: 'Nutrition', subtitle: 'Track calories & macros', icon: '🥗', path: '/nutrition', category: 'page' },
  { title: 'Water Intake', subtitle: 'Hydration tracker', icon: '💧', path: '/water', category: 'page' },
  { title: 'Body Score', subtitle: 'Muscle balance analysis', icon: '🧬', path: '/body-score', category: 'page' },
  { title: 'Body Measurements', subtitle: 'Track body metrics', icon: '📏', path: '/measurements', category: 'page' },
  { title: 'Goals', subtitle: 'Set & track fitness goals', icon: '🎯', path: '/goals', category: 'page' },
  { title: 'Achievements', subtitle: 'Badges & milestones', icon: '🏆', path: '/achievements', category: 'page' },
  { title: 'Leaderboard', subtitle: 'Compare with others', icon: '🥇', path: '/leaderboard', category: 'page' },
  { title: 'Friends', subtitle: 'Follow & activity feed', icon: '👥', path: '/friends', category: 'page' },
  { title: 'Profile', subtitle: 'Your account & settings', icon: '👤', path: '/profile', category: 'page' },
  { title: 'AI Coach', subtitle: 'Smart recommendations', icon: '🧠', path: '/ai-coach', category: 'page' },
  { title: 'Exercise Library', subtitle: '36+ exercises with guides', icon: '📚', path: '/exercise-library', category: 'page' },
  { title: 'Calculators', subtitle: '1RM, TDEE, Macros', icon: '💯', path: '/calculators', category: 'page' },
  { title: 'Progress Photos', subtitle: 'Visual progress tracking', icon: '📸', path: '/progress-photos', category: 'page' },
  { title: 'Workout Calendar', subtitle: 'Monthly heatmap view', icon: '🗓️', path: '/calendar', category: 'page' },
  { title: 'Challenges', subtitle: 'Daily fitness challenges', icon: '⚡', path: '/challenges', category: 'page' },
  { title: 'Fitness Tips', subtitle: 'Expert advice', icon: '💡', path: '/tips', category: 'page' },
  { title: 'Reminders', subtitle: 'Workout notifications', icon: '🔔', path: '/reminders', category: 'page' },
  { title: 'Workout Templates', subtitle: 'Save & reuse workouts', icon: '📝', path: '/templates', category: 'page' },
];

const EXERCISES: SearchResult[] = [
  'Bench Press','Incline Bench Press','Push-Up','Cable Fly','Dumbbell Fly',
  'Pull-Up','Lat Pulldown','Barbell Row','Seated Cable Row','Deadlift','Face Pull',
  'Overhead Press','Lateral Raise','Front Raise','Arnold Press','Rear Delt Fly',
  'Barbell Curl','Hammer Curl','Concentration Curl','Preacher Curl','Cable Curl',
  'Skull Crusher','Triceps Pushdown','Overhead Tricep Extension','Close Grip Bench',
  'Squat','Leg Press','Romanian Deadlift','Leg Curl','Calf Raise','Hip Thrust','Lunge',
  'Plank','Crunch','Hanging Leg Raise','Russian Twist','Ab Wheel','Mountain Climber',
].map(name => ({ title: name, icon: '🏋️', path: '/exercise-library', category: 'exercise' as const }));

const ALL_RESULTS = [...PAGES, ...EXERCISES];

const RECENT_KEY = 'fittrack_recent_searches';
const getRecent = (): string[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
};
const addRecent = (q: string) => {
  const prev = getRecent().filter(r => r !== q);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, 5)));
};

const CATEGORY_COLOR: Record<string, string> = {
  page: 'text-blue-400',
  exercise: 'text-emerald-400',
  workout: 'text-orange-400',
};
const CATEGORY_LABEL: Record<string, string> = {
  page: 'Page',
  exercise: 'Exercise',
  workout: 'Workout',
};

const GlobalSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recent, setRecent] = useState<string[]>(getRecent());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); return; }
    setResults(
      ALL_RESULTS.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.subtitle || '').toLowerCase().includes(q)
      ).slice(0, 12)
    );
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    if (query.trim()) addRecent(query.trim());
    setRecent(getRecent());
    navigate(result.path);
  };

  const handleRecentClick = (r: string) => { setQuery(r); };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d0f1a]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">

        {/* Search input */}
        <div className="relative mb-6">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, exercises, features..."
            className="w-full pl-12 pr-12 py-4 rounded-2xl text-base font-medium outline-none transition-all
              bg-white dark:bg-slate-900
              border border-gray-200 dark:border-white/[0.08]
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-slate-500
              focus:border-blue-500 dark:focus:border-blue-500
              focus:ring-2 focus:ring-blue-500/20"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-white/20 transition-all">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Recent searches */}
        {!query && recent.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">Recent</p>
              <button onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]); }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Clear</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recent.map(r => (
                <button key={r} onClick={() => handleRecentClick(r)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all active:scale-95
                    bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400
                    hover:bg-gray-200 dark:hover:bg-white/[0.10]">
                  <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick links (no query) */}
        {!query && (
          <div>
            <p className="text-xs font-black text-gray-400 dark:text-white/30 uppercase tracking-widest mb-3">Quick Access</p>
            <div className="grid grid-cols-2 gap-2">
              {PAGES.slice(0, 8).map(p => (
                <button key={p.path} onClick={() => handleSelect(p)}
                  className="flex items-center gap-3 p-3 rounded-xl text-left transition-all active:scale-95
                    bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]
                    hover:bg-gray-50 dark:hover:bg-white/[0.07]">
                  <span className="text-xl">{p.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{p.title}</div>
                    {p.subtitle && <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{p.subtitle}</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {query && (
          <div>
            {results.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🔍</div>
                <div className="text-gray-500 dark:text-gray-400 font-medium">No results for "{query}"</div>
                <div className="text-gray-400 dark:text-gray-600 text-sm mt-1">Try a different search term</div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {results.map((r, i) => (
                  <button key={i} onClick={() => handleSelect(r)}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all active:scale-[0.99]
                      bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]
                      hover:bg-gray-50 dark:hover:bg-white/[0.07] hover:border-gray-200 dark:hover:border-white/[0.12]">
                    <span className="text-2xl flex-shrink-0">{r.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{r.title}</div>
                      {r.subtitle && <div className="text-xs text-gray-400 dark:text-gray-500">{r.subtitle}</div>}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${CATEGORY_COLOR[r.category]}`}>
                      {CATEGORY_LABEL[r.category]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearchPage;
