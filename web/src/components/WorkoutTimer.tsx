import React, { useState, useEffect } from 'react';

interface WorkoutTimerProps {
  startTime: string;
}

const WorkoutTimer: React.FC<WorkoutTimerProps> = ({ startTime }) => {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    // Calculate initial elapsed time
    const start = new Date(startTime).getTime();
    const now = Date.now();
    setElapsed(Math.floor((now - start) / 1000));

    // Update every second
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsed(Math.floor((now - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-right">
      <div className="text-sm text-gray-500 mb-1">Duration</div>
      <div className="text-3xl font-bold text-blue-600 font-mono">
        ⏱️ {formatTime(elapsed)}
      </div>
    </div>
  );
};

export default WorkoutTimer;