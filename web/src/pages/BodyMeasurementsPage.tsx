import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import Navbar from '../components/Navbar';
import { exportMeasurementsToCsv } from '../utils/csvExporter';
import { useUnits } from '../hooks/useUnits';

interface Measurement {
  id: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  leftArm?: number;
  rightArm?: number;
  leftThigh?: number;
  rightThigh?: number;
  notes?: string;
}

const STORAGE_KEY = 'bodyMeasurements';

const FIELD_META: Array<{ key: keyof Measurement; unit: string; color: string; grad: string }> = [
  { key: 'weight',     unit: 'kg', color: '#6366f1', grad: 'from-indigo-500 to-blue-500'   },
  { key: 'bodyFat',   unit: '%',  color: '#f59e0b', grad: 'from-amber-500 to-orange-500'  },
  { key: 'chest',     unit: 'cm', color: '#ec4899', grad: 'from-pink-500 to-rose-500'     },
  { key: 'waist',     unit: 'cm', color: '#8b5cf6', grad: 'from-violet-500 to-purple-500' },
  { key: 'hips',      unit: 'cm', color: '#06b6d4', grad: 'from-cyan-500 to-blue-500'     },
  { key: 'leftArm',   unit: 'cm', color: '#10b981', grad: 'from-emerald-500 to-teal-500'  },
  { key: 'rightArm',  unit: 'cm', color: '#10b981', grad: 'from-emerald-500 to-teal-500'  },
  { key: 'leftThigh', unit: 'cm', color: '#f97316', grad: 'from-orange-500 to-red-500'    },
  { key: 'rightThigh',unit: 'cm', color: '#f97316', grad: 'from-orange-500 to-red-500'    },
];

const load = (): Measurement[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
};

