import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';

interface SharedWorkout {
  name: string;
  date: string;
  duration: number;
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weight: number;
  }>;
  totalVolume: number;
  sharedBy: string;
}

const SharedWorkoutPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [workout, setWorkout] = useState<SharedWorkout | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const data = params.get('data');
      if (!data) { setError(true); return; }
      const decoded = JSON.parse(atob(data));
      setWorkout(decoded);
    } catch {
      setError(true);
    }
  }, [params]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-6xl">😕</div>
        <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{t('sharedWorkout.invalidLink')}</p>
        <button onClick={() => navigate('/')} className="btn-primary">{t('sharedWorkout.goHome')}</button>
      </div>
    </div>
  );

  if (!workout) return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      {/* Hero */}
      <div className="relative bg-slate-950 overflow-hidden py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-red-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-2">
            {t('sharedWorkout.sharedBy')} {workout.sharedBy}
          </p>
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">{workout.name}</h1>
          <p className="text-white/40 text-sm">
            {new Date(workout.date).toLocaleDateString(i18n.resolvedLanguage, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 sm:py-8 sm:px-6 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: t('sharedWorkout.duration'), value: `${workout.duration} min` },
            { label: t('sharedWorkout.exercises'), value: workout.exercises.length },
            { label: t('sharedWorkout.volume'), value: `${(workout.totalVolume / 1000).toFixed(1)}t` },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 text-center shadow-sm">
              <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Exercise list */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800">
            <h2 className="font-black text-gray-900 dark:text-white">{t('sharedWorkout.exercises')}</h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {workout.exercises.map((ex, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-black">
                    {i + 1}
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">{ex.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-orange-500">{ex.sets} × {ex.reps}</span>
                  {ex.weight > 0 && (
                    <span className="text-xs text-gray-400 ml-2">{ex.weight} kg</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={copyLink}
            className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
            {copied ? t('sharedWorkout.copied') : t('sharedWorkout.copyLink')}
          </button>
          <button onClick={() => navigate('/workout')}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-black py-3 rounded-xl hover:from-orange-400 hover:to-red-400 transition-all">
            {t('sharedWorkout.tryWorkout')}
          </button>
        </div>

        {/* FitTrack CTA */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-center">
          <p className="text-white font-black text-lg mb-1">{t('sharedWorkout.ctaTitle')}</p>
          <p className="text-white/50 text-sm mb-4">{t('sharedWorkout.ctaDesc')}</p>
          <button onClick={() => navigate('/register')}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-6 py-2.5 rounded-xl hover:from-orange-400 hover:to-red-400 transition-all">
            {t('sharedWorkout.getStarted')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedWorkoutPage;
