import React, { useEffect, useRef } from 'react';

interface SetData {
  exerciseName: string;
  reps?: number;
  weight?: number;
}

interface WorkoutSummaryModalProps {
  workoutName: string;
  durationSeconds: number;
  sets: SetData[];
  rating: number;
  onClose: () => void;
}

// CSS confetti — no library needed
const Confetti: React.FC = () => {
  const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
  const pieces = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[300]">
      {pieces.map((i) => {
        const color = COLORS[i % COLORS.length];
        const left   = `${Math.random() * 100}%`;
        const delay  = `${Math.random() * 1.5}s`;
        const size   = `${6 + Math.random() * 8}px`;
        const dur    = `${2 + Math.random() * 2}s`;
        const rotate = `${Math.random() * 360}deg`;
        const shape  = i % 3 === 0 ? 'rounded-full' : i % 3 === 1 ? 'rounded-sm rotate-45' : 'rounded-none';

        return (
          <div
            key={i}
            className={`absolute top-0 ${shape} animate-confetti-fall`}
            style={{
              left, width: size, height: size,
              backgroundColor: color,
              animationDelay: delay,
              animationDuration: dur,
              transform: `rotate(${rotate})`,
              opacity: 0.9,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
};

const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  workoutName, durationSeconds, sets, rating, onClose,
}) => {
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (!hasPlayed.current) {
      hasPlayed.current = true;
      if ('vibrate' in navigator) navigator.vibrate([30, 40, 30, 40, 80]);
    }
  }, []);

  const totalSets   = sets.length;
  const exercises   = [...new Set(sets.map(s => s.exerciseName))];
  const totalVolume = sets.reduce((acc, s) => acc + (s.reps || 0) * (s.weight || 0), 0);

  const fmtDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
    return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
  };

  const STAR_LABELS = ['', 'Rough 😓', 'Hard 😤', 'Good 💪', 'Great 🔥', 'Amazing! 🏆'];

  return (
    <>
      <Confetti />
      <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}/>

        <div className="relative z-10 w-full sm:max-w-md bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
          {/* Header gradient */}
          <div className="bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-violet-600/10 px-6 pt-8 pb-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-500/30 animate-bounce">
              <span className="text-3xl">🏆</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Workout Complete!</h2>
            <p className="text-slate-400 text-sm">{workoutName}</p>
            {rating > 0 && (
              <p className="text-sm font-bold mt-1 text-amber-400">{STAR_LABELS[rating]}</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-px bg-white/5 border-y border-white/5">
            {[
              { label: 'Duration',  value: fmtDuration(durationSeconds), icon: '⏱' },
              { label: 'Sets',      value: String(totalSets),             icon: '🎯' },
              { label: 'Exercises', value: String(exercises.length),      icon: '💪' },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-900 px-4 py-4 text-center">
                <div className="text-lg mb-0.5">{stat.icon}</div>
                <div className="text-xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {totalVolume > 0 && (
            <div className="mx-6 my-4 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-lg shrink-0">📊</div>
              <div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Total Volume</p>
                <p className="text-xl font-black text-white">{totalVolume.toLocaleString()} <span className="text-slate-400 text-sm font-normal">kg lifted</span></p>
              </div>
            </div>
          )}

          {/* Exercise list */}
          {exercises.length > 0 && (
            <div className="px-6 mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Exercises</p>
              <div className="flex flex-wrap gap-2">
                {exercises.map(ex => (
                  <span key={ex} className="text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 pb-8 flex gap-3">
            <button onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-95">
              Done
            </button>
            <button onClick={() => { onClose(); window.location.href = '/workout-history'; }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95">
              View History →
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkoutSummaryModal;
