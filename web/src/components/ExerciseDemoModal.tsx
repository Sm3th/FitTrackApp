import React, { useState } from 'react';
import { ExerciseGuide } from '../data/exerciseGuides';

interface Props {
  guide: ExerciseGuide;
  onClose: () => void;
}

const DIFFICULTY_COLORS = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const TYPE_COLORS: Record<string, string> = {
  strength: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  cardio: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  flexibility: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  plyometric: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const ExerciseDemoModal: React.FC<Props> = ({ guide, onClose }) => {
  const [tab, setTab] = useState<'steps' | 'tips' | 'mistakes'>('steps');

  const handleYouTubeSearch = () => {
    const query = encodeURIComponent(guide.youtubeQuery);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-gray-100 dark:border-slate-800">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-lg shadow-blue-500/20">
            {guide.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              {guide.name}
            </h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DIFFICULTY_COLORS[guide.difficulty]}`}>
                {guide.difficulty}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[guide.type] || TYPE_COLORS.strength}`}>
                {guide.type}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400">
                {guide.equipment}
              </span>
            </div>
          </div>
          <button onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Muscles */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
          <div className="flex flex-wrap gap-1">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mr-1">Primary:</span>
            {guide.primaryMuscles.map(m => (
              <span key={m} className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                {m}
              </span>
            ))}
          </div>
          {guide.secondaryMuscles.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mr-1">Secondary:</span>
              {guide.secondaryMuscles.map(m => (
                <span key={m} className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tab Selector */}
        <div className="flex gap-1 px-6 pt-4 pb-2">
          {[
            { key: 'steps', label: 'How To Do It', icon: '📋' },
            { key: 'tips', label: 'Tips', icon: '💡' },
            { key: 'mistakes', label: 'Mistakes', icon: '⚠️' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex-1 text-xs font-semibold py-2 px-1 rounded-lg transition-all ${
                tab === t.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-2">
          {tab === 'steps' && (
            <ol className="space-y-3 py-2">
              {guide.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-black shadow-sm">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          )}

          {tab === 'tips' && (
            <ul className="space-y-2.5 py-2">
              {guide.tips.map((tip, i) => (
                <li key={i} className="flex gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
                  <span className="text-emerald-500 text-lg flex-shrink-0">✓</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{tip}</p>
                </li>
              ))}
              {/* Breathing cue */}
              <li className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/40 mt-2">
                <span className="text-blue-500 text-lg flex-shrink-0">💨</span>
                <div>
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-0.5">Breathing</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{guide.breathingCue}</p>
                </div>
              </li>
            </ul>
          )}

          {tab === 'mistakes' && (
            <ul className="space-y-2.5 py-2">
              {guide.commonMistakes.map((mistake, i) => (
                <li key={i} className="flex gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/40">
                  <span className="text-red-500 text-lg flex-shrink-0">✕</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{mistake}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer — YouTube */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button onClick={handleYouTubeSearch}
            className="w-full flex items-center justify-center gap-2.5 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Watch Tutorial on YouTube
          </button>
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
            Opens YouTube search — pick the video that looks best!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDemoModal;
