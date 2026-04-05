import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { WORKOUT_PLANS } from '../data/workoutPlans';
import { useDebounce } from '../hooks/useDebounce';
import { useTranslation } from 'react-i18next';

const DIFF_BADGE: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const WorkoutPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const DIFFICULTY_TABS = [
    { key: 'all', label: t('plans.allPlans') },
    { key: 'beginner', label: t('plans.beginner') },
    { key: 'intermediate', label: t('plans.intermediate') },
    { key: 'advanced', label: t('plans.advanced') },
  ];

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(WORKOUT_PLANS.map(p => p.category)))],
    []
  );

  const filteredPlans = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return WORKOUT_PLANS
      .filter(p => selectedDifficulty === 'all' || p.difficulty === selectedDifficulty)
      .filter(p => selectedCategory === 'All' || p.category === selectedCategory)
      .filter(p => !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.targetMuscles?.some(m => m.toLowerCase().includes(q)));
  }, [selectedDifficulty, selectedCategory, debouncedSearch]);

  const counts = useMemo(() => ({
    all: WORKOUT_PLANS.length,
    beginner:     WORKOUT_PLANS.filter(p => p.difficulty === 'beginner').length,
    intermediate: WORKOUT_PLANS.filter(p => p.difficulty === 'intermediate').length,
    advanced:     WORKOUT_PLANS.filter(p => p.difficulty === 'advanced').length,
  }), []);


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      {/* Hero */}
      <div className="relative bg-slate-950 overflow-hidden py-14">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-red-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-2">Get Moving</p>
          <h1 className="text-5xl font-black text-white tracking-tight mb-3">{t('plans.title')}</h1>
          <p className="text-white/40 text-base max-w-xl mx-auto mb-6">
            {WORKOUT_PLANS.length} {t('plans.subtitle')}
          </p>
          {/* Quick stats */}
          <div className="flex justify-center gap-4 flex-wrap">
            {[
              { label: t('plans.beginner'), count: counts.beginner, color: 'text-emerald-400' },
              { label: t('plans.intermediate'), count: counts.intermediate, color: 'text-amber-400' },
              { label: t('plans.advanced'), count: counts.advanced, color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 border border-white/15 rounded-xl px-4 py-2 text-center">
                <div className={`text-lg font-black ${s.color}`}>{s.count}</div>
                <div className="text-xs text-white/40">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-5">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('plans.searchPlaceholder')}
            className="w-full pl-11 pr-10 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none shadow-sm transition-all" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        {/* Difficulty Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {DIFFICULTY_TABS.map(tab => (
            <button key={tab.key} onClick={() => setSelectedDifficulty(tab.key)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                selectedDifficulty === tab.key
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:border-orange-200 dark:hover:border-orange-700'
              }`}>
              {tab.label}
              <span className="ml-1.5 text-xs opacity-60">
                ({tab.key === 'all' ? counts.all : counts[tab.key as keyof typeof counts]})
              </span>
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        {(debouncedSearch || selectedDifficulty !== 'all' || selectedCategory !== 'All') && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-4">
            {t('plans.plansFound', { count: filteredPlans.length })}
          </p>
        )}

        {/* Grid */}
        {filteredPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPlans.map(plan => (
              <div key={plan.id}
                onClick={() => navigate(`/workout-plans/${plan.id}`)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group">

                {/* Colored top strip */}
                <div className={`h-1.5 bg-gradient-to-r ${plan.color}`} />

                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-gray-900 dark:text-white text-lg leading-tight group-hover:text-orange-500 transition-colors">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{plan.category}</p>
                    </div>
                    <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${DIFF_BADGE[plan.difficulty]}`}>
                      {plan.difficulty}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4 line-clamp-2">
                    {plan.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: t('plans.duration'), value: plan.duration },
                      { label: t('plans.exercises'), value: plan.exercises.length },
                      { label: 'kcal', value: `~${plan.caloriesBurn}` },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-center">
                        <div className="text-lg font-black text-orange-500">{s.value}</div>
                        <div className="text-xs text-gray-400">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Target muscles */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {plan.targetMuscles.slice(0, 3).map((muscle, i) => (
                      <span key={i} className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                        {muscle}
                      </span>
                    ))}
                    {plan.targetMuscles.length > 3 && (
                      <span className="text-xs text-gray-400">+{plan.targetMuscles.length - 3}</span>
                    )}
                  </div>

                  {/* Tags */}
                  {plan.tags && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {plan.tags.map(tag => (
                        <span key={tag} className="text-xs text-blue-500 dark:text-blue-400">#{tag.replace(/ /g, '')} </span>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/workout-plans/${plan.id}`); }}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-orange-500/20 active:scale-95">
                    {t('plans.viewPlan')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🔍</div>
            <h3 className="text-lg font-black text-gray-700 dark:text-gray-300 mb-1">{t('plans.noPlansFound')}</h3>
            <p className="text-gray-400 text-sm mb-4">
              {debouncedSearch ? t('plans.noResultsFor', { query: debouncedSearch }) : t('plans.tryDifferentFilter')}
            </p>
            <button onClick={() => { setSearchQuery(''); setSelectedDifficulty('all'); setSelectedCategory('All'); }}
              className="text-sm text-orange-500 hover:text-orange-400 font-bold transition-colors">
              {t('plans.clearFilters')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutPlansPage;
