import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../i18n';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

// ── Types ─────────────────────────────────────────────────────────────────────
type Units = 'metric' | 'imperial';

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2.5">
      <span className="text-lg">{icon}</span>
      <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h2>
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

// ── Row ───────────────────────────────────────────────────────────────────────
const Row: React.FC<{ label: string; desc?: string; children: React.ReactNode }> = ({ label, desc, children }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
      {desc && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

// ── Toggle ────────────────────────────────────────────────────────────────────
const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 ${
      checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'
    }`}
    style={checked ? { background: 'var(--p-500)' } : undefined}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, colorTheme, fontSize, toggleTheme, setColorTheme, setFontSize } = useTheme();
  const { i18n } = useTranslation();
  const { toast, showToast, hideToast } = useToast();

  const [units, setUnits] = useState<Units>(
    () => (localStorage.getItem('units') as Units) || 'metric'
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem('notificationsEnabled') === 'true'
  );

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!localStorage.getItem('token');

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleUnits = (u: Units) => {
    setUnits(u);
    localStorage.setItem('units', u);
    showToast(`Units changed to ${u === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lbs, ft)'}`, 'success');
  };

  const handleNotifications = async () => {
    if (!notificationsEnabled) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          localStorage.setItem('notificationsEnabled', 'true');
          showToast('Notifications enabled', 'success');
        } else {
          showToast('Permission denied — enable in browser settings', 'error');
        }
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('notificationsEnabled', 'false');
      showToast('Notifications disabled', 'info');
    }
  };

  const handleExportData = () => {
    const keys = [
      'user', 'userProfile', 'onboarding_data', 'waterIntake',
      'nutrition_goals', 'workoutRatings', 'workoutReminder',
      'progressPhotos', 'bodyMeasurements',
    ];
    const exported: Record<string, unknown> = { exportedAt: new Date().toISOString() };
    keys.forEach(k => {
      const val = localStorage.getItem(k);
      if (val) { try { exported[k] = JSON.parse(val); } catch { exported[k] = val; } }
    });
    // Collect nutrition keys
    Object.keys(localStorage).filter(k => k.startsWith('nutrition_')).forEach(k => {
      try { exported[k] = JSON.parse(localStorage.getItem(k)!); } catch { /* skip */ }
    });

    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fittrack-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully', 'success');
  };

  const handleClearData = () => {
    if (!window.confirm('Clear all local data? This cannot be undone.')) return;
    const keep = ['token', 'user', 'theme', 'colorTheme', 'fontSize', 'units', 'i18nextLng'];
    Object.keys(localStorage).forEach(k => { if (!keep.includes(k)) localStorage.removeItem(k); });
    showToast('Local data cleared', 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const colorOptions: { value: 'blue' | 'orange' | 'purple' | 'green'; label: string; from: string; to: string }[] = [
    { value: 'blue',   label: 'Blue',   from: '#3b82f6', to: '#6366f1' },
    { value: 'orange', label: 'Orange', from: '#f97316', to: '#ef4444' },
    { value: 'purple', label: 'Purple', from: '#8b5cf6', to: '#7c3aed' },
    { value: 'green',  label: 'Green',  from: '#10b981', to: '#14b8a6' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your preferences and account</p>
        </div>

        {/* Account */}
        {isLoggedIn && (
          <Section title="Account" icon="👤">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--p-from), var(--p-to))' }}>
                {(user.username || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{user.fullName || user.username || 'User'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="ml-auto text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                Edit
              </button>
            </div>
          </Section>
        )}

        {/* Appearance */}
        <Section title="Appearance" icon="🎨">
          <Row label="Dark Mode" desc="Switch between light and dark theme">
            <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
          </Row>

          <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Color Theme</p>
            <div className="flex gap-2.5">
              {colorOptions.map(c => (
                <button
                  key={c.value}
                  onClick={() => setColorTheme(c.value)}
                  title={c.label}
                  className={`w-9 h-9 rounded-xl transition-all duration-150 ${
                    colorTheme === c.value ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-slate-900 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Font Size</p>
            <div className="flex gap-2">
              {(['small', 'medium', 'large'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFontSize(s)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    fontSize === s
                      ? 'text-white shadow'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                  style={fontSize === s ? { background: 'linear-gradient(135deg, var(--p-from), var(--p-to))' } : undefined}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Language */}
        <Section title="Language" icon="🌍">
          <div className="grid grid-cols-3 gap-2">
            {SUPPORTED_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code as LanguageCode)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 justify-center ${
                  i18n.resolvedLanguage === lang.code
                    ? 'text-white shadow'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
                style={i18n.resolvedLanguage === lang.code ? { background: 'linear-gradient(135deg, var(--p-from), var(--p-to))' } : undefined}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* Units */}
        <Section title="Units" icon="📏">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleUnits('metric')}
              className={`py-3 rounded-xl text-sm font-medium transition-all ${
                units === 'metric'
                  ? 'text-white shadow'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
              style={units === 'metric' ? { background: 'linear-gradient(135deg, var(--p-from), var(--p-to))' } : undefined}
            >
              Metric
              <span className="block text-xs opacity-70 font-normal mt-0.5">kg, cm, km</span>
            </button>
            <button
              onClick={() => handleUnits('imperial')}
              className={`py-3 rounded-xl text-sm font-medium transition-all ${
                units === 'imperial'
                  ? 'text-white shadow'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
              style={units === 'imperial' ? { background: 'linear-gradient(135deg, var(--p-from), var(--p-to))' } : undefined}
            >
              Imperial
              <span className="block text-xs opacity-70 font-normal mt-0.5">lbs, ft, mi</span>
            </button>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" icon="🔔">
          <Row label="Workout Reminders" desc="Get notified when it's time to train">
            <Toggle checked={notificationsEnabled} onChange={handleNotifications} />
          </Row>
          <Row label="Reminder Settings" desc="Configure days and time">
            <button
              onClick={() => navigate('/reminders')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Configure →
            </button>
          </Row>
        </Section>

        {/* Data */}
        <Section title="Data & Privacy" icon="💾">
          <Row label="Export My Data" desc="Download all your data as JSON">
            <button
              onClick={handleExportData}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Export
            </button>
          </Row>
          <Row label="Clear Local Data" desc="Remove cached data (workouts kept in DB)">
            <button
              onClick={handleClearData}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Clear
            </button>
          </Row>
        </Section>

        {/* Quick Links */}
        <Section title="Quick Links" icon="⚡">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Profile', icon: '👤', path: '/profile' },
              { label: 'Reminders', icon: '🔔', path: '/reminders' },
              { label: 'Calculators', icon: '💯', path: '/calculators' },
              { label: 'Workout Tips', icon: '💡', path: '/tips' },
              { label: 'Exercise Library', icon: '📚', path: '/exercise-library' },
              { label: 'API Docs', icon: '📄', path: 'http://localhost:3000/api/docs', external: true },
            ].map(link => (
              <button
                key={link.path}
                onClick={() => link.external ? window.open(link.path, '_blank') : navigate(link.path)}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <span>{link.icon}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{link.label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* About */}
        <Section title="About" icon="ℹ️">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">App</span>
              <span className="text-gray-900 dark:text-white font-medium">FitTrack Pro</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Version</span>
              <span className="text-gray-900 dark:text-white font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Stack</span>
              <span className="text-gray-900 dark:text-white font-medium">React 18 + Node.js</span>
            </div>
          </div>
        </Section>

        {/* Logout */}
        {isLoggedIn && (
          <button
            onClick={handleLogout}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Sign Out
          </button>
        )}

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 pb-4">
          FitTrack Pro © {new Date().getFullYear()}
        </p>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default SettingsPage;
