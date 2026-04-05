import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../i18n';

const SHORTCUTS = [
  { key: 'N', description: 'Start new workout', path: '/workout' },
  { key: 'H', description: 'Workout history', path: '/workout-history' },
  { key: 'S', description: 'Stats & analytics', path: '/stats' },
  { key: 'C', description: 'Daily challenges', path: '/challenges' },
  { key: 'M', description: 'Body measurements', path: '/measurements' },
  { key: 'W', description: 'Water intake', path: '/water' },
  { key: 'T', description: 'Workout templates', path: '/templates' },
  { key: '?', description: 'Show keyboard shortcuts', path: '' },
];

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, colorTheme, fontSize, toggleTheme, setColorTheme, setFontSize } = useTheme();
  const { t, i18n } = useTranslation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!localStorage.getItem('token');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const changeLanguage = (code: LanguageCode) => {
    i18n.changeLanguage(code);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      switch (e.key) {
        case '?': setShowShortcuts(s => !s); break;
        case 'Escape': setShowShortcuts(false); setSettingsOpen(false); setMobileMenuOpen(false); break;
        case 'n': case 'N': navigate('/workout'); break;
        case 'h': case 'H': navigate('/workout-history'); break;
        case 's': case 'S': navigate('/stats'); break;
        case 'c': case 'C': navigate('/challenges'); break;
        case 'm': case 'M': navigate('/measurements'); break;
        case 'w': case 'W': navigate('/water'); break;
        case 't': case 'T': navigate('/templates'); break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLoggedIn, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  const handleNavigation = (path: string) => { navigate(path); setMobileMenuOpen(false); };

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/workout-plans', label: t('plans.title') },
    { path: '/workout', label: t('nav.workout') },
    { path: '/workout-history', label: t('nav.workoutHistory') },
    { path: '/stats', label: t('nav.stats') },
    { path: '/achievements', label: t('nav.achievements') },
    { path: '/profile', label: t('nav.profile') },
  ];

  const moreLinks = [
    { path: '/nutrition', label: `🥗 ${t('nav.nutrition')}` },
    { path: '/calendar', label: `📅 ${t('nav.calendar')}` },
    { path: '/measurements', label: `📏 ${t('nav.measurements')}` },
    { path: '/water', label: `💧 ${t('nav.water')}` },
    { path: '/templates', label: `📋 ${t('nav.templates')}` },
    { path: '/ai-coach', label: `🧠 AI Coach` },
    { path: '/calculators', label: `💯 ${t('nav.calculators')}` },
    { path: '/challenges', label: `🎯 ${t('nav.challenges')}` },
    { path: '/exercise-library', label: `📚 ${t('nav.exerciseLibrary')}` },
    { path: '/tips', label: `💡 ${t('nav.tips')}` },
    { path: '/reminders', label: `🔔 ${t('nav.reminders')}` },
    { path: '/progress-photos', label: `📸 ${t('nav.progressPhotos')}` },
    { path: '/leaderboard', label: `🏆 ${t('nav.leaderboard')}` },
  ];

  const colorOptions = [
    { value: 'blue', label: t('settings.blue'), bg: 'bg-blue-600' },
    { value: 'orange', label: t('settings.orange'), bg: 'bg-orange-500' },
    { value: 'purple', label: t('settings.purple'), bg: 'bg-purple-600' },
    { value: 'green', label: t('settings.green'), bg: 'bg-green-600' },
  ] as const;

  const initials = (user.username || 'U').slice(0, 2).toUpperCase();

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-gray-200/60 dark:border-slate-800/60 backdrop-blur-xl bg-white/85 dark:bg-slate-950/90 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <button
              onClick={() => handleNavigation('/')}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, var(--p-from), var(--p-to))', boxShadow: '0 4px 16px var(--p-shadow)' }}>
                <span className="text-white text-sm font-black">F</span>
              </div>
              <span className="text-lg font-black tracking-tight bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(to right, var(--p-from), var(--p-to))' }}>
                FitTrack Pro
              </span>
            </button>

            {/* Desktop Nav */}
            {isLoggedIn && (
              <div className="hidden lg:flex items-center gap-1">
                {navLinks.map(link => (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(link.path)
                        ? 'dark:bg-white/5'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                    style={isActive(link.path) ? { color: 'var(--p-text)', background: 'color-mix(in srgb, var(--p-500) 10%, transparent)' } : {}}
                  >
                    {link.label}
                    {isActive(link.path) && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ background: 'var(--p-500)' }} />
                    )}
                  </button>
                ))}
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-all duration-200"
                >
                  {t('nav.more')}
                  <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Right Controls */}
            <div className="hidden md:flex items-center gap-2">
              {isLoggedIn && (
                <>
                  {/* Shortcut hint */}
                  <button
                    onClick={() => setShowShortcuts(true)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-mono font-bold transition-all"
                    title="Keyboard shortcuts"
                  >
                    ?
                  </button>

                  {/* Dark mode toggle */}
                  <button
                    onClick={toggleTheme}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                  >
                    {theme === 'light'
                      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    }
                  </button>

                  {/* Settings dropdown */}
                  <div className="relative" ref={settingsRef}>
                    <button
                      onClick={() => setSettingsOpen(!settingsOpen)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                      title="Settings"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>

                    {settingsOpen && (
                      <div className="absolute right-0 top-11 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 p-5 z-50 animate-slide-down">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">{t('settings.appearance')}</p>

                        <div className="flex justify-between items-center mb-5">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.darkMode')}</span>
                          <button onClick={toggleTheme}
                            className="relative w-11 h-6 rounded-full transition-colors duration-200"
                            style={{ background: theme === 'dark' ? 'var(--p-500)' : '#e5e7eb' }}>
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${theme === 'dark' ? 'translate-x-5' : ''}`} />
                          </button>
                        </div>

                        <div className="mb-5">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('settings.colorTheme')}</p>
                          <div className="flex gap-2">
                            {colorOptions.map(c => (
                              <button key={c.value} onClick={() => setColorTheme(c.value)} title={c.label}
                                className={`relative w-10 h-10 rounded-xl ${c.bg} transition-all hover:scale-105 active:scale-95`}>
                                {colorTheme === c.value && (
                                  <span className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="mb-5">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.fontSize')}</p>
                          <div className="flex gap-2">
                            {([
                              { key: 'small',  label: 'A',  size: 'text-xs'  },
                              { key: 'medium', label: 'A',  size: 'text-sm'  },
                              { key: 'large',  label: 'A',  size: 'text-base' },
                            ] as const).map(s => (
                              <button key={s.key} onClick={() => setFontSize(s.key)}
                                className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${s.size} ${
                                  fontSize === s.key
                                    ? 'text-white shadow-lg'
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                                }`}
                                style={fontSize === s.key ? { background: 'linear-gradient(to right, var(--p-from), var(--p-to))' } : {}}>
                                {s.label}
                              </button>
                            ))}
                          </div>
                          <div className="flex text-[10px] text-gray-400 mt-1.5">
                            <span className="flex-1 text-center">{t('settings.small')}</span>
                            <span className="flex-1 text-center">{t('settings.medium')}</span>
                            <span className="flex-1 text-center">{t('settings.large')}</span>
                          </div>
                        </div>

                        {/* Language switcher */}
                        <div className="mb-5">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.language')}</p>
                          <div className="flex gap-2">
                            {SUPPORTED_LANGUAGES.map(lang => (
                              <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                                  i18n.language === lang.code
                                    ? 'text-white shadow-lg'
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                                }`}
                                style={i18n.language === lang.code ? { background: 'linear-gradient(to right, var(--p-from), var(--p-to))' } : {}}
                                title={lang.label}
                              >
                                <span>{lang.flag}</span>
                                <span>{lang.code.toUpperCase()}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
                          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{t('settings.quickLinks')}</p>
                          <div className="grid grid-cols-2 gap-1">
                            {moreLinks.map(link => (
                              <button key={link.path} onClick={() => { navigate(link.path); setSettingsOpen(false); }}
                                className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${isActive(link.path) ? '' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100'}`}
                                style={isActive(link.path) ? { background: 'color-mix(in srgb, var(--p-500) 10%, transparent)', color: 'var(--p-text)' } : undefined}>
                                {link.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1" />

                  {/* User avatar */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                      style={{ background: 'linear-gradient(135deg, var(--p-from), var(--p-to))' }}>
                      {initials}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden lg:block">
                      {user.username || 'User'}
                    </span>
                  </div>

                  <button onClick={handleLogout}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 font-medium transition-colors px-2">
                    {t('nav.signOut')}
                  </button>
                </>
              )}
              {!isLoggedIn && (
                <>
                  <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 transition-colors">{t('nav.login')}</button>
                  <button onClick={() => navigate('/register')} className="btn-primary text-sm py-2 px-5">{t('nav.signUpFree')}</button>
                </>
              )}
            </div>

            {/* Mobile: if logged in → show dark toggle + avatar (BottomNav handles the rest) */}
            {isLoggedIn ? (
              <div className="md:hidden flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                >
                  {theme === 'light'
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                  }
                </button>
                <button onClick={() => navigate('/profile')}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md"
                  style={{ background: 'linear-gradient(135deg, var(--p-from), var(--p-to))' }}>
                  {initials}
                </button>
              </div>
            ) : (
              /* Mobile: not logged in → hamburger */
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            )}
          </div>

          {/* Mobile Menu — only for logged-out users (logged-in users use BottomNav) */}
          {mobileMenuOpen && !isLoggedIn && (
            <div className="md:hidden pb-4 animate-slide-down border-t border-gray-100 dark:border-slate-800 mt-1 pt-3">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => handleNavigation('/login')} className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl font-medium text-sm">{t('nav.login')}</button>
                <button onClick={() => handleNavigation('/register')} className="mx-1 px-4 py-3 text-white rounded-xl font-semibold text-sm"
                  style={{ background: 'linear-gradient(to right, var(--p-from), var(--p-to))' }}>{t('nav.signUpFree')}</button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in"
          onClick={e => e.target === e.currentTarget && setShowShortcuts(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 dark:border-slate-800 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('settings.keyboard')}</h2>
              <button onClick={() => setShowShortcuts(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">✕</button>
            </div>
            <div className="space-y-1">
              {SHORTCUTS.map(s => (
                <div key={s.key} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-slate-800 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{s.description}</span>
                  <kbd className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg text-xs font-mono font-bold shadow-sm">{s.key}</kbd>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">Press <kbd className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">Esc</kbd> to close</p>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
