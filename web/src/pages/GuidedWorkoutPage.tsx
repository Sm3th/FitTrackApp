import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { getPlanById, WorkoutPlan } from '../data/workoutPlans';
import { soundEffects } from '../utils/soundEffects';
import { getExerciseGuideByName, ExerciseGuide } from '../data/exerciseGuides';
import ExerciseDemoModal from '../components/ExerciseDemoModal';
import { useTranslation } from 'react-i18next';

type WorkoutPhase = 'ready' | 'exercise' | 'rest' | 'completed';

const GuidedWorkoutPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast, showToast, hideToast } = useToast();

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [phase, setPhase] = useState<WorkoutPhase>('ready');
  const [timeLeft, setTimeLeft] = useState(5);
  const [isPaused, setIsPaused] = useState(false);
  const [workoutSessionId, setWorkoutSessionId] = useState<string | null>(null);
  const [demoGuide, setDemoGuide] = useState<ExerciseGuide | null>(null);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<Date>(new Date());

  useEffect(() => {
    document.body.classList.add('no-pull-refresh');
    return () => { document.body.classList.remove('no-pull-refresh'); };
  }, []);

  useEffect(() => {
    if (planId) {
      const foundPlan = getPlanById(planId);
      if (foundPlan) {
        setPlan(foundPlan);
      } else {
        showToast(t('guided.planNotFound') || 'Plan not found', 'error');
        navigate('/workout-plans');
      }
    }
  }, [planId, navigate]);

  useEffect(() => {
    if (plan) startWorkoutSession();
  }, [plan]);

  const startWorkoutSession = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.post(
        'http://localhost:3000/api/workouts/sessions/start',
        { name: plan?.name || 'Guided Workout', notes: `Workout Plan: ${plan?.id}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWorkoutSessionId(response.data.data.id);
      startTimeRef.current = new Date();
    } catch (error) {
      console.error('Start workout error:', error);
    }
  };

  useEffect(() => {
    if (isPaused || !plan) return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleTimerComplete(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [phase, isPaused, currentExerciseIndex, plan]);

  const handleTimerComplete = () => {
    if (phase === 'ready') startExercise();
    else if (phase === 'exercise') startRest();
    else if (phase === 'rest') nextExercise();
  };

  const startExercise = () => {
    if (!plan) return;
    const exercise = plan.exercises[currentExerciseIndex];
    const duration = exercise.duration || (exercise.sets && exercise.reps ? exercise.sets * exercise.reps * 3 : 30);
    setPhase('exercise');
    setTimeLeft(duration);
  };

  const startRest = () => {
    if (!plan) return;
    const exercise = plan.exercises[currentExerciseIndex];
    setPhase('rest');
    setTimeLeft(exercise.restAfter);
  };

  const nextExercise = () => {
    if (!plan) return;
    if (currentExerciseIndex < plan.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setPhase('ready');
      setTimeLeft(5);
    } else {
      completeWorkout();
    }
  };

  const skipExercise = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    soundEffects.success();
    nextExercise();
  };

  const togglePause = () => setIsPaused(p => !p);

  const completeWorkout = async () => {
    setPhase('completed');
    soundEffects.workoutComplete();
    try {
      const token = localStorage.getItem('token');
      if (workoutSessionId && token) {
        await axios.patch(
          `http://localhost:3000/api/workouts/sessions/${workoutSessionId}/end`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      showToast(t('guided.crushedIt') + '! 🏆', 'success');
    } catch (error) {
      console.error('End workout error:', error);
    }
  };

  const quitWorkout = () => {
    if (window.confirm(t('guided.quitConfirm'))) {
      completeWorkout();
      setTimeout(() => navigate('/workout-plans'), 1000);
    }
  };

  const getProgress = (): number => {
    if (!plan) return 0;
    return ((currentExerciseIndex + 1) / plan.exercises.length) * 100;
  };

  if (!plan) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentExercise = plan.exercises[currentExerciseIndex];
  const nextEx = currentExerciseIndex < plan.exercises.length - 1 ? plan.exercises[currentExerciseIndex + 1] : null;
  const currentGuide = getExerciseGuideByName(currentExercise.exerciseName);

  const maxTime = phase === 'ready' ? 5 : phase === 'exercise' ? (currentExercise.duration || 30) : currentExercise.restAfter;
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (timeLeft / maxTime);

  // Phase config
  const phaseConfig = {
    ready: { label: t('guided.getReady'), sublabel: t('guided.prepare'), color: 'from-blue-500 to-indigo-600', accent: 'text-blue-400', ring: '#6366f1' },
    exercise: { label: t('guided.go'), sublabel: t('guided.giveEverything'), color: 'from-orange-500 to-red-500', accent: 'text-orange-400', ring: '#f97316' },
    rest: { label: t('guided.rest'), sublabel: t('guided.recoveryTime'), color: 'from-emerald-500 to-teal-500', accent: 'text-emerald-400', ring: '#10b981' },
    completed: { label: t('guided.done'), sublabel: '', color: 'from-violet-500 to-purple-600', accent: 'text-violet-400', ring: '#8b5cf6' },
  };

  const config = phaseConfig[phase];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* Completed Screen */}
      {phase === 'completed' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          {/* Glow orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="w-28 h-28 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-violet-500/30 animate-bounce">
              <span className="text-5xl">🏆</span>
            </div>
            <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              {t('guided.crushedIt')}
            </h1>
            <p className="text-slate-400 text-lg mb-2">{plan.name}</p>
            <p className="text-slate-500 text-sm mb-10">
              {plan.exercises.length} {t('guided.exercisesCompleted')} · ~{plan.caloriesBurn} {t('guided.kcalBurned')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/workout-history')}
                className="bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold px-8 py-3.5 rounded-2xl transition-all"
              >
                {t('guided.viewHistory')}
              </button>
              <button
                onClick={() => navigate('/workout-plans')}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-violet-500/20 transition-all"
              >
                {t('guided.backToPlans')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workout Screen */}
      {phase !== 'completed' && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-2">
            <button
              onClick={quitWorkout}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{plan.name}</p>
              <p className="text-sm font-black text-white">
                {currentExerciseIndex + 1} <span className="text-slate-500 font-normal">{t('guided.ofExercises')}</span> {plan.exercises.length}
              </p>
            </div>

            <button
              onClick={togglePause}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
            >
              {isPaused ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              )}
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-5 mb-4">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-700"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>

          {/* Phase badge */}
          <div className="text-center mb-4">
            <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${config.color} rounded-full px-5 py-1.5 shadow-lg`}>
              <span className="text-xs font-black tracking-widest">{config.label}</span>
            </div>
            <p className="text-slate-500 text-xs mt-1.5">{config.sublabel}</p>
          </div>

          {/* Exercise Name */}
          <div className="text-center px-6 mb-4">
            <h1 className="text-3xl md:text-4xl font-black leading-tight">{currentExercise.exerciseName}</h1>
            {phase === 'exercise' && currentExercise.sets && currentExercise.reps && (
              <p className={`text-sm font-semibold mt-1 ${config.accent}`}>
                {currentExercise.sets} sets × {currentExercise.reps} reps
              </p>
            )}
            {phase === 'rest' && nextEx && (
              <p className="text-sm text-slate-500 mt-1">{t('guided.next')} <span className="text-slate-300 font-semibold">{nextEx.exerciseName}</span></p>
            )}
          </div>

          {/* Timer */}
          <div className="flex justify-center mb-4 relative">
            <div className="relative">
              <svg className="transform -rotate-90" width="220" height="220">
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={config.ring} />
                    <stop offset="100%" stopColor={config.ring + '99'} />
                  </linearGradient>
                </defs>
                {/* Track */}
                <circle cx="110" cy="110" r={radius} stroke="rgba(255,255,255,0.07)" strokeWidth="10" fill="none" />
                {/* Progress */}
                <circle
                  cx="110" cy="110" r={radius}
                  stroke="url(#ringGrad)"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-7xl font-black tabular-nums">{timeLeft}</span>
                <span className="text-xs text-slate-500 uppercase tracking-widest mt-1">{t('guided.seconds') || 'seconds'}</span>
              </div>
            </div>

            {/* How To button */}
            {currentGuide && (
              <button
                onClick={() => { setIsPaused(true); setDemoGuide(currentGuide); }}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/15 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-bold text-xs px-4 py-2 rounded-full transition-all active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {t('guided.howTo')}
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3 px-5 pb-8">
            <button
              onClick={togglePause}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 font-bold py-4 rounded-2xl text-sm transition-all active:scale-95 touch-manipulation"
            >
              {isPaused ? (
                <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>{t('guided.resume')}</>
              ) : (
                <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>{t('guided.pause')}</>
              )}
            </button>
            <button
              onClick={skipExercise}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 font-bold py-4 rounded-2xl text-sm transition-all active:scale-95 touch-manipulation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
              </svg>
              {t('common.skip')}
            </button>
          </div>

          {/* Exercise list mini-map */}
          <div className="px-5 pb-6">
            <div className="flex gap-1.5 justify-center flex-wrap">
              {plan.exercises.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i < currentExerciseIndex ? 'bg-emerald-500 w-4' :
                    i === currentExerciseIndex ? 'bg-white w-6' :
                    'bg-white/20 w-4'
                  }`}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Paused overlay */}
      {isPaused && phase !== 'completed' && !demoGuide && (
        <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center" onClick={togglePause}>
          <div className="text-center" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </div>
            <p className="text-2xl font-black mb-2">{t('guided.paused')}</p>
            <p className="text-slate-400 text-sm mb-6">{t('guided.tapToResume')}</p>
            <div className="flex gap-3">
              <button onClick={togglePause} className="bg-white text-slate-900 font-black px-8 py-3 rounded-2xl hover:bg-gray-100 transition-all">
                {t('guided.resume')}
              </button>
              <button onClick={quitWorkout} className="bg-white/10 border border-white/20 text-white font-bold px-6 py-3 rounded-2xl hover:bg-white/15 transition-all">
                {t('guided.quit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Demo Modal */}
      {demoGuide && (
        <ExerciseDemoModal
          guide={demoGuide}
          onClose={() => { setDemoGuide(null); }}
        />
      )}

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default GuidedWorkoutPage;
