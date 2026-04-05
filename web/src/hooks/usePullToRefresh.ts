import { useState, useRef, useCallback, useEffect } from 'react';

interface Options {
  onRefresh: () => Promise<void>;
  threshold?: number;   // px to trigger refresh (default 70)
  resistance?: number;  // pull resistance factor (default 2.5)
}

/**
 * Pull-to-refresh for touch devices.
 * Returns `pullY` (current pull distance) and `refreshing` state.
 * Attach touch handlers to the scroll container.
 */
export function usePullToRefresh({ onRefresh, threshold = 70, resistance = 2.5 }: Options) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (startY.current === null || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy <= 0) return;
    if (window.scrollY > 0) return;
    pulling.current = true;
    const pull = Math.min(threshold * 1.5, dy / resistance);
    setPullY(pull);
  }, [resistance, threshold, refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullY >= threshold) {
      setRefreshing(true);
      setPullY(threshold * 0.6);
      try { await onRefresh(); } finally {
        setRefreshing(false);
        setPullY(0);
      }
    } else {
      setPullY(0);
    }
    startY.current = null;
  }, [pullY, threshold, onRefresh]);

  useEffect(() => {
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  return { pullY, refreshing };
}
