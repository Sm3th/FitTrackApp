import { useRef, useState, useCallback } from 'react';

interface SwipeDeleteOptions {
  threshold?: number;   // px to trigger delete (default 80)
  onDelete: () => void;
}

/**
 * Attach to a list item to get iOS-style swipe-left-to-delete.
 * Returns props to spread onto the row element and a `revealed` boolean
 * for showing the delete button beneath.
 */
export function useSwipeDelete({ threshold = 80, onDelete }: SwipeDeleteOptions) {
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const isDragging = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = false;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Only track horizontal swipes (ignore scroll)
    if (!isDragging.current && Math.abs(dy) > Math.abs(dx)) return;
    if (Math.abs(dx) > 8) isDragging.current = true;
    if (!isDragging.current) return;

    // Only allow leftward swipe (negative dx)
    const clamped = Math.max(-threshold * 1.6, Math.min(0, dx));
    setOffset(clamped);
    if (Math.abs(clamped) > threshold * 0.4) setRevealed(true);
    else setRevealed(false);
  }, [threshold]);

  const onTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    if (Math.abs(offset) >= threshold) {
      // Snap off-screen then delete
      setOffset(-300);
      setTimeout(() => { onDelete(); setOffset(0); setRevealed(false); }, 260);
    } else {
      // Snap back
      setOffset(0);
      setRevealed(false);
    }
    isDragging.current = false;
  }, [offset, threshold, onDelete]);

  const reset = useCallback(() => {
    setOffset(0);
    setRevealed(false);
  }, []);

  const rowStyle: React.CSSProperties = {
    transform: `translateX(${offset}px)`,
    transition: isDragging.current ? 'none' : 'transform 0.25s cubic-bezier(0.25,1,0.5,1)',
    touchAction: 'pan-y',
    userSelect: 'none',
  };

  return { rowStyle, revealed, reset, onTouchStart, onTouchMove, onTouchEnd };
}
