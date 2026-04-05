import React, { useState } from 'react';
import axios from 'axios';
import ExerciseSelector from './ExerciseSelector';
import RestTimer from './RestTimer';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';
import { soundEffects } from '../utils/soundEffects';
import { getExerciseGuideByName, ExerciseGuide } from '../data/exerciseGuides';
import ExerciseDemoModal from './ExerciseDemoModal';

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  difficulty?: string;
}

interface ExerciseSet {
  id?: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  notes?: string;
}

interface ActiveWorkoutProps {
  workoutSessionId: string;
}

const ActiveWorkout: React.FC<ActiveWorkoutProps> = ({ workoutSessionId }) => {
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [reps, setReps] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [noteInput, setNoteInput] = useState<string>('');
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(60);
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null);
  const [editNote, setEditNote] = useState<string>('');
  const [demoGuide, setDemoGuide] = useState<ExerciseGuide | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const handleSelectExercise = (exercise: Exercise) => {
    setCurrentExercise(exercise);
    setShowExerciseSelector(false);
    showToast(`${exercise.name} selected!`, 'info');
  };

  // Detect PR: highest weight×reps for current exercise
  const isPR = (newReps: number, newWeight?: number): boolean => {
    const prevSets = sets.filter(s => s.exerciseId === currentExercise?.id);
    if (prevSets.length === 0) return false;
    const newVolume = (newWeight || 0) * newReps;
    const prevBest = Math.max(...prevSets.map(s => (s.weight || 0) * (s.reps || 0)));
    return newVolume > prevBest && newVolume > 0;
  };

  const handleAddSet = async () => {
    if (!currentExercise) {
      showToast('Please select an exercise first', 'warning');
      return;
    }
    if (!reps) {
      showToast('Please enter reps', 'warning');
      return;
    }

    const parsedReps = parseInt(reps);
    const parsedWeight = weight ? parseFloat(weight) : undefined;
    const pr = isPR(parsedReps, parsedWeight);

    const newSet: ExerciseSet = {
      exerciseId: currentExercise.id,
      exerciseName: currentExercise.name,
      setNumber: sets.filter(s => s.exerciseId === currentExercise.id).length + 1,
      reps: parsedReps,
      weight: parsedWeight,
      notes: noteInput.trim() || undefined,
    };

    setSets([...sets, newSet]);
    setReps('');
    setWeight('');
    setNoteInput('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/workouts/sets',
        {
          workoutSessionId,
          exerciseId: currentExercise.id,
          setNumber: newSet.setNumber,
          reps: newSet.reps,
          weight: newSet.weight,
          notes: newSet.notes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (pr) {
        showToast('🏆 New Personal Record!', 'success');
      } else {
        showToast('Set logged! 💪', 'success');
      }
      soundEffects.success();
      setShowRestTimer(true);
    } catch (error) {
      console.error('Failed to save set:', error);
      showToast('Failed to save set', 'error');
      soundEffects.error();
    }
  };

  const handleDeleteSet = (index: number) => {
    if (window.confirm('Delete this set?')) {
      setSets(sets.filter((_, i) => i !== index));
      showToast('Set deleted', 'info');
    }
  };

  const handleEditSet = (index: number) => {
    setEditingSetIndex(index);
    const set = sets[index];
    setReps(set.reps?.toString() || '');
    setWeight(set.weight?.toString() || '');
    setEditNote(set.notes || '');
  };

  const handleSaveEdit = (index: number) => {
    if (!reps) {
      showToast('Please enter reps', 'warning');
      return;
    }
    const newSets = [...sets];
    newSets[index] = {
      ...newSets[index],
      reps: parseInt(reps),
      weight: weight ? parseFloat(weight) : undefined,
      notes: editNote.trim() || undefined,
    };
    setSets(newSets);
    setEditingSetIndex(null);
    setReps('');
    setWeight('');
    setEditNote('');
    showToast('Set updated!', 'success');
  };

  const handleCancelEdit = () => {
    setEditingSetIndex(null);
    setReps('');
    setWeight('');
    setEditNote('');
  };

  const groupedSets = sets.reduce((acc, set) => {
    if (!acc[set.exerciseId]) {
      acc[set.exerciseId] = { exerciseName: set.exerciseName, sets: [] };
    }
    acc[set.exerciseId].sets.push(set);
    return acc;
  }, {} as Record<string, { exerciseName: string; sets: ExerciseSet[] }>);

  const currentExerciseSetCount = currentExercise
    ? sets.filter(s => s.exerciseId === currentExercise.id).length
    : 0;

  const exerciseGuide = currentExercise ? getExerciseGuideByName(currentExercise.name) : null;

  return (
    <div className="space-y-4">

      {/* Add Exercise Button */}
      <button
        onClick={() => setShowExerciseSelector(true)}
        className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black px-4 py-4 rounded-2xl text-base shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] touch-manipulation"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
        </svg>
        Add Exercise
      </button>

      {/* Current Exercise Panel */}
      {currentExercise && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Exercise header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-blue-500/5 to-indigo-500/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
              {currentExerciseSetCount + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-gray-900 dark:text-white text-base leading-tight truncate">
                {currentExercise.name}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {currentExercise.muscleGroup} · {currentExerciseSetCount} sets logged
              </p>
            </div>
            {exerciseGuide && (
              <button
                onClick={() => setDemoGuide(exerciseGuide)}
                className="flex-shrink-0 flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:bg-blue-200 dark:hover:bg-blue-900/60"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                How to
              </button>
            )}
          </div>

          <div className="p-5 space-y-4">
            {/* Reps + Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Reps *</label>
                <input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="12"
                  className="w-full px-4 py-3 text-base font-semibold bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="20"
                  className="w-full px-4 py-3 text-base font-semibold bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Notes <span className="font-normal normal-case">(optional)</span></label>
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSet()}
                placeholder="Focus on form, PR attempt…"
                className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Rest Duration */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Rest After Set</label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 120].map(seconds => (
                  <button
                    key={seconds}
                    onClick={() => setRestDuration(seconds)}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                      restDuration === seconds
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                  >
                    {seconds}s
                  </button>
                ))}
              </div>
            </div>

            {/* Log Set */}
            <button
              onClick={handleAddSet}
              className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black py-4 rounded-2xl text-base shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
              </svg>
              Log Set
            </button>
          </div>
        </div>
      )}

      {/* Logged Sets */}
      {Object.keys(groupedSets).length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-black text-gray-900 dark:text-white text-base">Today's Sets</h3>
            <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              {sets.length} total
            </span>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {Object.entries(groupedSets).map(([exerciseId, data]) => (
              <div key={exerciseId} className="px-5 py-4">
                <h4 className="text-sm font-black text-gray-700 dark:text-gray-300 mb-3">{data.exerciseName}</h4>
                <div className="space-y-2">
                  {data.sets.map((set, index) => {
                    const globalIndex = sets.findIndex(s => s === set);
                    const isEditing = editingSetIndex === globalIndex;

                    return (
                      <div key={index} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl px-3 py-2.5">
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-14">Set {set.setNumber}</span>
                              <input
                                type="number"
                                value={reps}
                                onChange={(e) => setReps(e.target.value)}
                                placeholder="Reps"
                                className="w-16 px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-400">reps</span>
                              <input
                                type="number"
                                step="0.5"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="kg"
                                className="w-16 px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-400">kg</span>
                              <button onClick={() => handleSaveEdit(globalIndex)} className="ml-auto text-emerald-500 hover:text-emerald-400 font-black text-lg">✓</button>
                              <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-300 font-bold">✕</button>
                            </div>
                            <input
                              type="text"
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              placeholder="Notes (optional)"
                              className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white outline-none"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-black flex items-center justify-center flex-shrink-0">
                                {set.setNumber}
                              </span>
                              <div className="flex gap-3 text-sm flex-1">
                                <span className="font-black text-gray-900 dark:text-white">{set.reps} <span className="font-normal text-gray-400 text-xs">reps</span></span>
                                {set.weight && (
                                  <span className="font-black text-gray-900 dark:text-white">{set.weight} <span className="font-normal text-gray-400 text-xs">kg</span></span>
                                )}
                              </div>
                              <button onClick={() => handleEditSet(globalIndex)} className="text-gray-300 dark:text-gray-600 hover:text-blue-500 transition-colors text-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                              </button>
                              <button onClick={() => handleDeleteSet(globalIndex)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors text-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                              </button>
                            </div>
                            {set.notes && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-1 ml-7">{set.notes}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {sets.length === 0 && !currentExercise && (
        <div className="text-center py-14">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>
            </svg>
          </div>
          <p className="text-lg font-black text-gray-700 dark:text-gray-300 mb-1">Ready to Crush It?</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Add an exercise above to start logging your sets</p>
        </div>
      )}

      {/* Exercise Selector */}
      <ExerciseSelector
        isOpen={showExerciseSelector}
        onClose={() => setShowExerciseSelector(false)}
        onSelect={handleSelectExercise}
      />

      {/* Rest Timer */}
      {showRestTimer && (
        <RestTimer
          duration={restDuration}
          onComplete={() => setShowRestTimer(false)}
          onSkip={() => setShowRestTimer(false)}
        />
      )}

      {/* Exercise Demo Modal */}
      {demoGuide && (
        <ExerciseDemoModal guide={demoGuide} onClose={() => setDemoGuide(null)} />
      )}

      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};

export default ActiveWorkout;
