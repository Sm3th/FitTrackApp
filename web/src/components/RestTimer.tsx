import React, { useState, useEffect, useRef } from 'react';
import { soundEffects } from '../utils/soundEffects';

interface RestTimerProps {
  duration: number;
  onComplete: () => void;
  onSkip: () => void;
}

const PRESET_DURATIONS = [30, 60, 90, 120];

const RestTimer: React.FC<RestTimerProps> = ({ duration, onComplete, onSkip }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Entrance animation
  useEffect(() => {
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    setTimeLeft(duration);
    setTotalDuration(duration);
  }, [duration]);

  useEffect(() => {
    if (timeLeft <= 0) { handleComplete(); return; }
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const handleComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    soundEffects.restComplete();
    onComplete();
  };

  const handleSkip = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onSkip();
  };

  const addTime = (delta: number) => {
    const next = Math.max(0, timeLeft + delta);
    setTimeLeft(next);
    if (delta > 0) setTotalDuration(t => t + delta);
  };

  const setPreset = (s: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(s);
    setTotalDuration(s);
  };

  // Ring math
  const radius = 88;
  const circ = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, timeLeft / totalDuration));
  const dashOffset = circ * (1 - progress);     // drains as time passes

  const isUrgent = timeLeft <= 10 && timeLeft > 0;
  const isDone   = timeLeft === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={handleSkip} />

      {/* Modal — scale-in entrance */}
      <div
        className="relative z-10 bg-slate-900 border border-slate-700/80 rounded-3xl p-8 max-w-sm w-full shadow-2xl shadow-black/60"
        style={{
          opacity:   mounted ? 1 : 0,
          transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(16px)',
          transition: 'opacity 0.3s cubic-bezier(0.16,1,0.3,1), transform 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-1.5 mb-2">
            <span className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-orange-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">
              {isDone ? 'Done!' : 'Rest Time'}
            </span>
          </div>
          <p className="text-slate-400 text-xs">
            {isUrgent ? "Almost there — get ready!" : "Take a breather, you earned it!"}
          </p>
        </div>

        {/* SVG Ring */}
        <div
          className="relative mx-auto mb-5"
          style={{ width: 200, height: 200 }}>
          <svg className="-rotate-90" width="200" height="200">
            <defs>
              <linearGradient id="restGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor={isUrgent ? '#f97316' : '#6366f1'} />
                <stop offset="100%" stopColor={isUrgent ? '#ef4444' : '#8b5cf6'} />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle cx="100" cy="100" r={radius}
              stroke="rgba(255,255,255,0.06)" strokeWidth="14" fill="none" />
            {/* Depleting arc */}
            <circle cx="100" cy="100" r={radius}
              stroke="url(#restGrad)" strokeWidth="14" fill="none"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease' }}
            />
          </svg>

          {/* Center display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-6xl font-black tabular-nums transition-colors duration-300 ${
                isUrgent ? 'text-orange-400' : isDone ? 'text-emerald-400' : 'text-white'
              } ${isUrgent ? 'animate-pulse' : ''}`}>
              {timeLeft}
            </span>
            <span className="text-xs text-slate-500 uppercase tracking-widest mt-1">seconds</span>
          </div>
        </div>

        {/* Preset quick-select */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {PRESET_DURATIONS.map(s => (
            <button key={s} onClick={() => setPreset(s)}
              className={`py-2 rounded-xl text-xs font-bold transition-all active:scale-90 ${
                totalDuration === s && timeLeft === s
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400'
              }`}>
              {s}s
            </button>
          ))}
        </div>

        {/* +/- fine adjust */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => addTime(-15)}
            className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-bold py-2.5 rounded-xl transition-all active:scale-95">
            −15s
          </button>
          <button onClick={() => addTime(+15)}
            className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-bold py-2.5 rounded-xl transition-all active:scale-95">
            +15s
          </button>
        </div>

        {/* Skip / Done */}
        <button onClick={handleSkip}
          className="w-full font-black py-3.5 rounded-2xl text-base transition-all shadow-lg active:scale-95"
          style={{
            background: 'linear-gradient(135deg, var(--p-from), var(--p-to))',
            boxShadow: '0 8px 24px var(--p-shadow)',
          }}>
          {isDone ? 'Continue →' : 'Skip Rest →'}
        </button>
      </div>
    </div>
  );
};

export default RestTimer;
