import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

interface Feature {
  path: string;
  label: string;
  icon: string;
  desc: string;
}

interface Category {
  id: string;
  title: string;
  emoji: string;
  color: string;
  bg: string;
  items: Feature[];
}

const CATEGORIES: Category[] = [
  {
    id: 'train',
    title: 'Train',
    emoji: '💪',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
    items: [
      { path: '/workout',          label: 'Free Workout',    icon: '🏋️', desc: 'Start a custom session'   },
      { path: '/workout-plans',    label: 'Programs',        icon: '📋', desc: 'Follow a training plan'   },
      { path: '/templates',        label: 'Templates',       icon: '📝', desc: 'Your saved workouts'       },
      { path: '/exercise-library', label: 'Exercise Library',icon: '📚', desc: '36+ exercises & guides'   },
      { path: '/ai-coach',         label: 'AI Coach',        icon: '🧠', desc: 'Personalised tips'        },
      { path: '/challenges',       label: 'Challenges',      icon: '⚡', desc: 'Daily fitness goals'      },
    ],
  },
  {
    id: 'progress',
    title: 'Progress',
    emoji: '📊',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    items: [
      { path: '/stats',            label: 'Statistics',      icon: '📊', desc: 'Charts & personal records'},
      { path: '/body-score',       label: 'Body Score',      icon: '🧬', desc: 'Muscle balance analysis'  },
      { path: '/workout-history',  label: 'History',         icon: '📋', desc: 'All past sessions'        },
      { path: '/calendar',         label: 'Calendar',        icon: '🗓️', desc: 'Monthly heatmap'         },
      { path: '/measurements',     label: 'Measurements',    icon: '📏', desc: 'Body metrics over time'   },
      { path: '/progress-photos',  label: 'Progress Photos', icon: '📸', desc: 'Visual transformation'    },
    ],
  },
  {
    id: 'nutrition',
    title: 'Nutrition',
    emoji: '🥗',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    items: [
      { path: '/nutrition',        label: 'Food Log',        icon: '🥗', desc: 'Track calories & macros'  },
      { path: '/water',            label: 'Hydration',       icon: '💧', desc: 'Daily water intake'       },
      { path: '/calculators',      label: 'Calculators',     icon: '💯', desc: '1RM · TDEE · Macros'      },
    ],
  },
  {
    id: 'social',
    title: 'Community',
    emoji: '🏆',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
    items: [
      { path: '/achievements',     label: 'Achievements',    icon: '🏆', desc: 'Badges & milestones'      },
      { path: '/leaderboard',      label: 'Leaderboard',     icon: '🥇', desc: 'Compare with others'      },
      { path: '/friends',          label: 'Friends',         icon: '👥', desc: 'Activity feed'            },
      { path: '/goals',            label: 'Goals',           icon: '🎯', desc: 'Set & track targets'      },
    ],
  },
  {
    id: 'tools',
    title: 'Tools & Settings',
    emoji: '⚙️',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.1)',
    items: [
      { path: '/tips',             label: 'Fitness Tips',    icon: '💡', desc: 'Expert advice'            },
      { path: '/reminders',        label: 'Reminders',       icon: '🔔', desc: 'Workout notifications'    },
      { path: '/profile',          label: 'Profile',         icon: '👤', desc: 'Account & stats'          },
      { path: '/settings',         label: 'Settings',        icon: '⚙️', desc: 'App preferences'         },
    ],
  },
];

const ALL_FEATURES = CATEGORIES.flatMap(c => c.items.map(i => ({ ...i, category: c.title, color: c.color })));

const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const results = query.trim()
    ? ALL_FEATURES.filter(f =>
        f.label.toLowerCase().includes(query.toLowerCase()) ||
        f.desc.toLowerCase().includes(query.toLowerCase()) ||
        f.category.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d0f1a]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pt-5 pb-32">

        {/* Page title */}
        <div className="mb-5">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Explore</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">All features in one place</p>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search features..."
            className="w-full pl-11 pr-11 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all
              bg-white dark:bg-white/[0.04]
              border border-gray-200 dark:border-white/[0.07]
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-600
              focus:border-blue-500 dark:focus:border-blue-500
              focus:ring-2 focus:ring-blue-500/15"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center
                bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400
                hover:bg-gray-300 dark:hover:bg-white/20 transition-all">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search results */}
        {results !== null ? (
          <div className="space-y-2">
            {results.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">No results for "{query}"</p>
              </div>
            ) : results.map(f => (
              <button key={f.path} onClick={() => navigate(f.path)}
                className="w-full flex items-center gap-3.5 p-4 rounded-2xl text-left transition-all active:scale-[0.98]
                  bg-white dark:bg-white/[0.04]
                  border border-gray-100 dark:border-white/[0.06]
                  hover:bg-gray-50 dark:hover:bg-white/[0.07]"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${f.color}15`, border: `1.5px solid ${f.color}25` }}>
                  {f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-gray-900 dark:text-white">{f.label}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{f.desc}</div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: f.color }}>{f.category}</span>
              </button>
            ))}
          </div>
        ) : (
          /* Category grid */
          <div className="space-y-6">
            {CATEGORIES.map(cat => (
              <div key={cat.id}>
                {/* Category header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: cat.bg }}>
                    {cat.emoji}
                  </div>
                  <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
                    {cat.title}
                  </h2>
                  <div className="flex-1 h-px bg-gray-100 dark:bg-white/[0.05]" />
                </div>

                {/* Feature grid — 2 columns */}
                <div className="grid grid-cols-2 gap-2.5">
                  {cat.items.map(item => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all active:scale-95 group
                        bg-white dark:bg-white/[0.03]
                        border border-gray-100 dark:border-white/[0.05]
                        hover:bg-gray-50 dark:hover:bg-white/[0.07]
                        hover:border-gray-200 dark:hover:border-white/[0.1]"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0
                        transition-transform duration-200 group-hover:scale-110"
                        style={{ background: cat.bg }}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5 leading-tight truncate">
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
