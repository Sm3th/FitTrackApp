import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Direction-aware page transition:
 * - Forward navigation → slide in from right
 * - Back navigation    → slide in from left
 * - Two-phase: exit (fast) → enter (smooth)
 */

type Phase = 'idle' | 'exiting' | 'entering' | 'visible';

const PageTransition: React.FC<React.PropsWithChildren> = ({ children }) => {
  const location = useLocation();
  const [phase, setPhase] = useState<Phase>('visible');
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const prevIdxRef = useRef<number>(
    typeof window !== 'undefined' ? (window.history.state?.idx ?? 0) : 0
  );
  const prevPathRef = useRef(location.pathname);
  const childrenRef = useRef(children);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    if (location.pathname === prevPathRef.current) return;

    const currentIdx: number = window.history.state?.idx ?? 0;
    const isBack = currentIdx < prevIdxRef.current;
    setDirection(isBack ? 'back' : 'forward');
    prevIdxRef.current = currentIdx;
    prevPathRef.current = location.pathname;

    // Phase 1: exit current page
    setPhase('exiting');

    const exitTimer = setTimeout(() => {
      // Phase 2: swap children + start enter
      childrenRef.current = children;
      setDisplayChildren(children);
      setPhase('entering');

      const enterTimer = requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase('visible'));
      });
      return () => cancelAnimationFrame(enterTimer);
    }, 140); // exit duration

    return () => clearTimeout(exitTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Keep displayChildren in sync when not animating
  useEffect(() => {
    if (phase === 'visible') {
      setDisplayChildren(children);
      childrenRef.current = children;
    }
  }, [children, phase]);

  const getStyle = (): React.CSSProperties => {
    const xOffset = direction === 'forward' ? 18 : -18;

    switch (phase) {
      case 'exiting':
        return {
          opacity: 0,
          transform: `translateX(${-xOffset * 0.5}px) translateY(2px)`,
          filter: 'blur(1px)',
          transition: 'opacity 0.13s ease-in, transform 0.13s ease-in, filter 0.13s ease-in',
          willChange: 'opacity, transform, filter',
          pointerEvents: 'none',
        };
      case 'entering':
        return {
          opacity: 0,
          transform: `translateX(${xOffset}px) translateY(4px)`,
          filter: 'blur(2px)',
          willChange: 'opacity, transform, filter',
          pointerEvents: 'none',
        };
      case 'visible':
        return {
          opacity: 1,
          transform: 'translateX(0) translateY(0)',
          filter: 'blur(0px)',
          transition: 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1), filter 0.28s ease',
          willChange: 'opacity, transform, filter',
        };
      default:
        return { opacity: 1 };
    }
  };

  return (
    <div style={getStyle()}>
      {displayChildren}
    </div>
  );
};

export default PageTransition;
