import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import Navbar from '../components/Navbar';
import BodyScoreMap from '../components/BodyScoreMap';
import { MuscleGroup, MUSCLE_EMOJI, calculateBodyScores, loadWorkoutSetsFromHistory, getOverallScoreForPeriod } from '../utils/bodyScore';

const MUSCLE_EXERCISES: Record<MuscleGroup, string[]> = {
  chest: ['Bench Press', 'Incline Bench Press', 'Push-Up', 'Cable Fly', 'Dumbbell Fly', 'Chest Press'],
  back: ['Pull-Up', 'Lat Pulldown', 'Barbell Row', 'Seated Cable Row', 'Deadlift', 'Face Pull'],
  shoulders: ['Overhead Press', 'Lateral Raise', 'Front Raise', 'Arnold Press', 'Rear Delt Fly'],
  biceps: ['Barbell Curl', 'Hammer Curl', 'Concentration Curl', 'Preacher Curl', 'Cable Curl'],
  triceps: ['Skull Crusher', 'Triceps Pushdown', 'Overhead Tricep Extension', 'Close Grip Bench'],
  legs: ['Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Curl', 'Calf Raise', 'Hip Thrust', 'Lunge'],
  core: ['Plank', 'Crunch', 'Hanging Leg Raise', 'Russian Twist', 'Ab Wheel', 'Mountain Climber'],
  cardio: ['Treadmill Run', 'Cycling', 'Jump Rope', 'Rowing Machine', 'HIIT Sprint', 'Elliptical'],
};

const ALL_MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core', 'cardio'];

const BodyScorePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(
    (location.state as any)?.muscle ?? null
  );
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());

  const workoutSets = useMemo(() => loadWorkoutSetsFromHistory(), []);
  const bodyScores = useMemo(() => calculateBodyScores(workoutSets), [workoutSets]);

  // Trend: overall score per week for the last 5 weeks
  const trendData = useMemo(() => {
    const weeks: { label: string; score: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      end.setHours(0, 0, 0, 0);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      const label = i === 0 ? 'This wk' : `${i}w ago`;
      weeks.push({ label, score: getOverallScoreForPeriod(workoutSets, start, end) });
    }
    return weeks;
  }, [workoutSets]);

  const weakestMuscle = useMemo(() => {
    let worst: MuscleGroup = 'core';
    let lowestScore = Infinity;
    Object.entries(bodyScores.scores).forEach(([m, s]) => {
      if (s.score < lowestScore) { lowestScore = s.score; worst = m as MuscleGroup; }
    });
    return worst;
  }, [bodyScores]);

  const selectedScore = selectedMuscle ? bodyScores.scores[selectedMuscle] : null;
  const suggestedExercises = selectedMuscle ? MUSCLE_EXERCISES[selectedMuscle] : [];

  const handleMuscleSelect = (muscle: MuscleGroup | null) => {
    setSelectedMuscle(muscle);
    setSelectedExercises(new Set()); // reset exercise picks on muscle change
  };

  const toggleExercise = (ex: string) => {
    setSelectedExercises(prev => {
      const next = new Set(prev);
      if (next.has(ex)) next.delete(ex); else next.add(ex);
      return next;
    });
  };

  const handleStartWorkout = () => {
    const exercises = selectedExercises.size > 0
      ? [...selectedExercises]
      : suggestedExercises.slice(0, 3);
    navigate('/workout', {
      state: {
        suggestedExercises: exercises,
        muscleName: selectedMuscle ? muscleLabel(selectedMuscle) : '',
      },
    });
  };

  const muscleLabel = (m: MuscleGroup) => t(`bodyScore.muscles.${m}` as any, m);
  const gradeLabel = (grade: string) => t(`bodyScore.grade_${grade}` as any, grade);
  const gradeTip = (grade: string) => t(`bodyScore.tip_${grade}` as any, '');

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden py-10 sm:py-14" style={{ background: '#080a12' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20"
            style={{ background: 'var(--p-from)' }} />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-15"
            style={{ background: 'var(--p-to)' }} />
          <div className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--p-from), var(--p-to))', boxShadow: '0 6px 20px var(--p-shadow)' }}>
              🧬
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight leading-none">{t('bodyScore.title')}</h1>
              <p className="text-white/40 text-sm mt-1">{t('bodyScore.subtitle')}</p>
            </div>
            <div className="ml-auto text-center">
              <div className="text-4xl font-black text-white leading-none">{bodyScores.overallScore}</div>
              <div className="text-white/35 text-xs font-bold uppercase tracking-wide mt-0.5">{t('bodyScore.overall')}</div>
            </div>
          </div>

          <div className="mt-6 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${bodyScores.overallScore}%`,
                background: 'linear-gradient(90deg, var(--p-from), var(--p-to))',
                boxShadow: '0 0 12px color-mix(in srgb, var(--p-500) 60%, transparent)',
              }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 sm:py-8 sm:px-6 space-y-6">

        {/* 5-week trend chart */}
        {trendData.some(d => d.score > 0) && (
          <div className="surface-form rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-gray-900 dark:text-white text-base">Score Trend</h2>
              <span className="text-xs text-gray-400 dark:text-white/35 font-medium">Last 5 weeks</span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={trendData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.12)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'rgba(128,128,128,0.7)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'rgba(128,128,128,0.7)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1e2130', border: 'none', borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}
                  itemStyle={{ color: '#fff', fontWeight: 700 }}
                  formatter={(v: number) => [`${v}%`, 'Score']}
                />
                <Line
                  type="monotone" dataKey="score" stroke="url(#scoreGrad)" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#818cf8' }}
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--p-from)" />
                    <stop offset="100%" stopColor="var(--p-to)" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Weakest alert */}
        {bodyScores.scores[weakestMuscle].totalSets === 0 && (
          <div className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              background: 'color-mix(in srgb, #ef4444 8%, transparent)',
              border: '1px solid color-mix(in srgb, #ef4444 20%, transparent)',
            }}>
            <span className="text-2xl">⚠️</span>
            <div className="flex-1 min-w-0">
              <div className="font-black text-white text-sm">
                {MUSCLE_EMOJI[weakestMuscle]} {muscleLabel(weakestMuscle)} {t('bodyScore.needsAttention')}
              </div>
              <div className="text-white/45 text-xs mt-0.5">{t('bodyScore.notTrainedRecently')}</div>
            </div>
            <button
              onClick={() => setSelectedMuscle(weakestMuscle)}
              className="ml-auto px-3 py-1.5 rounded-xl text-xs font-black text-white flex-shrink-0 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #ef4444, #f43f5e)' }}
            >
              {t('bodyScore.fixIt')}
            </button>
          </div>
        )}

        {/* Body map card */}
        <div className="surface-form rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-black text-gray-900 dark:text-white text-lg">{t('bodyScore.interactiveMap')}</h2>
            <span className="text-xs text-gray-400 dark:text-white/40 font-medium">{t('bodyScore.tapToSelect')}</span>
          </div>
          <BodyScoreMap
            scores={bodyScores.scores}
            selectedMuscle={selectedMuscle}
            onSelect={handleMuscleSelect}
          />
        </div>

        {/* Selected muscle detail */}
        {selectedMuscle && selectedScore && (
          <div
            className="rounded-2xl p-6 animate-fade-up"
            style={{
              background: `color-mix(in srgb, ${selectedScore.color} 8%, #0d0f1a)`,
              border: `1px solid color-mix(in srgb, ${selectedScore.color} 22%, transparent)`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: `color-mix(in srgb, ${selectedScore.color} 18%, transparent)` }}
                >
                  {MUSCLE_EMOJI[selectedMuscle]}
                </div>
                <div>
                  <div className="font-black text-white text-xl leading-none">{muscleLabel(selectedMuscle)}</div>
                  <div className="text-white/40 text-xs mt-0.5 font-medium">{gradeLabel(selectedScore.grade)}</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black leading-none" style={{ color: selectedScore.color }}>
                  {selectedScore.grade}
                </div>
                <div className="text-white/30 text-xs">{selectedScore.score}%</div>
              </div>
            </div>

            {/* Score bar */}
            <div className="h-3 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${selectedScore.score}%`, background: selectedScore.color, boxShadow: `0 0 10px ${selectedScore.color}88` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-white/45">{t('bodyScore.setsLast30', { n: selectedScore.totalSets })}</span>
              {selectedScore.lastTrained && (
                <span className="text-white/35">
                  {t('bodyScore.lastTrained')} {new Date(selectedScore.lastTrained).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>

            <p className="text-white/50 text-sm mb-5">{gradeTip(selectedScore.grade)}</p>

            {/* Suggested exercises — selectable */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black text-white/40 uppercase tracking-wide">{t('bodyScore.suggestedExercises')}</p>
                {selectedExercises.size > 0 && (
                  <button onClick={() => setSelectedExercises(new Set())}
                    className="text-xs text-white/30 hover:text-white/60 transition-colors">
                    {t('bodyScore.clearAll', 'Clear all')}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {suggestedExercises.map(ex => {
                  const picked = selectedExercises.has(ex);
                  return (
                    <button
                      key={ex}
                      onClick={() => toggleExercise(ex)}
                      className="rounded-xl px-3 py-2.5 text-sm font-semibold text-left transition-all active:scale-95 flex items-center gap-2"
                      style={{
                        background: picked
                          ? `color-mix(in srgb, ${selectedScore?.color || '#6366f1'} 18%, transparent)`
                          : 'rgba(255,255,255,0.05)',
                        border: picked
                          ? `1px solid color-mix(in srgb, ${selectedScore?.color || '#6366f1'} 50%, transparent)`
                          : '1px solid rgba(255,255,255,0.07)',
                        color: picked ? '#fff' : 'rgba(255,255,255,0.65)',
                      }}
                    >
                      <span className="text-base leading-none flex-shrink-0" style={{ color: picked ? selectedScore?.color || '#6366f1' : 'rgba(255,255,255,0.25)' }}>
                        {picked ? '✓' : '+'}
                      </span>
                      {ex}
                    </button>
                  );
                })}
              </div>
              {selectedExercises.size === 0 && (
                <p className="text-xs text-white/25 mt-2 text-center">{t('bodyScore.tapToAdd', 'Tap exercises to add them to your workout')}</p>
              )}
            </div>

            <button
              onClick={handleStartWorkout}
              className="w-full mt-5 py-3.5 rounded-2xl font-black text-white text-sm transition-all active:scale-95 hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, var(--p-from), var(--p-to))',
                boxShadow: '0 8px 24px color-mix(in srgb, var(--p-500) 35%, transparent)',
              }}
            >
              {selectedExercises.size > 0
                ? t('bodyScore.startWithN', { n: selectedExercises.size, defaultValue: `Start Workout · ${selectedExercises.size} exercises` })
                : t('bodyScore.startWorkout', { muscle: muscleLabel(selectedMuscle!) })}
            </button>
          </div>
        )}

        {/* All muscles summary */}
        <div className="surface-form rounded-2xl p-6">
          <h2 className="font-black text-gray-900 dark:text-white text-lg mb-4">{t('bodyScore.summary')}</h2>
          <div className="space-y-3">
            {ALL_MUSCLES.map(muscle => {
              const s = bodyScores.scores[muscle];
              return (
                <button
                  key={muscle}
                  onClick={() => setSelectedMuscle(selectedMuscle === muscle ? null : muscle)}
                  className="w-full flex items-center gap-3 transition-all active:scale-[0.99]"
                >
                  <span className="text-lg w-6 flex-shrink-0">{MUSCLE_EMOJI[muscle]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-800 dark:text-white/80">{muscleLabel(muscle)}</span>
                      <span className="text-xs font-black" style={{ color: s.color }}>{s.grade} · {s.score}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(128,128,128,0.15)' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.score}%`, background: s.color }} />
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-white/30 mt-0.5">{s.totalSets} {t('common.sets')}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BodyScorePage;
