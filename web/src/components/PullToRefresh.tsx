import React from 'react';

interface Props {
  pullY: number;
  refreshing: boolean;
  threshold?: number;
}

/**
 * Visual indicator that appears at the top when the user pulls down.
 * Place at the very top of the page content (below Navbar).
 */
const PullToRefresh: React.FC<Props> = ({ pullY, refreshing, threshold = 70 }) => {
  const visible = pullY > 4 || refreshing;
  const triggered = refreshing || pullY >= threshold;

  if (!visible) return null;

  return (
    <div
      className="flex items-center justify-center overflow-hidden"
      style={{
        height: refreshing ? 52 : Math.min(pullY * 0.8, 52),
        transition: refreshing || pullY === 0 ? 'height 0.3s ease' : 'none',
      }}>
      <div
        className="flex items-center gap-2 text-sm font-semibold"
        style={{ color: 'var(--p-text)' }}>
        {/* Spinner or arrow */}
        {triggered ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        ) : (
          <svg
            className="w-5 h-5 transition-transform duration-200"
            style={{ transform: `rotate(${Math.min(pullY / threshold, 1) * 180}deg)` }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/>
          </svg>
        )}
        <span>{triggered ? 'Refreshing…' : 'Pull to refresh'}</span>
      </div>
    </div>
  );
};

export default PullToRefresh;
