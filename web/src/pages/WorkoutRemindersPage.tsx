import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';

interface ReminderSettings {
  enabled: boolean;
  time: string;           // HH:MM
  message: string;
  days: number[];         // 0=Sun … 6=Sat
  lastFired?: string;     // ISO date string
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  time: '09:00',
  message: "Time to crush your workout! 💪",
  days: [1, 2, 3, 4, 5], // Mon-Fri
};


const STORAGE_KEY = 'workoutReminder';

const loadSettings = (): ReminderSettings => {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return DEFAULT_SETTINGS; }
};

const saveSettings = (s: ReminderSettings) => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

// Check and fire a notification if it's due today and hasn't fired yet
export const checkAndFireReminder = () => {
  const s = loadSettings();
  if (!s.enabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  const todayDay = now.getDay();
  if (!s.days.includes(todayDay)) return;

  const [hh, mm] = s.time.split(':').map(Number);
  const reminderTime = new Date();
  reminderTime.setHours(hh, mm, 0, 0);

  const todayStr = now.toDateString();
  if (s.lastFired === todayStr) return; // already fired today
  if (now < reminderTime) return; // not time yet

  // Fire!
  new Notification('FitTrack Pro 💪', {
    body: s.message,
    icon: '/icon-192.png',
    tag: 'workout-reminder',
  });

  // Update lastFired
  saveSettings({ ...s, lastFired: todayStr });
};

const WorkoutRemindersPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || 'en';
  // locale-aware short day names starting Sunday
  const DAY_LABELS = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, i).toLocaleDateString(lang, { weekday: 'short' })
  );
  const [settings, setSettings] = useState<ReminderSettings>(loadSettings());
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [testSent, setTestSent] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    if ('Notification' in window) setPermissionState(Notification.permission);
  }, [navigate]);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermissionState(result);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = () => {
    if (Notification.permission !== 'granted') return;
    new Notification('FitTrack Pro 💪', {
      body: settings.message,
      icon: '/icon-192.png',
      tag: 'workout-reminder-test',
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  };

  const toggleDay = (day: number) => {
    setSettings(s => ({
      ...s,
      days: s.days.includes(day) ? s.days.filter(d => d !== day) : [...s.days, day].sort(),
    }));
  };

  const permissionColor = permissionState === 'granted'
    ? 'text-green-600 dark:text-green-400'
    : permissionState === 'denied'
    ? 'text-red-600 dark:text-red-400'
    : 'text-yellow-600 dark:text-yellow-400';

  const permissionIcon = permissionState === 'granted' ? '✅' : permissionState === 'denied' ? '❌' : '⚠️';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      {/* Header */}
      <div className="relative bg-slate-950 overflow-hidden py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-violet-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-2">{t('reminders.scheduling')}</p>
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">{t('reminders.title')}</h1>
          <p className="text-white/40 text-sm">{t('reminders.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 sm:py-8 sm:px-6 space-y-6">

        {/* Permission Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('reminders.notificationPermission')}</h2>
              <p className={`text-sm font-medium mt-1 ${permissionColor}`}>
                {permissionIcon} {permissionState === 'granted' ? t('reminders.notificationsEnabled') : permissionState === 'denied' ? t('reminders.notificationsBlocked') : t('reminders.notificationsNotGranted')}
              </p>
            </div>
            {permissionState !== 'granted' && permissionState !== 'denied' && (
              <button
                onClick={requestPermission}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                {t('reminders.allowNotifications')}
              </button>
            )}
            {permissionState === 'denied' && (
              <div className="text-xs text-gray-500 dark:text-gray-400 max-w-[160px] text-right">
                Click the 🔒 icon in your browser address bar to unblock
              </div>
            )}
          </div>

          {permissionState !== 'granted' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
              💡 Notifications only work when your browser is open. For best results, bookmark FitTrack Pro and open it in the morning.
            </div>
          )}
        </div>

        {/* Settings Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('reminders.reminderSettings')}</h2>
            <button
              onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                settings.enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${settings.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className={settings.enabled ? '' : 'opacity-50 pointer-events-none'}>
            {/* Time Picker */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('reminders.reminderTime')}
              </label>
              <input
                type="time"
                value={settings.time}
                onChange={e => setSettings(s => ({ ...s, time: e.target.value }))}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 text-lg font-mono"
              />
            </div>

            {/* Days of Week */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('reminders.reminderDays')}
              </label>
              <div className="flex gap-2 flex-wrap">
                {DAY_LABELS.map((label, day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`w-12 h-12 rounded-xl text-sm font-bold transition-all ${
                      settings.days.includes(day)
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {settings.days.length === 0 ? t('reminders.noDaysSelected') : t('reminders.daysSelected', { count: settings.days.length })}
              </p>
            </div>

            {/* Message */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('reminders.reminderMessage')}
              </label>
              <input
                type="text"
                value={settings.message}
                onChange={e => setSettings(s => ({ ...s, message: e.target.value }))}
                placeholder={t('reminders.messagePlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Preview */}
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-600 mb-5">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 font-semibold uppercase tracking-wide">{t('reminders.preview')}</p>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl shrink-0">💪</div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">FitTrack Pro 💪</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">{settings.message || '...'}</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                    {settings.days.length > 0
                      ? `${settings.days.map(d => DAY_LABELS[d]).join(', ')} at ${settings.time}`
                      : 'No days selected'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                saved ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {saved ? t('reminders.savedSettings') : t('reminders.saveSettings')}
            </button>
            {permissionState === 'granted' && (
              <button
                onClick={handleTest}
                className={`px-5 py-3 rounded-xl font-semibold transition-all ${
                  testSent
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {testSent ? t('reminders.testSent') : t('reminders.testNotification')}
              </button>
            )}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
          <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-3">{t('reminders.howItWorks')}</h3>
          <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            <li>• Reminders fire when FitTrack Pro is <strong>open in your browser</strong> at or after the set time</li>
            <li>• For the best experience, open the app each morning or add it to your home screen</li>
            <li>• Each reminder fires <strong>once per day</strong> — it won't spam you</li>
            <li>• Notifications must be <strong>allowed</strong> in your browser settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WorkoutRemindersPage;
