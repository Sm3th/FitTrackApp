import { useState, useEffect, useRef } from 'react';

type Direction = 'up' | 'down' | 'idle';

/**
 * Returns scroll direction and whether the page has scrolled past a threshold.
 * Navbar should hide on 'down', show on 'up'.
 */
export function useScrollDirection(threshold = 8) {
  const [direction, setDirection] = useState<Direction>('idle');
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 60);
        const delta = y - lastY.current;
        if (Math.abs(delta) > threshold) {
          setDirection(delta > 0 ? 'down' : 'up');
          lastY.current = y;
        }
        ticking.current = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return { direction, scrolled };
}
