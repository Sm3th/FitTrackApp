import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Pages where the FAB should NOT appear
const HIDDEN_PATHS = [
  '/login', '/register', '/workout', '/guided-workout',
];

const WorkoutFAB: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const isLoggedIn = !!localStorage.getItem('token');
  const isHidden = HIDDEN_PATHS.some(p => pathname.startsWith(p));

  if (!isLoggedIn || isHidden) return null;

  const actions = [
    { label: 'Free Workout', icon: '💪', path: '/workout', grad: 'from-blue-600 to-indigo-600' },
    { label: 'Browse Plans', icon: '📋', path: '/workout-plans', grad: 'from-violet-600 to-purple-600' },
    { label: 'Log Nutrition', icon: '🥗', path: '/nutrition', grad: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="fixed bottom-[100px] right-4 z-40 md:hidden flex flex-col items-end gap-2">
        {/* Action buttons */}
        {open && actions.map((action, i) => (
          <div key={action.path}
            className="flex items-center gap-3 animate-fade-up"
            style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
            <div className="bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 whitespace-nowrap">
              {action.label}
            </div>
            <button
              onClick={() => { setOpen(false); navigate(action.path); }}
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.grad} flex items-center justify-center text-xl shadow-xl active:scale-95 transition-transform`}>
              {action.icon}
            </button>
          </div>
        ))}

        {/* Main FAB */}
        <button
          onClick={() => setOpen(prev => !prev)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-95 ${
            open
              ? 'bg-gray-800 dark:bg-slate-700 rotate-45'
              : 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/40'
          }`}>
          <svg className={`w-6 h-6 text-white transition-transform duration-300 ${open ? 'rotate-45' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </>
  );
};

export default WorkoutFAB;
