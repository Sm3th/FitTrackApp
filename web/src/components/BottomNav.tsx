import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isLoggedIn = !!localStorage.getItem('token');

  const tabs = [
    {
      path: '/',
      exact: true,
      label: t('nav.home'),
      icon: (active: boolean) => (
        <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: '/workout-plans',
      label: t('nav.workoutPlans'),
      icon: (active: boolean) => (
        <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      path: '/workout',
      center: true,
      label: t('nav.workout'),
      icon: (_: boolean) => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      path: '/nutrition',
      label: t('nav.nutrition'),
      icon: (active: boolean) => (
        <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      path: '/stats',
      label: t('nav.stats'),
      icon: (active: boolean) => (
        <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  if (!isLoggedIn) return null;
  if (['/login', '/register'].includes(location.pathname)) return null;
  if (location.pathname.startsWith('/guided-workout')) return null;

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.exact) return location.pathname === tab.path;
    return location.pathname.startsWith(tab.path);
  };

  // Non-center tabs only (for pill positioning)
  const navTabs = tabs.filter(t => !t.center);
  const activeIdx = navTabs.findIndex(t => isActive(t));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="bg-white/92 dark:bg-slate-950/95 backdrop-blur-2xl border-t border-gray-200/60 dark:border-slate-800/80 shadow-2xl shadow-black/10">
        <div className="relative flex items-center h-16 px-2">

          {/* Sliding active pill background */}
          <SlidingPill tabs={tabs} activeIdx={activeIdx} />

          {tabs.map((tab) => {
            const active = isActive(tab);

            if (tab.center) {
              return (
                <div key={tab.path} className="flex-1 flex justify-center items-center">
                  <button
                    onClick={() => navigate(tab.path)}
                    className="w-14 h-14 -mt-6 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all duration-200 active:scale-90"
                    style={{
                      background: 'linear-gradient(135deg, var(--p-from), var(--p-to))',
                      boxShadow: '0 8px 24px var(--p-shadow)',
                    }}>
                    {tab.icon(active)}
                  </button>
                </div>
              );
            }

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 h-full pt-1 transition-all duration-200 active:scale-90 z-10">
                <span
                  className="transition-all duration-300"
                  style={{ color: active ? 'var(--p-text)' : undefined }}>
                  <span className={active ? '' : 'text-gray-400 dark:text-gray-500'}>
                    {tab.icon(active)}
                  </span>
                </span>
                <span
                  className="text-[10px] font-bold transition-colors duration-300"
                  style={{ color: active ? 'var(--p-text)' : undefined }}>
                  <span className={active ? '' : 'text-gray-400 dark:text-gray-500'}>
                    {tab.label}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

// ── Sliding pill that moves between active tabs ───────────────────────────────
const SlidingPill: React.FC<{
  tabs: Array<{ path: string; center?: boolean }>;
  activeIdx: number;
}> = ({ tabs, activeIdx }) => {
  // Each non-center tab gets 1/total share; center gets same share
  const totalSlots = tabs.length;
  const slotWidth = 100 / totalSlots;

  // Map activeIdx (among non-center tabs) to actual slot position
  // tabs: [0=home, 1=plans, 2=center, 3=nutrition, 4=stats]
  // non-center indices: home=0→slot0, plans=1→slot1, nutrition=2→slot3, stats=3→slot4
  const getSlotFromActiveIdx = (idx: number) => {
    if (idx === -1) return -1;
    let slot = 0;
    let nonCenterSeen = 0;
    for (let i = 0; i < tabs.length; i++) {
      if (!tabs[i].center) {
        if (nonCenterSeen === idx) { slot = i; break; }
        nonCenterSeen++;
      }
    }
    return slot;
  };

  const slot = getSlotFromActiveIdx(activeIdx);
  if (slot === -1) return null;

  return (
    <div
      className="absolute top-2 bottom-2 rounded-xl pointer-events-none"
      style={{
        width: `calc(${slotWidth}% - 6px)`,
        left: `calc(${slot * slotWidth}% + 3px)`,
        background: 'color-mix(in srgb, var(--p-500) 10%, transparent)',
        transition: 'left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    />
  );
};

export default BottomNav;
