import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { getPlanById, WorkoutPlan, WorkoutPlanExercise } from '../data/workoutPlans';
import { getExerciseGuideByName, ExerciseGuide } from '../data/exerciseGuides';
import ExerciseDemoModal from '../components/ExerciseDemoModal';

const DIFF_COLORS = {
  beginner: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  intermediate: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  advanced: 'bg-red-500/20 text-red-300 border-red-500/30',
};


const PlanDetailPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [demoGuide, setDemoGuide] = useState<ExerciseGuide | null>(null);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    if (planId) {
      const foundPlan = getPlanById(planId);
      if (foundPlan) {
        setPlan(foundPlan);
      } else {
        showToast('Plan not found', 'error');
        navigate('/workout-plans');
      }
    }
  }, [planId, navigate]);

  const handleStartWorkout = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please login to start workout', 'warning');
      navigate('/login');
      return;
    }
    localStorage.setItem('activeWorkoutPlan', JSON.stringify(plan));
    navigate(`/guided-workout/${planId}`);
  };

  const handleExerciseClick = (exercise: WorkoutPlanExercise) => {
    const guide = getExerciseGuideByName(exercise.exerciseName);
    if (guide) {
      setDemoGuide(guide);
    } else {
      showToast('No guide available for this exercise yet', 'warning');
    }
  };

  const getTotalTime = () => {
    if (!plan) return 0;
    let total = 0;
    plan.exercises.forEach(ex => {
      if (ex.duration) total += ex.duration;
      else if (ex.sets && ex.reps) total += ex.sets * 40;
      total += ex.restAfter;
    });
    return Math.ceil(total / 60);
  };

  const formatExercise = (ex: WorkoutPlanExercise) => {
    if (ex.duration) return `${ex.duration}s`;
    if (ex.sets && ex.reps) return `${ex.sets} × ${ex.reps} reps`;
    return '—';
  };

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const hasGuide = (ex: WorkoutPlanExercise) => !!getExerciseGuideByName(ex.exerciseName);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      {/* Hero */}
      <div className="relative bg-slate-950 overflow-hidden py-14">
        <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-20`} />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate('/workout-plans')}
            className="mb-5 flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            {t('planDetail.allPlans')}
          </button>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${DIFF_COLORS[plan.difficulty]}`}>
              {plan.difficulty.toUpperCase()}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full border border-white/20 text-white/60">
              {plan.category}
            </span>
            {plan.tags?.map(tag => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full border border-white/10 text-white/40">
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3 leading-tight">
            {plan.name}
          </h1>
          <p className="text-white/50 text-base mb-8 max-w-2xl">{plan.description}</p>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { key: 'duration', label: t('planDetail.duration'), value: `${getTotalTime()} min` },
              { key: 'exercises', label: t('planDetail.exercises'), value: plan.exercises.length },
              { key: 'calories', label: t('planDetail.calories'), value: `~${plan.caloriesBurn} kcal` },
            ].map(s => (
              <div key={s.key} className="bg-white/10 border border-white/15 backdrop-blur-sm rounded-xl px-5 py-3 text-center">
                <div className="text-xl font-black text-white">{s.value}</div>
                <div className="text-xs text-white/50 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <button onClick={handleStartWorkout}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black px-10 py-4 rounded-2xl text-lg shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all active:scale-95">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {t('planDetail.startWorkout')}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">

        {/* Target Muscles */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">{t('planDetail.targetMuscles')}</h2>
          <div className="flex flex-wrap gap-2">
            {plan.targetMuscles.map((muscle, i) => (
              <span key={i} className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-4 py-1.5 rounded-full text-sm font-semibold">
                {muscle}
              </span>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900 dark:text-white">
              {t('planDetail.exerciseList')}
              <span className="ml-2 text-sm font-normal text-gray-400">({plan.exercises.length} {t('planDetail.exercises').toLowerCase()})</span>
            </h2>
            <span className="text-xs text-gray-400 dark:text-gray-500">{t('planDetail.tapToSeeHow')}</span>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {plan.exercises.map((exercise, index) => {
              const hasDemo = hasGuide(exercise);
              return (
                <button
                  key={index}
                  onClick={() => handleExerciseClick(exercise)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
                >
                  {/* Number */}
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm bg-gradient-to-br ${plan.color}`}>
                    {index + 1}
                  </div>

                  {/* Name + details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                        {exercise.exerciseName}
                      </span>
                      {hasDemo && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                          Guide
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      <span className="font-semibold text-orange-500">{formatExercise(exercise)}</span>
                      <span>·</span>
                      <span>Rest {exercise.restAfter}s</span>
                    </div>
                  </div>

                  {/* Badge + Arrow */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {exercise.duration ? (
                      <div className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-lg text-xs font-bold">
                        ⏱ {exercise.duration}s
                      </div>
                    ) : (
                      <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg text-xs font-bold">
                        💪 {exercise.sets}×{exercise.reps}
                      </div>
                    )}
                    {hasDemo && (
                      <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40 p-6">
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">Tips for Success</h2>
          <ul className="space-y-2.5">
            {[
              'Warm up for 5 minutes before starting — a light jog or jumping jacks.',
              'Stay hydrated — drink water during every rest period.',
              'Focus on proper form, not speed. Quality beats quantity.',
              'If an exercise feels too hard, scale it down — that\'s smart training.',
              'Cool down and stretch for 5 minutes after finishing.',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom CTA */}
        <button onClick={handleStartWorkout}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black py-5 rounded-2xl text-lg shadow-xl shadow-orange-500/20 transition-all active:scale-95">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {t('planDetail.startWorkout')}
        </button>
      </div>

      {/* Exercise Demo Modal */}
      {demoGuide && (
        <ExerciseDemoModal guide={demoGuide} onClose={() => setDemoGuide(null)} />
      )}

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default PlanDetailPage;
