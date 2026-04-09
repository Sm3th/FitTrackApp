import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { CardSkeleton } from '../components/LoadingSkeleton';

// ── Types ─────────────────────────────────────────────────────────────────────
type GoalType = 'weight' | 'strength' | 'calories' | 'workouts' | 'custom';
type GoalStatus = 'active' | 'completed' | 'paused';

interface Goal {
  id: string;
  type: GoalType;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  targetDate: string;
  status: GoalStatus;
  emoji: string;
}

const STORAGE_KEY = 'fittrack_goals';

const loadGoals = (): Goal[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};

const saveGoals = (goals: Goal[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));

// ── Helpers ───────────────────────────────────────────────────────────────────
const daysLeft = (targetDate: string): number => {
  const diff = new Date(targetDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
};

const progressPct = (current: number, target: number, start: number): number => {
  if (target === start) return 100;
  // Weight-loss type: lower is better
  const total = Math.abs(target - start);
  const done = Math.abs(current - start);
  return Math.min(100, Math.max(0, (done / total) * 100));
};

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES: Omit<Goal, 'id' | 'startDate' | 'targetDate' | 'currentValue' | 'status'>[] = [
  { type: 'weight',   title: 'Lose Weight',      unit: 'kg',      targetValue: 70, emoji: '🔥', description: 'Reach target body weight' },
  { type: 'weight',   title: 'Gain Muscle Mass',  unit: 'kg',      targetValue: 85, emoji: '💪', description: 'Bulk up to target weight' },
  { type: 'strength', title: 'Bench Press 100kg', unit: 'kg',      targetValue: 100, emoji: '🏋️', description: '1-rep max bench press goal' },
  { type: 'strength', title: 'Squat 120kg',       unit: 'kg',      targetValue: 120, emoji: '🦵', description: '1-rep max squat goal' },
  { type: 'workouts', title: 'Workout Streak',    unit: 'days',    targetValue: 30, emoji: '📅', description: '30-day workout streak' },
  { type: 'calories', title: 'Daily Calories',    unit: 'kcal',    targetValue: 2000, emoji: '🥗', description: 'Hit daily calorie target' },
  { type: 'custom',   title: 'Run 5K',            unit: 'min',     targetValue: 25, emoji: '🏃', description: 'Run 5km under 25 minutes' },
];

// ── Sub-components ────────────────────────────────────────────────────────────
const ProgressRing = React.memo<{ pct: number; size?: number; stroke?: number; color?: string }>(({
  pct, size = 80, stroke = 8, color = 'var(--p-500)'
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-gray-100 dark:text-slate-800" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
});

// ── Main Page ─────────────────────────────────────────────────────────────────
const GoalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast, showToast, hideToast } = useToast();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [form, setForm] = useState<Partial<Goal>>({
    type: 'weight', emoji: '🎯', unit: 'kg',
    startDate: new Date().toISOString().slice(0, 10),
    targetDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    setTimeout(() => {
      setGoals(loadGoals());
      setPageLoading(false);
    }, 400);
  }, [navigate]);

  const handleSave = () => {
    if (!form.title || form.targetValue == null || form.currentValue == null) {
      showToast(t('goals.fillRequired'), 'warning');
      return;
    }
    if (editingId) {
      const updated = goals.map(g => g.id === editingId ? { ...g, ...form } as Goal : g);
      setGoals(updated);
      saveGoals(updated);
      showToast(t('goals.goalUpdated'), 'success');
    } else {
      const goal: Goal = {
        ...(form as Goal),
        id: Date.now().toString(),
        status: 'active',
      };
      const updated = [...goals, goal];
      setGoals(updated);
      saveGoals(updated);
      showToast(t('goals.goalCreated'), 'success');
    }
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!window.confirm(t('goals.deleteConfirm'))) return;
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    saveGoals(updated);
    showToast(t('goals.goalDeleted'), 'info' as any);
  };

  const handleComplete = (id: string) => {
    const updated = goals.map(g => g.id === id ? { ...g, status: 'completed' as GoalStatus } : g);
    setGoals(updated);
    saveGoals(updated);
    showToast(t('goals.goalCompleted'), 'success');
  };

  const handleUpdateProgress = (id: string, value: number) => {
    const updated = goals.map(g => g.id === id ? { ...g, currentValue: value } : g);
    setGoals(updated);
    saveGoals(updated);
  };

  const useTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setForm(prev => ({ ...prev, ...tmpl, currentValue: undefined }));
  };

  const resetForm = () => setForm({
    type: 'weight', emoji: '🎯', unit: 'kg',
    startDate: new Date().toISOString().slice(0, 10),
    targetDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      {/* Hero */}
      <div className="relative bg-slate-950 overflow-hidden py-8 sm:py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-purple-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div>
            <p className="text-violet-400 text-sm font-bold uppercase tracking-widest mb-1">{t('goals.goalTracker')}</p>
            <h1 className="text-4xl font-black text-white tracking-tight mb-1">{t('goals.title')}</h1>
            <p className="text-white/40 text-sm">{t('goals.subtitle')}</p>
          </div>
          <button
            onClick={() => { setEditingId(null); resetForm(); setShowForm(true); }}
            className="text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, var(--p-from), var(--p-to))' }}
          >
            <span className="text-lg">+</span> {t('goals.newGoal')}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {pageLoading ? (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : null}

        {/* Active goals */}
        {!pageLoading && activeGoals.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('goals.activeGoals')}</h2>
            {activeGoals.map((goal, idx) => {
              const pct = progressPct(goal.currentValue, goal.targetValue, goal.currentValue);
              const remaining = daysLeft(goal.targetDate);
              const isOverdue = remaining === 0;
              return (
                <div key={goal.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 card-lift animate-fade-up"
                  style={{ animationDelay: `${idx * 70}ms`, animationFillMode: 'both' }}>
                  <div className="flex items-start gap-4">
                    {/* Ring */}
                    <div className="relative flex-shrink-0">
                      <ProgressRing pct={pct} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl">{goal.emoji}</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white">{goal.title}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          isOverdue ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : remaining <= 7 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'
                        }`}>
                          {isOverdue ? t('goals.overdue') : t('goals.daysLeft', { n: remaining })}
                        </span>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{goal.description}</p>
                      )}

                      {/* Progress bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span>{goal.currentValue} {goal.unit}</span>
                          <span className="font-semibold">{Math.round(pct)}%</span>
                          <span>{goal.targetValue} {goal.unit}</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full progress-animated"
                            style={{ width: `${pct}%`, background: 'linear-gradient(to right, var(--p-from), var(--p-to))', transitionDelay: `${idx * 70 + 300}ms` }} />
                        </div>
                      </div>

                      {/* Quick update + actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-800 rounded-lg p-1">
                          <button onClick={() => handleUpdateProgress(goal.id, Math.max(0, goal.currentValue - 1))}
                            className="w-7 h-7 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center text-sm font-bold transition-colors">−</button>
                          <span className="text-sm font-bold text-gray-900 dark:text-white w-16 text-center tabular-nums">
                            {goal.currentValue} {goal.unit}
                          </span>
                          <button onClick={() => handleUpdateProgress(goal.id, goal.currentValue + 1)}
                            className="w-7 h-7 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center text-sm font-bold transition-colors">+</button>
                        </div>
                        <button onClick={() => handleComplete(goal.id)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                          {t('goals.markDone')}
                        </button>
                        <button onClick={() => handleDelete(goal.id)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg text-red-500 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto">
                          {t('goals.delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : !pageLoading ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('goals.noGoalsTitle')}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{t('goals.noGoalsDesc')}</p>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="text-white font-bold px-6 py-3 rounded-xl"
              style={{ background: 'linear-gradient(135deg, var(--p-from), var(--p-to))' }}
            >
              {t('goals.createFirst')}
            </button>
          </div>
        ) : null}

        {/* Completed goals */}
        {!pageLoading && completedGoals.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('goals.completedGoals')}</h2>
            <div className="space-y-3">
              {completedGoals.map(goal => (
                <div key={goal.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 flex items-center gap-4 opacity-70">
                  <span className="text-2xl">{goal.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white line-through">{goal.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('goals.achieved', { n: goal.targetValue, unit: goal.unit })}</p>
                  </div>
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full">{t('goals.done')}</span>
                  <button onClick={() => handleDelete(goal.id)} className="text-gray-400 hover:text-red-500 transition-colors text-sm">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">{editingId ? t('goals.editGoal') : t('goals.newGoal')}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Templates */}
              {!editingId && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('goals.quickTemplates')}</p>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATES.map(tmpl => (
                      <button key={tmpl.title} onClick={() => useTemplate(tmpl)}
                        className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                        {tmpl.emoji} {tmpl.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fields */}
              {[
                { label: t('goals.goalTitle'), key: 'title', type: 'text', placeholder: 'e.g. Reach 70kg' },
                { label: t('goals.description'), key: 'description', type: 'text', placeholder: 'Optional note...' },
                { label: t('goals.emoji'), key: 'emoji', type: 'text', placeholder: '🎯' },
                { label: t('goals.unit'), key: 'unit', type: 'text', placeholder: 'kg, reps, days...' },
                { label: t('goals.targetValue'), key: 'targetValue', type: 'number', placeholder: '70' },
                { label: t('goals.currentValue'), key: 'currentValue', type: 'number', placeholder: '80' },
                { label: t('goals.startDate'), key: 'startDate', type: 'date' },
                { label: t('goals.targetDate'), key: 'targetDate', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={String(form[f.key as keyof typeof form] ?? '')}
                    onChange={e => setForm(prev => ({
                      ...prev,
                      [f.key]: f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                    }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:border-transparent outline-none transition-all"
                    style={{ '--tw-ring-color': 'var(--p-ring)' } as React.CSSProperties}
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  {t('goals.cancel')}
                </button>
                <button onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, var(--p-from), var(--p-to))' }}>
                  {editingId ? t('goals.update') : t('goals.createGoal')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default GoalsPage;
