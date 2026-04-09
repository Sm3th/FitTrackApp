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
        <svg className="w-[21px] h-[21px]" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.75}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: '/explore',
      label: 'Explore',
      icon: (active: boolean) => (
        <svg className="w-[21px] h-[21px]" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          {active ? (
            <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          )}
        </svg>
      ),
    },
    {
      path: '/workout',
      center: true,
      label: t('nav.workout'),
      icon: (_: boolean) => (
        <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      path: '/nutrition',
      label: t('nav.nutrition'),
      icon: (active: boolean) => (
        <svg className="w-[21px] h-[21px]" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.75}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      path: '/stats',
      label: t('nav.stats'),
      icon: (active: boolean) => (
        <svg className="w-[21px] h-[21px]" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.75}
            d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
      className="fixed left-0 right-0 z-50 md:hidden flex justify-center px-3"
      style={{ bottom: 'max(10px, env(safe-area-inset-bottom))' }}
    >
      <div
        className="surface-bottom-nav-float backdrop-blur-2xl relative flex items-center w-full"
        style={{ borderRadius: 22, height: 62, maxWidth: 430, padding: '0 4px' }}
      >
        {/* Sliding active indicator */}
        <SlidingPill tabs={tabs} activeIdx={activeIdx} />

        {tabs.map((tab) => {
          const active = isActive(tab);

          if (tab.center) {
            return (
              <div key={tab.path} className="flex-1 flex justify-center items-center">
                <button
                  onClick={() => navigate(tab.path)}
                  className="w-11 h-11 rounded-[16px] flex items-center justify-center text-white transition-all duration-300 active:scale-[0.88]"
                  style={{
                    background: 'linear-gradient(140deg, var(--p-from), var(--p-to))',
                    boxShadow: '0 4px 18px var(--p-shadow), 0 1px 0 rgba(255,255,255,0.2) inset',
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
              className="relative flex-1 flex flex-col items-center justify-center h-full z-10 transition-all duration-200 active:scale-90"
            >
              <span
                className={`transition-all duration-300 mb-[2px] ${active ? '' : 'text-gray-400 dark:text-gray-500'}`}
                style={active ? { color: 'var(--p-text)' } : {}}
              >
                {tab.icon(active)}
              </span>
              <span
                className={`text-[9px] font-bold leading-none tracking-wide transition-all duration-300 ${
                  active ? '' : 'text-gray-400 dark:text-gray-500'
                }`}
                style={active ? { color: 'var(--p-text)' } : {}}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// Sliding pill indicator
const SlidingPill: React.FC<{
  tabs: Array<{ path: string; center?: boolean }>;
  activeIdx: number;
}> = ({ tabs, activeIdx }) => {
  const totalSlots = tabs.length;
  const slotWidth = 100 / totalSlots;

  const getSlot = (idx: number) => {
    if (idx === -1) return -1;
    let slot = 0, seen = 0;
    for (let i = 0; i < tabs.length; i++) {
      if (!tabs[i].center) {
        if (seen === idx) { slot = i; break; }
        seen++;
      }
    }
    return slot;
  };

  const slot = getSlot(activeIdx);
  if (slot === -1) return null;

  return (
    <div
      className="absolute top-[6px] bottom-[6px] pointer-events-none rounded-[16px]"
      style={{
        width: `calc(${slotWidth}% - 8px)`,
        left: `calc(${slot * slotWidth}% + 4px)`,
        background: 'color-mix(in srgb, var(--p-500) 12%, transparent)',
        transition: 'left 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    />
  );
};

export default BottomNav;
