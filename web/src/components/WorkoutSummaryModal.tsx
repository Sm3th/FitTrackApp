import React, { useEffect, useRef, useState } from 'react';
import { useCountUp } from '../hooks/useCountUp';

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

// ── Confetti ───────────────────────────────────────────────────────��──────────
const CONFETTI_COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const Confetti: React.FC = () => {
  const pieces = useRef(
    Array.from({ length: 70 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left: `${(i * 137.5) % 100}%`,          // golden-ratio spread, no random
      delay: `${(i * 47) % 1800}ms`,
      size: `${6 + (i % 5)}px`,
      dur: `${2000 + (i * 89) % 1600}ms`,
      rotate: `${(i * 73) % 360}deg`,
      shape: i % 3,
    }))
  ).current;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[300]">
      {pieces.map(p => (
        <div
          key={p.id}
          className={`absolute top-0 animate-confetti-fall ${p.shape === 0 ? 'rounded-full' : p.shape === 1 ? 'rounded-sm' : ''}`}
          style={{
            left: p.left, width: p.size, height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.dur,
            transform: `rotate(${p.rotate})`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

// ── Motivational messages based on performance ─────────────────────────���──────
const getMotivation = (sets: number, volume: number, duration: number): string => {
  if (sets === 0) return 'Every start counts. You showed up! 💪';
  if (duration > 5400) return "Beast mode activated. That's over 90 minutes! 🦁";
  if (volume > 10000) return `Massive session — ${(volume / 1000).toFixed(1)} tonnes lifted! 🏋️`;
  if (sets > 20) return `${sets} sets logged. Absolute grinder! 🔥`;
  if (sets > 10) return 'Solid work. Consistency is everything. ⚡';
  return 'Great session. Progress is progress! 🎯';
};

// ── Animated stat card ────────────────────────────────────────────────────────
const StatCard = React.memo<{
  icon: string;
  value: string;
  label: string;
  delay?: number;
}>(({ icon, value, label, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="bg-slate-900 px-4 py-4 text-center"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}>
      <div className="text-lg mb-0.5">{icon}</div>
      <div className="text-xl font-black text-white tabular-nums">{value}</div>
      <div className="text-xs text-slate-500 font-medium">{label}</div>
    </div>
  );
});

// ── Main Modal ────────────────────────────────────────────────────────────────
const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  workoutName, durationSeconds, sets, rating, onClose,
}) => {
  const hasPlayed = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // entrance animation trigger
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (!hasPlayed.current) {
      hasPlayed.current = true;
      if ('vibrate' in navigator) navigator.vibrate([30, 40, 30, 40, 80]);
    }
  }, []);

  const totalSets   = sets.length;
  const exercises   = [...new Set(sets.map(s => s.exerciseName))];
  const totalVolume = sets.reduce((acc, s) => acc + (s.reps || 0) * (s.weight || 0), 0);

  // Count-up animated numbers (start after mount)
  const animSets    = useCountUp(totalSets,    700, mounted);
  const animExs     = useCountUp(exercises.length, 600, mounted);
  const animVolume  = useCountUp(totalVolume, 1000, mounted);

  const fmtDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
    return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
  };

  const motivation = getMotivation(totalSets, totalVolume, durationSeconds);
  const STAR_LABELS = ['', 'Rough 😓', 'Hard 😤', 'Good 💪', 'Great 🔥', 'Amazing! 🏆'];

  return (
    <>
      <Confetti />
      <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

        {/* Modal panel — scale-in entrance */}
        <div
          className="relative z-10 w-full sm:max-w-md bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/50"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
            transition: 'opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.35s cubic-bezier(0.16,1,0.3,1)',
          }}>

          {/* Header */}
          <div className="bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-violet-600/10 px-6 pt-8 pb-6 text-center relative overflow-hidden">
            {/* Shimmer sweep */}
            <div className="absolute inset-0 animate-shimmer opacity-30 pointer-events-none" />

            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-500/40"
              style={{
                animation: 'bounce-trophy 0.6s cubic-bezier(0.36,0.07,0.19,0.97) 0.2s both',
              }}>
              <span className="text-3xl">🏆</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Workout Complete!</h2>
            <p className="text-slate-400 text-sm">{workoutName}</p>
            {rating > 0 && (
              <p className="text-sm font-bold mt-1 text-amber-400">{STAR_LABELS[rating]}</p>
            )}

            {/* Motivational message */}
            <p className="text-white/60 text-xs mt-3 italic">{motivation}</p>
          </div>

          {/* Stats grid — staggered entrance */}
          <div className="grid grid-cols-3 gap-px bg-white/5 border-y border-white/5">
            <StatCard icon="⏱"  value={fmtDuration(durationSeconds)} label="Duration"  delay={100} />
            <StatCard icon="🎯"  value={String(animSets)}             label="Sets"      delay={200} />
            <StatCard icon="💪"  value={String(animExs)}              label="Exercises" delay={300} />
          </div>

          {/* Volume card */}
          {totalVolume > 0 && (
            <div className="mx-6 my-4 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-3"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.4s ease 0.4s, transform 0.4s ease 0.4s',
              }}>
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-lg shrink-0">📊</div>
              <div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Total Volume</p>
                <p className="text-xl font-black text-white tabular-nums">
                  {animVolume.toLocaleString()} <span className="text-slate-400 text-sm font-normal">kg lifted</span>
                </p>
              </div>
            </div>
          )}

          {/* Exercise tags */}
          {exercises.length > 0 && (
            <div className="px-6 mb-4"
              style={{
                opacity: mounted ? 1 : 0,
                transition: 'opacity 0.4s ease 0.5s',
              }}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Exercises</p>
              <div className="flex flex-wrap gap-2">
                {exercises.map((ex, i) => (
                  <span key={ex}
                    className="text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full"
                    style={{
                      opacity: mounted ? 1 : 0,
                      transform: mounted ? 'scale(1)' : 'scale(0.85)',
                      transition: `opacity 0.3s ease ${0.5 + i * 0.06}s, transform 0.3s ease ${0.5 + i * 0.06}s`,
                    }}>
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 pb-8 space-y-2.5"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.35s ease 0.6s, transform 0.35s ease 0.6s',
            }}>
            {'share' in navigator && (
              <button
                onClick={() => {
                  navigator.share({
                    title: 'FitTrack Pro — Workout Complete!',
                    text: `Just crushed a workout! 🏆\n${workoutName}\n⏱ ${fmtDuration(durationSeconds)} | 🎯 ${totalSets} sets | 💪 ${exercises.length} exercises${totalVolume > 0 ? ` | 📊 ${totalVolume.toLocaleString()} kg` : ''}\n\n#FitTrackPro #Fitness`,
                  }).catch(() => {});
                }}
                className="w-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold py-3 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                </svg>
                Share Workout
              </button>
            )}
            <div className="flex gap-3">
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
      </div>

      {/* Trophy bounce keyframe */}
      <style>{`
        @keyframes bounce-trophy {
          0%   { transform: scale(0) rotate(-12deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(4deg); opacity: 1; }
          80%  { transform: scale(0.92) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default WorkoutSummaryModal;
