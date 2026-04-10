import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { haptics } from '../utils/haptics';

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
        <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none">
          {active ? (
            <path fill="currentColor" d="M10.707 2.293a1 1 0 0 1 1.414 0l7.071 7.07A1 1 0 0 1 19 11h-1v9a1 1 0 0 1-1 1h-4v-5H11v5H7a1 1 0 0 1-1-1v-9H5a1 1 0 0 1-.707-1.707l6.414-6.413Z"/>
          ) : (
            <path stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
              d="m3 12 2-2m0 0 7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11 2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6"/>
          )}
        </svg>
      ),
    },
    {
      path: '/explore',
      label: 'Explore',
      icon: (active: boolean) => (
        <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none">
          {active ? (
            <path fill="currentColor" d="M11 2a9 9 0 1 0 0 18A9 9 0 0 0 11 2Zm0 16A7 7 0 1 1 11 4a7 7 0 0 1 0 14Zm4.243-10.657-4.95 2.122-2.121 4.95 4.95-2.121 2.121-4.951Zm-4.95 4.243a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/>
          ) : (
            <path stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
              d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12ZM12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
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
        <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none">
          {active ? (
            <path fill="currentColor" d="M3 3a1 1 0 0 0-1 1v7a9 9 0 0 0 7 8.72V21H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-1v-1.28A9 9 0 0 0 22 11V4a1 1 0 0 0-1-1H3Zm16 8a7 7 0 0 1-14 0V5h14v6Z"/>
          ) : (
            <path stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
              d="M3 2v7c0 4.97 4.03 9 9 9s9-4.03 9-9V2M3 7h18M12 21v-3"/>
          )}
        </svg>
      ),
    },
    {
      path: '/stats',
      label: t('nav.stats'),
      icon: (active: boolean) => (
        <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none">
          {active ? (
            <path fill="currentColor" d="M3 3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h18a1 1 0 1 0 0-2H4V4a1 1 0 0 0-1-1Zm14 3a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1Zm-4 3a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0v-4a1 1 0 0 1 1-1Zm-4 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Z"/>
          ) : (
            <path stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
              d="M16 8v8M12 11v5M8 14v2M3 3h.01M4 20h16a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1Z"/>
          )}
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

  return (
    <nav
      className="fixed left-0 right-0 bottom-0 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Single clean frosted glass layer — no double overlays */}
      <div
        className="absolute inset-0"
        style={{
          background: 'var(--bottom-nav-bg, rgba(255,255,255,0.92))',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderTop: 'var(--bottom-nav-border, 0.5px solid rgba(0,0,0,0.12))',
        }}
      />

      <div className="relative flex items-stretch h-[52px]">
        {tabs.map((tab) => {
          const active = isActive(tab);

          if (tab.center) {
            return (
              <div key={tab.path} className="flex-1 flex justify-center items-center">
                <button
                  onClick={() => { haptics.success(); navigate(tab.path); }}
                  aria-label={tab.label}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-transform duration-150 active:scale-[0.88] touch-manipulation"
                  style={{
                    background: 'linear-gradient(140deg, var(--p-from), var(--p-to))',
                    boxShadow: '0 2px 12px var(--p-shadow)',
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
              onClick={() => { haptics.tap(); navigate(tab.path); }}
              aria-label={tab.label}
              className="relative flex-1 flex flex-col items-center justify-center gap-[3px] pt-2 pb-1.5 transition-opacity duration-150 active:opacity-50 touch-manipulation"
            >
              {/* Active hairline at top */}
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{ width: 28, height: 2.5, background: 'var(--p-500)' }}
                />
              )}

              {/* Icon */}
              <span style={{ color: active ? 'var(--p-500)' : undefined }}
                className={active ? '' : 'text-gray-500 dark:text-gray-400'}>
                {tab.icon(active)}
              </span>

              {/* Label */}
              <span
                className={`text-[10px] font-semibold leading-none ${active ? '' : 'text-gray-500 dark:text-gray-400'}`}
                style={{ color: active ? 'var(--p-500)' : undefined }}
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

export default BottomNav;
