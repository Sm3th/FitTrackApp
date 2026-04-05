import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import Navbar from '../components/Navbar';
import { generateAIReport, type AIReport, type WorkoutEntry } from '../utils/aiRecommendations';

const INTENSITY_STYLES = {
  rest:     'bg-slate-100 dark:bg-slate-800 text-slate-400',
  light:    'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  moderate: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
  hard:     'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',
};

const CATEGORY_COLORS: Record<string, string> = {
  recovery:    'border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20',
  progression: 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20',
  balance:     'border-purple-200 dark:border-purple-900/50 bg-purple-50 dark:bg-purple-950/20',
  consistency: 'border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/20',
  technique:   'border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20',
};

const PRIORITY_DOT: Record<string, string> = {
  high:   'bg-red-500',
  medium: 'bg-amber-500',
  low:    'bg-emerald-500',
};

const AICoachPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    apiClient
      .get('/workouts/sessions?limit=100')
      .then(res => {
        const workouts: WorkoutEntry[] = res.data.data || [];
        setReport(generateAIReport(workouts));
      })
      .catch(() => {
        // Fallback: run report with no data
        setReport(generateAIReport([]));
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!report) return null;

  const { recommendations, weeklyPlan, score, scoreLabel, insights } = report;

  const scoreBg =
    score >= 85 ? 'from-emerald-500 to-teal-500' :
    score >= 70 ? 'from-blue-500 to-indigo-500' :
    score >= 55 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-500';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      {/* Hero */}
      <div className="relative bg-slate-950 overflow-hidden py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-red-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-2">{t('aiCoach.badge')}</p>
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">{t('aiCoach.title')}</h1>
          <p className="text-white/40 text-sm">{t('aiCoach.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 space-y-6">

        {/* Fitness Score Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className={`bg-gradient-to-r ${scoreBg} p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm font-semibold mb-1">{t('aiCoach.fitnessScore')}</p>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-black">{score}</span>
                  <span className="text-white/80 text-xl font-bold mb-2">/ 100</span>
                </div>
                <span className="inline-block bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full mt-1">
                  {scoreLabel}
                </span>
              </div>
              <div className="text-8xl opacity-20">🧠</div>
            </div>
          </div>
          {/* Score bar */}
          <div className="px-6 py-4">
            <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${scoreBg} rounded-full transition-all duration-1000`}
                style={{ width: `${score}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">{t('aiCoach.beginner')}</span>
              <span className="text-xs text-gray-400">{t('aiCoach.elite')}</span>
            </div>
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-5">
            <h3 className="font-black text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
              <span>💡</span> {t('aiCoach.coachInsights')}
            </h3>
            <ul className="space-y-2">
              {insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <span className="text-blue-400 mt-0.5">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">
            {t('aiCoach.recommendations')}
            <span className="ml-2 text-sm font-normal text-gray-400">({recommendations.length})</span>
          </h2>
          {recommendations.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center">
              <div className="text-5xl mb-3">🏆</div>
              <p className="font-black text-gray-800 dark:text-white text-lg">{t('aiCoach.perfectBalance')}</p>
              <p className="text-gray-500 mt-1 text-sm">{t('aiCoach.noIssues')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map(rec => (
                <div key={rec.id}
                  className={`rounded-2xl border p-5 ${CATEGORY_COLORS[rec.category]}`}>
                  <div className="flex items-start gap-4">
                    <span className="text-2xl shrink-0">{rec.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[rec.priority]}`} />
                        <h3 className="font-black text-gray-900 dark:text-white text-sm">{rec.title}</h3>
                        <span className="text-xs text-gray-400 capitalize ml-auto shrink-0">{rec.priority}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{rec.reason}</p>
                      {rec.action && rec.actionRoute && (
                        <button
                          onClick={() => navigate(rec.actionRoute!)}
                          className="mt-3 text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors">
                          {rec.action} →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Plan */}
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">{t('aiCoach.weeklyPlan')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
            {weeklyPlan.map((day, i) => (
              <div key={i}
                className={`rounded-xl p-3 text-center ${INTENSITY_STYLES[day.intensity]}`}>
                <p className="text-xs font-black uppercase tracking-wide mb-1 opacity-60">{day.day}</p>
                <p className="text-xl mb-1">{day.emoji}</p>
                <p className="text-xs font-black leading-tight mb-1">{day.type}</p>
                <p className="text-[10px] opacity-60 leading-tight">{day.focus}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            {t('aiCoach.subtitle')}
          </p>
        </div>

        {/* Empty state CTA */}
        {recommendations.length === 0 && insights.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-8 text-center">
            <div className="text-5xl mb-3">📊</div>
            <p className="font-black text-gray-800 dark:text-white">{t('aiCoach.startLogging')}</p>
            <p className="text-gray-500 mt-1 text-sm mb-4">{t('aiCoach.noWorkoutsDesc')}</p>
            <button onClick={() => navigate('/workout')}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-6 py-2.5 rounded-xl hover:from-orange-400 hover:to-red-400 transition-all">
              {t('aiCoach.goWorkout')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AICoachPage;