const save = (m: Measurement[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(m));

// direction: +1 means "up is good" (muscle), -1 means "up is bad" (fat/waist)
const isGoodUp = (key: string) => !['waist', 'hips', 'bodyFat'].includes(key);

const BodyMeasurementsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { weightUnit, cmUnit, fromStorageWeight, fromStorageCm, toStorageWeight, toStorageCm } = useUnits();

  const fields = FIELD_META.map(f => ({
    ...f,
    unit: f.key === 'weight' ? weightUnit : f.key === 'bodyFat' ? '%' : cmUnit,
    label: t(`measurements.${f.key}` as any),
  }));
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<keyof Measurement>('weight');
  const [form, setForm] = useState<Partial<Measurement>>({ date: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    setMeasurements(load());
    // Hydrate from API
    apiClient.get('/metrics').then(res => {
      const items: Measurement[] = ((res.data?.data || res.data) || []).map((r: any) => ({
        id: String(r.id),
        date: r.date ? r.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        weight: r.weight ?? undefined,
        bodyFat: r.bodyFat ?? undefined,
        chest: r.chest ?? undefined,
        waist: r.waist ?? undefined,
        hips: r.hips ?? undefined,
        leftArm: r.arms ?? undefined,
        rightArm: r.arms ?? undefined,
        leftThigh: r.legs ?? undefined,
        rightThigh: r.legs ?? undefined,
        notes: r.notes ?? undefined,
      })).sort((a: Measurement, b: Measurement) => a.date.localeCompare(b.date));
      if (items.length > 0) {
        setMeasurements(items);
        save(items);
      }
    }).catch(() => {});
  }, [navigate]);

  const cmFields: Array<keyof Measurement> = ['chest', 'waist', 'hips', 'leftArm', 'rightArm', 'leftThigh', 'rightThigh'];

  const handleSave = () => {
    if (!form.date) return;
    // Convert from display units (lbs/in) back to storage units (kg/cm)
    const stored: Partial<Measurement> = { ...form };
    if (stored.weight != null) stored.weight = toStorageWeight(stored.weight);
    cmFields.forEach(k => { if ((stored as any)[k] != null) (stored as any)[k] = toStorageCm((stored as any)[k]); });
    const entry: Measurement = { id: Date.now().toString(), date: form.date, ...stored };
    const updated = [...measurements, entry].sort((a, b) => a.date.localeCompare(b.date));
    setMeasurements(updated);
    save(updated);
    setShowForm(false);
    setForm({ date: new Date().toISOString().slice(0, 10) });
    // Sync to backend (fire-and-forget)
    apiClient.post('/metrics', { weight: entry.weight, bodyFat: entry.bodyFat, chest: entry.chest, waist: entry.waist, hips: entry.hips, arms: entry.leftArm, legs: entry.leftThigh, date: entry.date }).catch(() => {});
  };

  const handleDelete = (id: string) => {
    const updated = measurements.filter(m => m.id !== id);
    setMeasurements(updated);
    save(updated);
    // Sync to backend (fire-and-forget)
    apiClient.delete(`/metrics/${id}`).catch(() => {});
  };

  const latest   = measurements[measurements.length - 1];
  const earliest = measurements[0];
  const previous = measurements[measurements.length - 2];

  const chartData = useMemo(() => {
    const isCm = cmFields.includes(selectedMetric);
    return measurements
      .filter(m => m[selectedMetric] != null)
      .map(m => ({
        date: new Date(m.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: selectedMetric === 'weight'
          ? fromStorageWeight(m[selectedMetric] as number)
          : isCm
          ? fromStorageCm(m[selectedMetric] as number)
          : m[selectedMetric] as number,
      }));
  }, [measurements, selectedMetric, fromStorageWeight, fromStorageCm]);

  const activeField = fields.find(f => f.key === selectedMetric) || fields[0];

  const getDelta = (key: keyof Measurement, from?: Measurement, to?: Measurement) => {
    if (!from || !to) return null;
    const a = from[key] as number | undefined;
    const b = to[key]   as number | undefined;
    if (a == null || b == null) return null;
    return +(b - a).toFixed(1);
  };

  // BMI from userProfile
  const profile = (() => { try { return JSON.parse(localStorage.getItem('userProfile') || '{}'); } catch { return {}; } })();
  const bmi = profile.height && latest?.weight
    ? +(latest.weight / Math.pow(profile.height / 100, 2)).toFixed(1)
    : null;
  const bmiLabel = bmi == null ? '' : bmi < 18.5 ? t('measurements.underweight') : bmi < 25 ? t('measurements.normal') : bmi < 30 ? t('measurements.overweight') : t('measurements.obese');
  const bmiColor = bmi == null ? '' : bmi < 18.5 ? 'text-blue-400' : bmi < 25 ? 'text-emerald-400' : bmi < 30 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="relative bg-slate-950 overflow-hidden py-8 sm:py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <p className="text-purple-400 text-sm font-bold uppercase tracking-wide mb-1">{t('measurements.bodyTracking')}</p>
            <h1 className="text-4xl font-black text-white tracking-tight mb-1">{t('measurements.title')}</h1>
            <p className="text-white/40 text-sm">{t('measurements.entriesRecorded', { count: measurements.length })}</p>
          </div>
          <div className="flex gap-2">
            {measurements.length > 0 && (
              <button onClick={() => exportMeasurementsToCsv(measurements)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                CSV
              </button>
            )}
            <button onClick={() => setShowForm(s => !s)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-black px-5 py-2.5 rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-95">
              {showForm ? t('common.cancel') : t('measurements.addEntry')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5 sm:py-8 sm:px-6 space-y-5">

        {/* Add Form — bottom sheet on mobile */}
        {showForm && (
          <div className="list-card p-6">
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-5">{t('measurements.newEntry')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('measurements.date')}</label>
                <input type="date" value={form.date || ''}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm" />
              </div>
              {fields.map(f => (
                <div key={String(f.key)}>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                    {f.label} <span className="font-normal normal-case">({f.unit})</span>
                  </label>
                  <input type="number" step="0.1"
                    value={(form[f.key] as number) || ''}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    placeholder={f.key === 'weight' ? '70' : f.key === 'bodyFat' ? '15' : '85'}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm font-semibold" />
                </div>
              ))}
              <div className="col-span-2 sm:col-span-3">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('measurements.notes')} <span className="font-normal normal-case">({t('measurements.optional')})</span></label>
                <input type="text" value={form.notes || ''}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Morning, post-workout, after refeed…"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-pink-500 transition-all active:scale-95">
                {t('measurements.saveEntry')}
              </button>
              <button onClick={() => setShowForm(false)}
                className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}

        {measurements.length === 0 ? (
          <div className="list-card p-14 text-center">
            <div className="w-20 h-20 bg-purple-500/10 border border-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-4 text-4xl">📏</div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{t('measurements.noMeasurementsYet')}</h3>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">{t('measurements.noMeasurementsDesc')}</p>
            <button onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-pink-500 transition-all active:scale-95">
              {t('measurements.logFirstEntry')}
            </button>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {fields.filter(f => latest?.[f.key] != null).slice(0, 4).map(f => {
                const delta = getDelta(f.key, previous, latest);
                const totalDelta = getDelta(f.key, earliest, latest);
                const good = delta != null ? (isGoodUp(String(f.key)) ? delta >= 0 : delta <= 0) : true;
                return (
                  <div key={String(f.key)} className="list-card p-4">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${f.grad} flex items-center justify-center mb-3 shadow-sm`}>
                      <span className="text-white text-xs font-black">{f.unit}</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-0.5">
                      {latest[f.key]}<span className="text-sm font-medium text-gray-400 ml-0.5">{f.unit}</span>
                    </div>
                    <div className="text-xs text-gray-400 mb-1">{f.label}</div>
                    {delta != null && (
                      <div className={`text-xs font-bold ${good ? 'text-emerald-500' : 'text-red-400'}`}>
                        {delta > 0 ? '+' : ''}{delta} {t('measurements.vsLast')}
                      </div>
                    )}
                    {totalDelta != null && measurements.length > 2 && (
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {totalDelta > 0 ? '+' : ''}{totalDelta} {t('measurements.total')}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* BMI card */}
              {bmi && (
                <div className="list-card p-4">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-3 shadow-sm">
                    <span className="text-white text-xs font-black">BMI</span>
                  </div>
                  <div className={`text-2xl font-black leading-none mb-0.5 ${bmiColor}`}>{bmi}</div>
                  <div className="text-xs text-gray-400 mb-1">BMI</div>
                  <div className={`text-xs font-bold ${bmiColor}`}>{bmiLabel}</div>
                </div>
              )}
            </div>

            {/* Area Chart */}
            <div className="list-card overflow-hidden">
              {/* Metric selector */}
              <div className="px-5 pt-5 pb-3 border-b border-gray-50 dark:border-slate-800">
                <h3 className="text-sm font-black text-gray-900 dark:text-white mb-3">{t('measurements.progressChart')}</h3>
                <div className="flex gap-1.5 flex-wrap">
                  {fields.filter(f => chartData.length > 0 || measurements.some(m => m[f.key] != null)).map(f => (
                    <button key={String(f.key)}
                      onClick={() => setSelectedMetric(f.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedMetric === f.key
                          ? `bg-gradient-to-r ${f.grad} text-white shadow-md`
                          : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-slate-700 hover:text-gray-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-2 py-4">
                {chartData.length >= 2 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="measGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={activeField.color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={activeField.color} stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={35}
                        domain={(['auto', 'auto'] as [string, string])} />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f1f5f9', fontSize: 12 }}
                        formatter={(v: number) => [`${v} ${activeField.unit}`, activeField.label]}
                      />
                      <Area type="monotone" dataKey="value" stroke={activeField.color} strokeWidth={2.5}
                        fill="url(#measGrad)" dot={{ fill: activeField.color, r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 2, stroke: activeField.color, fill: '#1e293b' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">{t('measurements.addTwoEntries')}</p>
                      <button onClick={() => setShowForm(true)} className="mt-3 text-purple-500 text-xs font-bold hover:underline">{t('measurements.addEntry')} →</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* History table */}
            <div className="list-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-black text-gray-900 dark:text-white text-sm">{t('measurements.history')}</h3>
                <span className="text-xs text-gray-400 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-full font-semibold">{measurements.length} {t('measurements.entries')}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-slate-800/30">
                      <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">{t('measurements.date')}</th>
                      {fields.map(f => (
                        <th key={String(f.key)} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wide px-3 py-3 whitespace-nowrap">{f.label}</th>
                      ))}
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {[...measurements].reverse().map(m => (
                      <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          {new Date(m.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        {fields.map(f => (
                          <td key={String(f.key)} className="px-3 py-3 text-center text-gray-600 dark:text-gray-300 tabular-nums">
                            {m[f.key] != null ? `${m[f.key]}${f.unit}` : <span className="text-gray-300 dark:text-gray-700">—</span>}
                          </td>
                        ))}
                        <td className="px-3 py-3 text-center">
                          <button onClick={() => handleDelete(m.id)}
                            className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-500 font-semibold transition-opacity">
                            {t('measurements.delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BodyMeasurementsPage;
