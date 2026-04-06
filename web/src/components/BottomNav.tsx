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
        <svg className="w-[22px] h-[22px]" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: '/workout-plans',
      label: t('nav.workoutPlans'),
      icon: (active: boolean) => (
        <svg className="w-[22px] h-[22px]" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
        <svg className="w-[22px] h-[22px]" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      path: '/stats',
      label: t('nav.stats'),
      icon: (active: boolean) => (
        <svg className="w-[22px] h-[22px]" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

  const navTabs = tabs.filter(t => !t.center);
  const activeIdx = navTabs.findIndex(t => isActive(t));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Top border glow line */}
      <div className="h-px w-full" style={{
        background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)',
      }} />

      <div
        className="backdrop-blur-2xl"
        style={{
          background: 'rgba(255,255,255,0.93)',
          borderTop: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.08)',
        }}
      >
        <style>{`
          .dark .bottom-nav-inner {
            background: rgba(13,15,26,0.97) !important;
            border-top-color: rgba(255,255,255,0.06) !important;
            box-shadow: 0 -8px 32px rgba(0,0,0,0.5) !important;
          }
        `}</style>
        <div className="bottom-nav-inner relative flex items-center h-[60px] px-2">

          {/* Sliding active pill */}
          <SlidingPill tabs={tabs} activeIdx={activeIdx} />

          {tabs.map((tab) => {
            const active = isActive(tab);

            if (tab.center) {
              return (
                <div key={tab.path} className="flex-1 flex justify-center items-center">
                  <button
                    onClick={() => navigate(tab.path)}
                    className="w-[52px] h-[52px] -mt-7 rounded-2xl flex items-center justify-center text-white transition-all duration-300 active:scale-90"
                    style={{
                      background: 'linear-gradient(135deg, var(--p-from), var(--p-to))',
                      boxShadow: '0 8px 24px var(--p-shadow), 0 1px 0 rgba(255,255,255,0.15) inset',
                    }}
                  >
                    {tab.icon(active)}
                  </button>
                </div>
              );
            }

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all duration-200 active:scale-90 z-10"
              >
                {/* Icon */}
                <span
                  className="transition-all duration-300"
                  style={{ color: active ? 'var(--p-text)' : undefined }}
                >
                  <span className={`transition-colors duration-300 ${active ? '' : 'text-gray-400 dark:text-gray-600'}`}>
                    {tab.icon(active)}
                  </span>
                </span>

                {/* Label */}
                <span
                  className={`text-[9px] font-bold tracking-wide transition-all duration-300 ${
                    active ? '' : 'text-gray-400 dark:text-gray-600'
                  }`}
                  style={active ? { color: 'var(--p-text)' } : {}}
                >
                  {tab.label}
                </span>

                {/* Active dot indicator */}
                {active && (
                  <span
                    className="absolute bottom-1 w-1 h-1 rounded-full nav-dot"
                    style={{ background: 'var(--p-500)' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

// ── Sliding pill that moves between active tabs ─────────────────────────────
const SlidingPill: React.FC<{
  tabs: Array<{ path: string; center?: boolean }>;
  activeIdx: number;
}> = ({ tabs, activeIdx }) => {
  const totalSlots = tabs.length;
  const slotWidth = 100 / totalSlots;

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
      className="absolute top-2 bottom-2 rounded-2xl pointer-events-none"
      style={{
        width: `calc(${slotWidth}% - 8px)`,
        left: `calc(${slot * slotWidth}% + 4px)`,
        background: 'color-mix(in srgb, var(--p-500) 10%, transparent)',
        transition: 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    />
  );
};

export default BottomNav;
