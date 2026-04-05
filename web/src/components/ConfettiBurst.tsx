import React from 'react';

interface ConfettiBurstProps {
  /** When true, confetti falls. Unmount to reset. */
  active: boolean;
  /** Number of pieces (default 80) */
  count?: number;
}

const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#f97316'];

/**
 * Fullscreen confetti burst — no random, deterministic golden-ratio spread.
 * Render conditionally: `{firing && <ConfettiBurst active />}`
 */
const ConfettiBurst: React.FC<ConfettiBurstProps> = ({ active, count = 80 }) => {
  if (!active) return null;

  const pieces = Array.from({ length: count }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    left: `${(i * 137.508) % 100}%`,   // golden-ratio — no clumping
    delay: `${(i * 31) % 1500}ms`,
    size: `${5 + (i % 6)}px`,
    dur: `${1800 + (i * 67) % 1400}ms`,
    rotate: `${(i * 113) % 360}deg`,
    shape: i % 4, // 0=circle, 1=square, 2=rect-h, 3=rect-v
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[400]" aria-hidden>
      {pieces.map(p => {
        const shapeStyle: React.CSSProperties = p.shape === 0
          ? { borderRadius: '50%', width: p.size, height: p.size }
          : p.shape === 1
          ? { borderRadius: '2px', width: p.size, height: p.size }
          : p.shape === 2
          ? { borderRadius: '2px', width: `${parseInt(p.size) * 2}px`, height: `${parseInt(p.size) * 0.6}px` }
          : { borderRadius: '2px', width: `${parseInt(p.size) * 0.6}px`, height: `${parseInt(p.size) * 2}px` };

        return (
          <div
            key={p.id}
            className="absolute top-0 animate-confetti-fall"
            style={{
              left: p.left,
              backgroundColor: p.color,
              animationDelay: p.delay,
              animationDuration: p.dur,
              transform: `rotate(${p.rotate})`,
              ...shapeStyle,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
};

export default ConfettiBurst;
