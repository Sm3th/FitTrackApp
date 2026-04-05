import React, { useState, useEffect, useRef } from 'react';
import { soundEffects } from '../utils/soundEffects';

interface RestTimerProps {
  duration: number;
  onComplete: () => void;
  onSkip: () => void;
}

const RestTimer: React.FC<RestTimerProps> = ({ duration, onComplete, onSkip }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleComplete();
      return;
    }
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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

  const progress = ((duration - timeLeft) / duration) * 100;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);

  const isUrgent = timeLeft <= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative z-10 bg-slate-900 border border-slate-700/80 rounded-3xl p-8 max-w-sm w-full shadow-2xl shadow-black/50">

        {/* Top label */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-1.5 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Rest Time</span>
          </div>
          <p className="text-slate-400 text-sm">Take a breather — you earned it!</p>
        </div>

        {/* Circular Timer */}
        <div className="relative mx-auto mb-6" style={{ width: 200, height: 200 }}>
          <svg className="transform -rotate-90" width="200" height="200">
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isUrgent ? '#f97316' : '#6366f1'} />
                <stop offset="100%" stopColor={isUrgent ? '#ef4444' : '#8b5cf6'} />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle cx="100" cy="100" r={radius} stroke="rgba(255,255,255,0.07)" strokeWidth="12" fill="none" />
            {/* Progress */}
            <circle
              cx="100" cy="100" r={radius}
              stroke="url(#timerGrad)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-6xl font-black tabular-nums transition-colors ${isUrgent ? 'text-orange-400' : 'text-white'}`}>
              {timeLeft}
            </span>
            <span className="text-xs text-slate-500 uppercase tracking-widest mt-1">seconds</span>
          </div>
        </div>

        {/* Rest duration quick-select */}
        <div className="flex gap-2 mb-5">
          {[30, 60, 90, 120].map(s => (
            <button
              key={s}
              onClick={() => setTimeLeft(prev => prev + 15)}
              className="hidden"
            />
          ))}
          <button
            onClick={() => setTimeLeft(prev => prev + 15)}
            className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95"
          >
            +15s
          </button>
          <button
            onClick={() => setTimeLeft(prev => Math.max(0, prev - 15))}
            className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95"
          >
            -15s
          </button>
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black py-3.5 rounded-2xl text-base transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          Skip Rest →
        </button>
      </div>
    </div>
  );
};

export default RestTimer;
