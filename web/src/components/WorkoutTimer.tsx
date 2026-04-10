import React, { useState, useEffect, useRef } from 'react';

interface WorkoutTimerProps {
  startTime: string;
  isPaused?: boolean;
}

const WorkoutTimer: React.FC<WorkoutTimerProps> = ({ startTime, isPaused = false }) => {
  const pausedAtRef = useRef<number | null>(null);
  const totalPausedRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    setElapsed(Math.floor((Date.now() - start - totalPausedRef.current) / 1000));

    if (isPaused) {
      pausedAtRef.current = Date.now();
      return;
    }

    // Resume: accumulate paused duration
    if (pausedAtRef.current !== null) {
      totalPausedRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start - totalPausedRef.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isPaused]);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return <span className="tabular-nums">{formatTime(elapsed)}</span>;
};

export default WorkoutTimer;
