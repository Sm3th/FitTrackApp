import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../services/api';
import Navbar from '../components/Navbar';
import ActiveWorkout from '../components/ActiveWorkout';
import WorkoutTimer from '../components/WorkoutTimer';
import Toast from '../components/Toast';
import WorkoutSummaryModal from '../components/WorkoutSummaryModal';
import { useToast } from '../hooks/useToast';
import { soundEffects } from '../utils/soundEffects';
import { haptics } from '../utils/haptics';
import { useTranslation } from 'react-i18next';
import { calculateWorkoutXP, getLevelFromXP, getTotalXP, addXP } from '../utils/xpSystem';
import { appendWorkoutSets } from '../utils/bodyScore';
import XPResultScreen from '../components/XPResultScreen';

interface WorkoutSession {
  id: string;
  name?: string;
  notes?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
}

const STAR_COLORS = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-lime-400', 'text-emerald-400'];

const WorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as { suggestedExercises?: string[]; muscleName?: string; templateName?: string } | null);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [workoutName, setWorkoutName] = useState(
    navState?.templateName || (navState?.muscleName ? `${navState.muscleName} Day` : '')
  );
  const [loading, setLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [workoutRating, setWorkoutRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [ratingNote, setRatingNote] = useState('');
  const [completedSets] = useState<{ exerciseName: string; reps?: number; weight?: number }[]>([]);
  const [showXPScreen, setShowXPScreen] = useState(false);
  const [xpGain, setXpGain] = useState<import('../utils/xpSystem').XPGain | null>(null);
  const [prevLevelInfo, setPrevLevelInfo] = useState<import('../utils/xpSystem').LevelInfo | null>(null);
  const [newLevelInfo, setNewLevelInfo] = useState<import('../utils/xpSystem').LevelInfo | null>(null);
  const [xpLeveledUp, setXpLeveledUp] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const workoutStartRef = useRef<Date>(new Date());
  const { toast, showToast, hideToast } = useToast();
  const { t } = useTranslation();

  const handlePauseResume = () => {
    setIsPaused(p => {
      haptics.tap();
      return !p;
    });
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) navigate('/login');
  }, [navigate]);

  const handleStartWorkout = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) { showToast('Please login first', 'error'); navigate('/login'); return; }
      const response = await apiClient.post(
        '/workouts/sessions/start',
        { name: workoutName || 'Workout Session', notes: '' }
      );
      setActiveWorkout(response.data.data);
      setWorkoutName('');
      workoutStartRef.current = new Date();
      haptics.success();
      showToast("Workout started! Let's go! 🔥", 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to start workout', 'error');
    } finally { setLoading(false); }
  };

  const handleEndWorkout = () => {
    if (!activeWorkout) return;
    setWorkoutRating(0); setRatingNote('');
    setShowRatingModal(true);
  };

  const handleConfirmEnd = async () => {
    if (!activeWorkout) return;
    if (workoutRating > 0) {
      const existing: Record<string, { rating: number; note: string }> = JSON.parse(localStorage.getItem('workoutRatings') || '{}');
      existing[activeWorkout.id] = { rating: workoutRating, note: ratingNote.trim() };
      localStorage.setItem('workoutRatings', JSON.stringify(existing));
    }
    setShowRatingModal(false);
    try {
      setLoading(true);
      await apiClient.patch(`/workouts/sessions/${activeWorkout.id}/end`, {
        rating: workoutRating || undefined,
        ratingNote: ratingNote.trim() || undefined,
      });
      soundEffects.workoutComplete();
      haptics.workoutComplete();
      showToast('Workout completed! Amazing work! 🎉', 'success');

      // XP calculation
      const durationSec = Math.floor((new Date().getTime() - workoutStartRef.current.getTime()) / 1000);
      const gain = calculateWorkoutXP(durationSec, completedSets.length, workoutRating);
      const prevInfo = getLevelFromXP(getTotalXP());
      const { newTotal, leveledUp, newLevel: _nl } = addXP(gain.total);
      const nextInfo = getLevelFromXP(newTotal);
      setXpGain(gain);
      setPrevLevelInfo(prevInfo);
      setNewLevelInfo(nextInfo);
      setXpLeveledUp(leveledUp);

      // Persist muscle sets to body score history
      if (completedSets.length > 0) appendWorkoutSets(completedSets);

      setShowSummary(true);
      setActiveWorkout(null);
      setWorkoutRating(0); setRatingNote('');
      setTimeout(() => setShowXPScreen(true), 800);
    } catch (error) {
      showToast('Failed to end workout', 'error');
      soundEffects.error();
    } finally { setLoading(false); }
  };

  const STAR_LABELS = ['', t('workout.ratingRough'), t('workout.ratingHard'), t('workout.ratingGood'), t('workout.ratingGreat'), t('workout.ratingAmazing')];

  const displayStar = hoveredStar || workoutRating;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Page Hero */}
      <div className="relative overflow-hidden py-10 sm:py-14" style={{ background: '#080a12' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20"
            style={{ background: 'var(--p-from)' }} />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full blur-[80px] opacity-15"
            style={{ background: 'var(--p-to)' }} />
          <div className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, var(--p-from), var(--p-to))', boxShadow: '0 4px 16px var(--p-shadow)' }}>
              {activeWorkout ? '🏋️' : '💪'}
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight leading-none">
                {activeWorkout ? t('workout.activeWorkout') : t('workout.startWorkout')}
              </h1>
              <p className="text-white/35 text-sm mt-0.5 font-normal">
                {activeWorkout
                  ? `${t('workout.startedAt')} ${new Date(activeWorkout.startTime).toLocaleTimeString()}`
                  : t('workout.giveItAName')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 sm:py-8 sm:px-6 lg:px-8">

        {/* Start form */}
        {!activeWorkout && (
          <div className="surface-form rounded-2xl p-8 animate-fade-up">
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2.5">
                {t('workout.workoutNameOptional')}
              </label>
              <input
                type="text"
                value={workoutName}
                onChange={e => setWorkoutName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStartWorkout()}
                placeholder={t('workout.workoutNamePlaceholder')}
                className="input-premium"
              />
            </div>
            <button onClick={handleStartWorkout} disabled={loading}
              className="btn-primary w-full text-base py-4 disabled:opacity-50">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  {t('workout.starting')}
                </>
              ) : t('workout.startBtn')}
            </button>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
              {t('workout.pressEnter')} <kbd className="bg-gray-100 dark:bg-[#1a1d2e] px-1.5 py-0.5 rounded font-mono text-gray-600 dark:text-gray-400">N</kbd> {t('workout.toStartQuickly')}
            </p>
          </div>
        )}

        {/* Active workout */}
        {activeWorkout && (
          <div className="space-y-5 animate-fade-up">
            <div className="surface-form rounded-2xl overflow-hidden">
              {/* Top bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700/60">
                <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">
                    {activeWorkout.name || 'Workout Session'}
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Started {new Date(activeWorkout.startTime).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-black"
                    style={{
                      background: 'color-mix(in srgb, var(--p-500) 12%, transparent)',
                      color: 'var(--p-text)',
                      border: '1px solid color-mix(in srgb, var(--p-500) 20%, transparent)',
                    }}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-yellow-400' : 'animate-pulse'}`} style={!isPaused ? { background: 'var(--p-500)' } : undefined} />
                    <WorkoutTimer startTime={activeWorkout.startTime} isPaused={isPaused} />
                  </div>
                  <button
                    onClick={handlePauseResume}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                    style={{ background: 'color-mix(in srgb, var(--p-500) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--p-500) 20%, transparent)' }}
                    title={isPaused ? 'Resume workout' : 'Pause workout'}>
                    {isPaused
                      ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--p-text)' }}><path d="M8 5v14l11-7z"/></svg>
                      : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--p-text)' }}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    }
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <ActiveWorkout
                  workoutSessionId={activeWorkout.id}
                  suggestedExercises={navState?.suggestedExercises}
                />
              </div>
            </div>

            <button onClick={handleEndWorkout} disabled={loading}
              className="w-full text-white font-black py-4 rounded-2xl transition-all duration-200 active:scale-95 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #ef4444, #f43f5e)',
                boxShadow: '0 8px 24px rgba(239,68,68,0.3)',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(239,68,68,0.45)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(239,68,68,0.3)'; e.currentTarget.style.transform = ''; }}>
              {loading ? t('workout.finishing') : t('workout.endWorkout')}
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <button onClick={() => navigate('/workout-history')}
            className="text-sm text-gray-400 dark:text-gray-500 font-medium transition-colors hover:opacity-80"
            style={{ ['--hover-color' as string]: 'var(--p-text)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--p-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}>
            {t('workout.viewHistory')}
          </button>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-gray-100 dark:border-slate-800 animate-slide-up">
            <div className="text-center mb-6">
              <div className="text-6xl mb-3 animate-bounce-in">🎉</div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t('workout.workoutComplete')}</h2>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t('workout.howWasSession')}</p>
            </div>

            <div className="flex justify-center gap-3 mb-2">
              {[1,2,3,4,5].map(star => (
                <button key={star}
                  onClick={() => setWorkoutRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="text-5xl transition-all duration-150 hover:scale-125 focus:outline-none">
                  <span className={star <= displayStar ? 'opacity-100' : 'opacity-15'}>⭐</span>
                </button>
              ))}
            </div>

            <div className="h-6 flex items-center justify-center mb-5">
              {displayStar > 0 && (
                <span className={`text-sm font-bold ${STAR_COLORS[displayStar]}`}>
                  {STAR_LABELS[displayStar]}
                </span>
              )}
            </div>

            <input
              type="text"
              value={ratingNote}
              onChange={e => setRatingNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirmEnd()}
              placeholder={t('workout.anyNotes')}
              className="input-premium mb-6 text-sm"
            />

            <div className="flex gap-3">
              <button onClick={handleConfirmEnd} disabled={loading}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 rounded-xl font-bold hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 active:scale-95">
                {loading ? t('workout.saving') : t('workout.saveAndFinish')}
              </button>
              <button onClick={() => { setWorkoutRating(0); handleConfirmEnd(); }} disabled={loading}
                className="px-4 py-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm transition-colors">
                {t('common.skip')}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {showXPScreen && xpGain && prevLevelInfo && newLevelInfo && (
        <XPResultScreen
          xpGain={xpGain}
          prevLevelInfo={prevLevelInfo}
          newLevelInfo={newLevelInfo}
          leveledUp={xpLeveledUp}
          onClose={() => setShowXPScreen(false)}
        />
      )}

      {showSummary && (
        <WorkoutSummaryModal
          workoutName={activeWorkout?.name || 'Workout Session'}
          durationSeconds={Math.floor((new Date().getTime() - workoutStartRef.current.getTime()) / 1000)}
          sets={completedSets}
          rating={workoutRating}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
};

export default WorkoutPage;
