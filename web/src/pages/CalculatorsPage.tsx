import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

type CalcTab = '1rm' | 'tdee' | 'macro';

// 1RM formulas
const calc1RM = (weight: number, reps: number, formula: string): number => {
  if (reps === 1) return weight;
  switch (formula) {
    case 'epley': return weight * (1 + reps / 30);
    case 'brzycki': return weight * (36 / (37 - reps));
    case 'lander': return (100 * weight) / (101.3 - 2.67123 * reps);
    case 'lombardi': return weight * Math.pow(reps, 0.1);
    default: return weight * (1 + reps / 30);
  }
};

const RM_PERCENTAGES = [
  { pct: 100, label: '1 RM', reps: 1 },
  { pct: 95, label: '95%', reps: 2 },
  { pct: 90, label: '90%', reps: 4 },
  { pct: 85, label: '85%', reps: 6 },
  { pct: 80, label: '80%', reps: 8 },
  { pct: 75, label: '75%', reps: 10 },
  { pct: 70, label: '70%', reps: 12 },
  { pct: 65, label: '65%', reps: 15 },
  { pct: 60, label: '60%', reps: 20 },
];

// TDEE activity multipliers
const ACTIVITY_LEVELS = [
  { value: 1.2, label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 1.375, label: 'Lightly Active', desc: '1-3 days/week' },
  { value: 1.55, label: 'Moderately Active', desc: '3-5 days/week' },
  { value: 1.725, label: 'Very Active', desc: '6-7 days/week' },
  { value: 1.9, label: 'Super Active', desc: 'Athlete / physical job' },
];

// Macro presets
const MACRO_PRESETS = [
  { name: 'Cutting', protein: 40, carbs: 30, fat: 30 },
  { name: 'Bulking', protein: 30, carbs: 50, fat: 20 },
  { name: 'Maintenance', protein: 30, carbs: 40, fat: 30 },
  { name: 'Keto', protein: 25, carbs: 5, fat: 70 },
  { name: 'High Carb', protein: 20, carbs: 55, fat: 25 },
];

const CalculatorsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<CalcTab>('1rm');

  // 1RM state
  const [rmWeight, setRmWeight] = useState('');
  const [rmReps, setRmReps] = useState('');
  const [rmFormula, setRmFormula] = useState('epley');

  // TDEE state
  const [tdeeGender, setTdeeGender] = useState<'male' | 'female'>('male');
  const [tdeeAge, setTdeeAge] = useState('');
  const [tdeeHeight, setTdeeHeight] = useState('');
  const [tdeeWeight, setTdeeWeight] = useState('');
  const [tdeeActivity, setTdeeActivity] = useState(1.55);

  // Macro state
  const [macroCalories, setMacroCalories] = useState('');
  const [macroProtein, setMacroProtein] = useState(30);
  const [macroCarbs, setMacroCarbs] = useState(40);
  const [macroFat, setMacroFat] = useState(30);

  // 1RM calculation
  const oneRM = rmWeight && rmReps
    ? Math.round(calc1RM(parseFloat(rmWeight), parseInt(rmReps), rmFormula))
    : null;

  // TDEE calculation (Mifflin-St Jeor)
  const bmr = tdeeAge && tdeeHeight && tdeeWeight
    ? tdeeGender === 'male'
      ? 10 * parseFloat(tdeeWeight) + 6.25 * parseFloat(tdeeHeight) - 5 * parseInt(tdeeAge) + 5
      : 10 * parseFloat(tdeeWeight) + 6.25 * parseFloat(tdeeHeight) - 5 * parseInt(tdeeAge) - 161
    : null;
  const tdee = bmr ? Math.round(bmr * tdeeActivity) : null;

  // Macro calculation
  const totalMacroPct = macroProtein + macroCarbs + macroFat;
  const macroCaloriesNum = parseInt(macroCalories) || 0;
  const proteinG = macroCaloriesNum ? Math.round((macroCaloriesNum * macroProtein / 100) / 4) : 0;
  const carbsG = macroCaloriesNum ? Math.round((macroCaloriesNum * macroCarbs / 100) / 4) : 0;
  const fatG = macroCaloriesNum ? Math.round((macroCaloriesNum * macroFat / 100) / 9) : 0;

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      <div className="relative bg-slate-950 overflow-hidden py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-orange-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
          <p className="text-amber-400 text-sm font-semibold uppercase tracking-widest mb-2">{t('calculators.tools')}</p>
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">{t('calculators.title')}</h1>
          <p className="text-white/40 text-sm">{t('calculators.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">

        {/* Tab Selector */}
        <div className="flex gap-2 mb-6 bg-white dark:bg-slate-900 rounded-xl p-1.5 shadow">
          {[
            { key: '1rm', label: t('calculators.oneRepMaxTab') },
            { key: 'tdee', label: t('calculators.tdeeTab') },
            { key: 'macro', label: t('calculators.macroTab') },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as CalcTab)}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                tab === t.key ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 1RM Calculator */}
        {tab === '1rm' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{t('calculators.oneRepMaxTitle')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                {t('calculators.oneRepMaxSubtitle')}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('calculators.weightLifted')}</label>
                  <input type="number" value={rmWeight} onChange={e => setRmWeight(e.target.value)} placeholder="e.g. 80"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-lg font-semibold focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('calculators.repsPerformed')}</label>
                  <input type="number" value={rmReps} onChange={e => setRmReps(e.target.value)} placeholder="e.g. 5"
                    min={1} max={30}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-lg font-semibold focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('calculators.formula')}</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'epley', label: 'Epley' },
                    { key: 'brzycki', label: 'Brzycki' },
                    { key: 'lander', label: 'Lander' },
                    { key: 'lombardi', label: 'Lombardi' },
                  ].map(f => (
                    <button key={f.key} onClick={() => setRmFormula(f.key)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        rmFormula === f.key ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300'
                      }`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {oneRM && (
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-5 text-white text-center mb-5">
                  <div className="text-5xl font-bold mb-1">{oneRM} kg</div>
                  <div className="text-white/80">{t('calculators.estimatedOneRM')}</div>
                </div>
              )}
            </div>

            {/* Percentage Table */}
            {oneRM && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b dark:border-slate-700">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('calculators.trainingPercentages')}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-800">
                      <tr>
                        <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">%</th>
                        <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">{t('calculators.weight')}</th>
                        <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">{t('calculators.targetReps')}</th>
                        <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">{t('calculators.zone')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {RM_PERCENTAGES.map(row => {
                        const w = Math.round(oneRM * row.pct / 100 * 2) / 2;
                        const zone = row.pct >= 90 ? '💪 Strength' : row.pct >= 75 ? '🏋️ Hypertrophy' : '🏃 Endurance';
                        return (
                          <tr key={row.pct} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${row.pct === 100 ? 'bg-orange-50 dark:bg-orange-900/20 font-bold' : ''}`}>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{row.label}</td>
                            <td className="px-4 py-3 text-sm text-center font-semibold text-orange-600 dark:text-orange-400">{w} kg</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">{row.reps}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-500">{zone}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TDEE Calculator */}
        {tab === 'tdee' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{t('calculators.tdeeTitle')}</h2>
              <p className="text-sm text-gray-500 mb-5">{t('calculators.tdeeSubtitle')}</p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('calculators.gender')}</label>
                <div className="flex gap-3">
                  {(['male', 'female'] as const).map(g => (
                    <button key={g} onClick={() => setTdeeGender(g)}
                      className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${tdeeGender === g ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300'}`}>
                      {g === 'male' ? `♂ ${t('calculators.male')}` : `♀ ${t('calculators.female')}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('calculators.age')}</label>
                  <input type="number" value={tdeeAge} onChange={e => setTdeeAge(e.target.value)} placeholder="25"
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('calculators.height')}</label>
                  <input type="number" value={tdeeHeight} onChange={e => setTdeeHeight(e.target.value)} placeholder="175"
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('calculators.weight')}</label>
                  <input type="number" value={tdeeWeight} onChange={e => setTdeeWeight(e.target.value)} placeholder="70"
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('calculators.activityLevel')}</label>
                <div className="space-y-2">
                  {ACTIVITY_LEVELS.map(a => (
                    <button key={a.value} onClick={() => setTdeeActivity(a.value)}
                      className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border-2 transition-all text-left ${
                        tdeeActivity === a.value ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-orange-300'
                      }`}>
                      <div>
                        <div className={`font-medium ${tdeeActivity === a.value ? 'text-orange-700 dark:text-orange-400' : 'text-gray-900 dark:text-gray-100'}`}>{a.label}</div>
                        <div className="text-xs text-gray-500">{a.desc}</div>
                      </div>
                      <div className={`text-sm font-semibold ${tdeeActivity === a.value ? 'text-orange-600' : 'text-gray-400'}`}>×{a.value}</div>
                    </button>
                  ))}
                </div>
              </div>

              {tdee && bmr && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-5 text-white text-center">
                    <div className="text-4xl font-bold">{Math.round(bmr)}</div>
                    <div className="text-white/80 text-sm mt-1">{t('calculators.bmrDay')}</div>
                    <div className="text-xs text-white/60 mt-1">{t('calculators.atCompleteRest')}</div>
                  </div>
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-5 text-white text-center">
                    <div className="text-4xl font-bold">{tdee}</div>
                    <div className="text-white/80 text-sm mt-1">{t('calculators.tdeeDay')}</div>
                    <div className="text-xs text-white/60 mt-1">{t('calculators.withActivity')}</div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 text-white text-center">
                    <div className="text-2xl font-bold">{tdee - 500}</div>
                    <div className="text-white/80 text-xs mt-1">{t('calculators.cutting')}</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-4 text-white text-center">
                    <div className="text-2xl font-bold">{tdee + 300}</div>
                    <div className="text-white/80 text-xs mt-1">{t('calculators.bulking')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Macro Calculator */}
        {tab === 'macro' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{t('calculators.macroTitle')}</h2>
              <p className="text-sm text-gray-500 mb-5">{t('calculators.macroSubtitle')}</p>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('calculators.dailyCaloriesTarget')}</label>
                <input type="number" value={macroCalories} onChange={e => setMacroCalories(e.target.value)} placeholder="e.g. 2000"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-lg focus:ring-2 focus:ring-orange-500" />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('calculators.quickPresets')}</label>
                <div className="flex flex-wrap gap-2">
                  {MACRO_PRESETS.map(p => (
                    <button key={p.name} onClick={() => { setMacroProtein(p.protein); setMacroCarbs(p.carbs); setMacroFat(p.fat); }}
                      className="px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-100 border border-orange-200 dark:border-orange-800">
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 mb-5">
                {[
                  { key: 'protein', label: t('calculators.protein'), value: macroProtein, setter: setMacroProtein, color: 'bg-blue-500' },
                  { key: 'carbs', label: t('calculators.carbs'), value: macroCarbs, setter: setMacroCarbs, color: 'bg-yellow-400' },
                  { key: 'fat', label: t('calculators.fat'), value: macroFat, setter: setMacroFat, color: 'bg-red-400' },
                ].map(m => (
                  <div key={m.key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{m.label}</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{m.value}%</span>
                    </div>
                    <input type="range" min={5} max={70} value={m.value}
                      onChange={e => m.setter(parseInt(e.target.value))}
                      className="w-full accent-orange-500" />
                  </div>
                ))}
                {totalMacroPct !== 100 && (
                  <div className={`text-sm font-medium ${totalMacroPct > 100 ? 'text-red-500' : 'text-yellow-600'}`}>
                    ⚠️ Total: {totalMacroPct}% (should be 100%)
                  </div>
                )}
              </div>

              {macroCaloriesNum > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'protein', label: t('calculators.protein'), g: proteinG, color: 'from-blue-500 to-blue-600', kcal: proteinG * 4 },
                    { key: 'carbs', label: t('calculators.carbs'), g: carbsG, color: 'from-yellow-400 to-orange-400', kcal: carbsG * 4 },
                    { key: 'fat', label: t('calculators.fat'), g: fatG, color: 'from-red-400 to-red-500', kcal: fatG * 9 },
                  ].map(m => (
                    <div key={m.key} className={`bg-gradient-to-r ${m.color} rounded-xl p-4 text-white text-center`}>
                      <div className="text-3xl font-bold">{m.g}g</div>
                      <div className="text-white/80 text-sm">{m.label}</div>
                      <div className="text-white/60 text-xs">{m.kcal} kcal</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculatorsPage;
