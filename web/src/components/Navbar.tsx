import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../i18n';
import { useScrollDirection } from '../hooks/useScrollDirection';

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
      // Cmd/Ctrl+K → global search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); navigate('/search'); return; }
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
    { path: '/explore', label: 'Explore' },
    { path: '/workout', label: t('nav.workout') },
    { path: '/stats', label: t('nav.stats') },
    { path: '/nutrition', label: t('nav.nutrition') },
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
    { path: '/friends',     label: `👥 Friends` },
    { path: '/goals',       label: `🎯 Goals` },
    { path: '/settings',    label: `⚙️ Settings` },
  ];

  const colorOptions = [
    { value: 'blue', label: t('settings.blue'), bg: 'bg-blue-600' },
    { value: 'orange', label: t('settings.orange'), bg: 'bg-orange-500' },
    { value: 'purple', label: t('settings.purple'), bg: 'bg-purple-600' },
    { value: 'green', label: t('settings.green'), bg: 'bg-green-600' },
  ] as const;

  const initials = (user.username || 'U').slice(0, 2).toUpperCase();
  const { direction, scrolled } = useScrollDirection();
  const hidden = direction === 'down' && scrolled;

  return (
    <>
      <nav
        className="sticky top-0 z-50 surface-nav backdrop-blur-2xl"
        style={{
          transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <button
              onClick={() => handleNavigation('/')}
              className="flex items-center gap-2.5 group shrink-0"
            >
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-transform duration-200 group-active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, var(--p-from), var(--p-to))',
                }}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>
                </svg>
              </div>
              <span className="text-[15px] font-bold tracking-tight text-gray-900 dark:text-white">
                FitTrack
              </span>
            </button>

            {/* Desktop Nav */}
            {isLoggedIn && (
              <div className="hidden lg:flex items-center gap-0.5">
                {navLinks.map(link => (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive(link.path)
                        ? ''
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-white/[0.06]'
                    }`}
                    style={isActive(link.path) ? {
                      color: 'var(--p-text)',
                      background: 'color-mix(in srgb, var(--p-500) 12%, transparent)',
                    } : {}}
                  >
                    {link.label}
                    {isActive(link.path) && (
                      <span className="nav-dot absolute bottom-1 left-1/2 w-1 h-1 rounded-full"
                        style={{ background: 'var(--p-500)', transform: 'translateX(-50%)' }} />
                    )}
                  </button>
                ))}
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-white/[0.06] flex items-center gap-1 transition-all duration-200"
                >
                  {t('nav.more')}
                  <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Right Controls */}
            <div className="hidden md:flex items-center gap-1.5">
              {isLoggedIn && (
                <>
                  {/* Global search */}
                  <button
                    onClick={() => navigate('/search')}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all"
                    title="Search (⌘K)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>

                  {/* Shortcut hint */}
                  <button
                    onClick={() => setShowShortcuts(true)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] text-xs font-mono font-bold transition-all"
                    title="Keyboard shortcuts"
                  >
                    ?
                  </button>

                  {/* Dark mode toggle */}
                  <button
                    onClick={toggleTheme}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-gray-200 transition-all"
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
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        settingsOpen
                          ? 'text-white'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                      style={settingsOpen ? { background: 'linear-gradient(135deg, var(--p-from), var(--p-to))' } : {}}
                      title="Settings"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>

                    {settingsOpen && (
                      <div className="absolute right-0 top-11 w-80 rounded-2xl z-50 animate-slide-down overflow-hidden surface-dropdown">
                        <div className="p-5">
                          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">{t('settings.appearance')}</p>

                          <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('settings.darkMode')}</span>
                            <button onClick={toggleTheme}
                              className="relative w-12 h-6 rounded-full transition-all duration-300"
                              style={{ background: theme === 'dark' ? 'linear-gradient(135deg, var(--p-from), var(--p-to))' : '#e5e7eb' }}>
                              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : ''}`} />
                            </button>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">{t('settings.colorTheme')}</p>
                            <div className="flex gap-2">
                              {colorOptions.map(c => (
                                <button key={c.value} onClick={() => setColorTheme(c.value)} title={c.label}
                                  className={`relative w-10 h-10 rounded-xl ${c.bg} transition-all hover:scale-110 active:scale-95 shadow-sm`}>
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

                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('settings.fontSize')}</p>
                            <div className="flex gap-2">
                              {([
                                { key: 'small',  label: 'A',  size: 'text-xs'  },
                                { key: 'medium', label: 'A',  size: 'text-sm'  },
                                { key: 'large',  label: 'A',  size: 'text-base' },
                              ] as const).map(s => (
                                <button key={s.key} onClick={() => setFontSize(s.key)}
                                  className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${s.size} ${
                                    fontSize === s.key
                                      ? 'text-white shadow-lg'
                                      : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                                  }`}
                                  style={fontSize === s.key ? { background: 'linear-gradient(135deg, var(--p-from), var(--p-to))' } : {}}>
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

                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('settings.language')}</p>
                            <div className="flex gap-2">
                              {SUPPORTED_LANGUAGES.map(lang => (
                                <button
                                  key={lang.code}
                                  onClick={() => changeLanguage(lang.code)}
                                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    i18n.language === lang.code
                                      ? 'text-white shadow-lg'
                                      : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                                  }`}
                                  style={i18n.language === lang.code ? { background: 'linear-gradient(135deg, var(--p-from), var(--p-to))' } : {}}
                                  title={lang.label}
                                >
                                  <span>{lang.flag}</span>
                                  <span>{lang.code.toUpperCase()}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">{t('settings.quickLinks')}</p>
                            <div className="grid grid-cols-2 gap-1">
                              {moreLinks.map(link => (
                                <button key={link.path} onClick={() => { navigate(link.path); setSettingsOpen(false); }}
                                  className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${isActive(link.path) ? '' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-gray-100'}`}
                                  style={isActive(link.path) ? { background: 'color-mix(in srgb, var(--p-500) 12%, transparent)', color: 'var(--p-text)' } : undefined}>
                                  {link.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-0.5" />

                  {/* User avatar */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, var(--p-from), var(--p-to))',
                        boxShadow: '0 2px 8px var(--p-shadow)',
                      }}>
                      {initials}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden lg:block">
                      {user.username || 'User'}
                    </span>
                  </div>

                  <button onClick={handleLogout}
                    className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 font-semibold transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20">
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
                  onClick={() => navigate('/search')}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
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
