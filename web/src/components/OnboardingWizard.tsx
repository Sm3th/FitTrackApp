import React, { useState } from 'react';

interface OnboardingData {
  goal: string;
  level: string;
  daysPerWeek: number;
  calorieGoal: number;
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
}

const GOALS = [
  { id: 'lose_weight',    icon: '🔥', label: 'Lose Weight',       desc: 'Burn fat and slim down' },
  { id: 'build_muscle',  icon: '💪', label: 'Build Muscle',       desc: 'Gain strength and mass' },
  { id: 'stay_fit',      icon: '⚡', label: 'Stay Fit',           desc: 'Maintain and improve health' },
  { id: 'improve_endurance', icon: '🏃', label: 'Endurance',      desc: 'Boost stamina and cardio' },
  { id: 'flexibility',   icon: '🧘', label: 'Flexibility',        desc: 'Mobility and recovery' },
  { id: 'sport',         icon: '🏆', label: 'Sport Performance',  desc: 'Train for competition' },
];

const LEVELS = [
  { id: 'beginner',     icon: '🌱', label: 'Beginner',     desc: '0–1 year of training' },
  { id: 'intermediate', icon: '🔥', label: 'Intermediate', desc: '1–3 years of training' },
  { id: 'advanced',     icon: '⚡', label: 'Advanced',     desc: '3+ years of training' },
];

const DAYS = [2, 3, 4, 5, 6];

const CALORIE_PRESETS = [
  { label: 'Cut (deficit)', cal: 1800, color: 'from-blue-500 to-cyan-500' },
  { label: 'Maintain',      cal: 2200, color: 'from-emerald-500 to-teal-500' },
  { label: 'Bulk (surplus)', cal: 2800, color: 'from-orange-500 to-red-500' },
];

