import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useTranslation } from 'react-i18next';

interface WaterEntry { time: string; amount: number }
interface WaterLog { date: string; entries: WaterEntry[]; goal: number }

const STORAGE_KEY = 'waterIntake';
const DEFAULT_GOAL = 2000;

const loadTodayLog = (): WaterLog => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const all: Record<string, WaterLog> = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return all[today] || { date: today, entries: [], goal: DEFAULT_GOAL };
  } catch { return { date: today, entries: [], goal: DEFAULT_GOAL }; }
};

const saveTodayLog = (log: WaterLog) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const all: Record<string, WaterLog> = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    all[today] = log;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
};

const getHistory = (): WaterLog[] => {
  try {
    const all: Record<string, WaterLog> = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return Object.values(all).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  } catch { return []; }
};

const getHydrationStreak = (history: WaterLog[]): number => {
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const log = history.find(h => h.date === key);
    const total = log?.entries.reduce((s, e) => s + e.amount, 0) || 0;
    if (key === today && total < (log?.goal || DEFAULT_GOAL)) { i === 0 ? null : null; break; }
    if (total >= (log?.goal || DEFAULT_GOAL)) streak++;
    else if (key !== today) break;
  }
  return streak;
};

const QUICK_AMOUNTS = [
  { ml: 150, label: 'Shot', icon: '🥃' },
  { ml: 250, label: 'Cup', icon: '☕' },
  { ml: 350, label: 'Glass', icon: '🥤' },
  { ml: 500, label: 'Bottle', icon: '🍶' },
  { ml: 750, label: 'Large', icon: '💧' },
];

// Circular SVG progress ring
const CircleRing: React.FC<{ progress: number; total: number; goal: number }> = ({ progress, total, goal }) => {
  const r = 80;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(progress, 100) / 100) * circ;
  const done = progress >= 100;
  const color = done ? '#22c55e' : progress >= 60 ? '#3b82f6' : progress >= 30 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="200" height="200" className="-rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeWidth="12"
          className="text-gray-100 dark:text-slate-800" />
        <circle cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl mb-0.5">{done ? '🎉' : '💧'}</div>
        <div className="text-3xl font-black text-gray-900 dark:text-white leading-none">
          {total >= 1000 ? `${(total / 1000).toFixed(1)}L` : `${total}`}
        </div>
        {total < 1000 && <div className="text-xs text-gray-400 font-medium">ml</div>}
        <div className="text-sm font-bold mt-1" style={{ color }}>
          {Math.round(progress)}%
        </div>
        <div className="text-xs text-gray-400">of {goal}ml</div>
      </div>
    </div>
  );
};

const WaterIntakePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [log, setLog] = useState<WaterLog>(loadTodayLog());
  const [history, setHistory] = useState<WaterLog[]>([]);
  const [customAmount, setCustomAmount] = useState('');
  const [editGoal, setEditGoal] = useState(false);
  const [newGoal, setNewGoal] = useState(String(log.goal));
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    const h = getHistory();
    setHistory(h);
  }, [navigate]);

  const totalToday = log.entries.reduce((sum, e) => sum + e.amount, 0);
  const progress = Math.min(100, (totalToday / log.goal) * 100);
  const remaining = Math.max(0, log.goal - totalToday);
  const streak = getHydrationStreak(history);

  const addWater = (amount: number) => {
    const updated: WaterLog = {
      ...log,
      entries: [...log.entries, { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), amount }],
    };
    setLog(updated);
    saveTodayLog(updated);
    setHistory(getHistory());
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 600);
  };

  const removeEntry = (index: number) => {
    const updated: WaterLog = { ...log, entries: log.entries.filter((_, i) => i !== index) };
    setLog(updated);
    saveTodayLog(updated);
    setHistory(getHistory());
  };

  const saveGoal = () => {
    const goal = Math.max(500, parseInt(newGoal) || DEFAULT_GOAL);
    const updated: WaterLog = { ...log, goal };
    setLog(updated);
    saveTodayLog(updated);
    setNewGoal(String(goal));
    setEditGoal(false);
  };

  const encouragement = () => {
    if (progress >= 100) return { msg: '🎉 Goal reached! Amazing hydration!', color: 'text-green-500' };
    if (progress >= 75) return { msg: '🔥 Almost there! Just a bit more!', color: 'text-blue-500' };
    if (progress >= 50) return { msg: '👍 Halfway! Keep up the great work!', color: 'text-blue-400' };
    if (progress >= 25) return { msg: '💧 Good start! Stay consistent!', color: 'text-yellow-500' };
    return { msg: '⚡ Time to hydrate! Your body needs water.', color: 'text-gray-400' };
  };
  const { msg, color } = encouragement();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      {/* Hero */}
      <div className="relative bg-slate-950 overflow-hidden py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 to-blue-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-cyan-400 text-sm font-semibold uppercase tracking-widest mb-2">Hydration</p>
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">{t('water.title')}</h1>
          <p className="text-white/40 text-sm">{t('water.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 sm:py-8 sm:px-6 space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t('water.remaining'), value: remaining >= 1000 ? `${(remaining/1000).toFixed(1)}L` : `${remaining}ml`, sub: t('common.today'), icon: '🎯', color: 'text-blue-500' },
            { label: t('water.streak'), value: `${streak}${t('water.days')}`, sub: t('water.days'), icon: '🔥', color: 'text-orange-500' },
            { label: t('water.entries'), value: log.entries.length, sub: t('common.today'), icon: '📋', color: 'text-violet-500' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 text-center shadow-sm">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Main tracker */}
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-8 text-center transition-all duration-300 ${justAdded ? 'ring-2 ring-blue-400/60' : ''}`}>
          <div className="flex justify-center mb-5">
            <CircleRing progress={progress} total={totalToday} goal={log.goal} />
          </div>
          <p className={`font-semibold text-sm mb-6 ${color}`}>{msg}</p>

          {/* Quick Add */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {QUICK_AMOUNTS.map(({ ml, label, icon }) => (
              <button key={ml} onClick={() => addWater(ml)}
                className="flex flex-col items-center gap-1 py-3 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-800/30 text-cyan-700 dark:text-cyan-300 transition-all hover:scale-105 active:scale-95">
                <span className="text-xl">{icon}</span>
                <span className="text-xs font-bold">{ml}ml</span>
                <span className="text-[10px] text-cyan-500 dark:text-cyan-500">{label}</span>
              </button>
            ))}
          </div>

          {/* Custom */}
          <div className="flex gap-2">
            <input type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
              placeholder="Custom ml…"
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && customAmount) { addWater(parseInt(customAmount)); setCustomAmount(''); } }} />
            <button onClick={() => { if (customAmount) { addWater(parseInt(customAmount)); setCustomAmount(''); } }}
              disabled={!customAmount}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all text-sm">
              {t('common.add')}
            </button>
          </div>
        </div>

        {/* Goal */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-lg">🎯</span> {t('water.dailyGoal')}
            </h3>
            <button onClick={() => setEditGoal(!editGoal)}
              className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              {editGoal ? t('common.cancel') : t('common.edit')}
            </button>
          </div>
          {editGoal ? (
            <div className="flex gap-2">
              <input type="number" value={newGoal} onChange={e => setNewGoal(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="2000" />
              <button onClick={saveGoal} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 text-sm">{t('common.save')}</button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {[1500, 2000, 2500, 3000].map(g => (
                <button key={g} onClick={() => { const u = { ...log, goal: g }; setLog(u); saveTodayLog(u); setNewGoal(String(g)); }}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                    log.goal === g
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}>
                  {g >= 1000 ? `${g/1000}L` : `${g}ml`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Today's log */}
        {log.entries.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white">{t('water.todayLog')}</h3>
              <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full font-semibold">
                {log.entries.length} entries
              </span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-slate-800/60">
              {[...log.entries].reverse().map((entry, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-base">💧</div>
                    <div>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">{entry.amount}ml</span>
                      <span className="text-xs text-gray-400 ml-2">{entry.time}</span>
                    </div>
                  </div>
                  <button onClick={() => removeEntry(log.entries.length - 1 - i)}
                    className="w-7 h-7 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center text-gray-300 hover:text-red-500 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7-day history */}
        {history.length > 1 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">{t('water.history')}</h3>
            <div className="space-y-3">
              {history.map(day => {
                const total = day.entries.reduce((s, e) => s + e.amount, 0);
                const pct = Math.min(100, Math.round((total / day.goal) * 100));
                const isToday = day.date === new Date().toISOString().split('T')[0];
                return (
                  <div key={day.date}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className={`font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        {isToday ? t('common.today') : new Date(day.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className={`font-semibold ${pct >= 100 ? 'text-green-500' : 'text-gray-400'}`}>
                        {total >= 1000 ? `${(total/1000).toFixed(1)}L` : `${total}ml`}
                        {pct >= 100 && ' ✓'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full transition-all duration-500 ${
                        pct >= 100 ? 'bg-green-500' : pct >= 60 ? 'bg-blue-500' : pct >= 30 ? 'bg-yellow-400' : 'bg-red-400'
                      }`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaterIntakePage;