const TOTAL_STEPS = 4;

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    goal: '',
    level: '',
    daysPerWeek: 3,
    calorieGoal: 2200,
  });

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const handleComplete = () => {
    localStorage.setItem('onboarding_complete', '1');
    localStorage.setItem('onboarding_data', JSON.stringify(data));
    // Pre-fill nutrition goals
    localStorage.setItem('nutrition_goals', JSON.stringify({
      calories: data.calorieGoal,
      protein: Math.round(data.calorieGoal * 0.3 / 4),
      carbs:   Math.round(data.calorieGoal * 0.4 / 4),
      fat:     Math.round(data.calorieGoal * 0.3 / 9),
    }));
    onComplete(data);
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col">
      {/* Ambient orbs */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700 rounded-full"
          style={{ width: `${progress}%` }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-black">F</span>
          </div>
          <span className="text-sm font-black text-white">FitTrack Pro</span>
        </div>
        <span className="text-xs font-semibold text-slate-500">{step} of {TOTAL_STEPS}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-lg mx-auto pt-8">

          {/* Step 1 — Goal */}
          {step === 1 && (
            <div>
              <p className="text-blue-400 text-sm font-bold uppercase tracking-widest mb-2">Step 1</p>
              <h1 className="text-3xl font-black text-white mb-2 leading-tight">What's your primary goal?</h1>
              <p className="text-slate-400 text-sm mb-8">We'll personalize your workout plans and recommendations.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOALS.map(g => (
                  <button key={g.id} onClick={() => setData(d => ({ ...d, goal: g.id }))}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 active:scale-95 ${
                      data.goal === g.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                    }`}>
                    <span className="text-3xl">{g.icon}</span>
                    <div>
                      <p className="font-black text-white text-sm">{g.label}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{g.desc}</p>
                    </div>
                    {data.goal === g.id && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Experience Level */}
          {step === 2 && (
            <div>
              <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-2">Step 2</p>
              <h1 className="text-3xl font-black text-white mb-2 leading-tight">What's your fitness level?</h1>
              <p className="text-slate-400 text-sm mb-8">This helps us suggest the right workout intensity.</p>
              <div className="space-y-3">
                {LEVELS.map(l => (
                  <button key={l.id} onClick={() => setData(d => ({ ...d, level: l.id }))}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 active:scale-95 ${
                      data.level === l.id
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}>
                    <span className="text-4xl">{l.icon}</span>
                    <div className="flex-1">
                      <p className="font-black text-white">{l.label}</p>
                      <p className="text-slate-400 text-sm mt-0.5">{l.desc}</p>
                    </div>
                    {data.level === l.id && (
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Training Days & Calories */}
          {step === 3 && (
            <div>
              <p className="text-violet-400 text-sm font-bold uppercase tracking-widest mb-2">Step 3</p>
              <h1 className="text-3xl font-black text-white mb-2 leading-tight">Set your weekly targets</h1>
              <p className="text-slate-400 text-sm mb-8">How often do you plan to train, and what's your calorie goal?</p>

              {/* Days per week */}
              <div className="mb-8">
                <p className="text-sm font-bold text-slate-300 mb-3">Training days per week</p>
                <div className="flex gap-2">
                  {DAYS.map(d => (
                    <button key={d} onClick={() => setData(prev => ({ ...prev, daysPerWeek: d }))}
                      className={`flex-1 py-3 rounded-xl text-sm font-black transition-all active:scale-95 ${
                        data.daysPerWeek === d
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                      }`}>
                      {d}x
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {data.daysPerWeek < 3 ? 'Light schedule — great for recovery' :
                   data.daysPerWeek < 5 ? 'Solid routine — optimal for most people' :
                   'Intense schedule — make sure to recover well'}
                </p>
              </div>

              {/* Calorie goal */}
              <div>
                <p className="text-sm font-bold text-slate-300 mb-3">Daily calorie target</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {CALORIE_PRESETS.map(p => (
                    <button key={p.cal} onClick={() => setData(prev => ({ ...prev, calorieGoal: p.cal }))}
                      className={`py-3 rounded-xl text-xs font-black transition-all active:scale-95 ${
                        data.calorieGoal === p.cal
                          ? `bg-gradient-to-r ${p.color} text-white shadow-md`
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                      }`}>
                      <div className="text-lg font-black mb-0.5">{(p.cal/1000).toFixed(1)}k</div>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 whitespace-nowrap">Custom:</span>
                  <input
                    type="number" min="1200" max="5000" step="50"
                    value={data.calorieGoal}
                    onChange={e => setData(prev => ({ ...prev, calorieGoal: parseInt(e.target.value) || 2000 }))}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-bold text-center focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  />
                  <span className="text-xs text-slate-500">kcal</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Ready */}
          {step === 4 && (
            <div className="text-center pt-4">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/30">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h1 className="text-3xl font-black text-white mb-3">You're all set!</h1>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                Your personalized profile is ready. Your nutrition goals have been pre-filled based on your calorie target.
              </p>

              {/* Summary */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left mb-8 space-y-3">
                {[
                  { label: 'Goal', value: GOALS.find(g => g.id === data.goal)?.label || '—', icon: GOALS.find(g => g.id === data.goal)?.icon || '🎯' },
                  { label: 'Level', value: LEVELS.find(l => l.id === data.level)?.label || '—', icon: LEVELS.find(l => l.id === data.level)?.icon || '⚡' },
                  { label: 'Training Days', value: `${data.daysPerWeek}x per week`, icon: '📅' },
                  { label: 'Daily Calories', value: `${data.calorieGoal.toLocaleString()} kcal`, icon: '🥗' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center">{item.icon}</span>
                    <span className="text-slate-400 text-sm flex-1">{item.label}</span>
                    <span className="text-white text-sm font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="px-6 pb-8 pt-4 border-t border-white/5">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 && (
            <button onClick={back}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-2xl transition-all active:scale-95">
              ← Back
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              onClick={next}
              disabled={(step === 1 && !data.goal) || (step === 2 && !data.level)}
              className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              Continue →
            </button>
          ) : (
            <button onClick={handleComplete}
              className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95">
              Start Training 💪
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
