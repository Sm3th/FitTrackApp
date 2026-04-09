import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TAB_ORDER = ['/', '/explore', '/workout', '/nutrition', '/stats'];

export function useSwipeNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      // Only horizontal swipes (more horizontal than vertical, minimum 60px)
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

      const currentIdx = TAB_ORDER.findIndex(p =>
        p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)
      );
      if (currentIdx === -1) return;

      if (dx < 0 && currentIdx < TAB_ORDER.length - 1) {
        // Swipe left → next tab
        navigate(TAB_ORDER[currentIdx + 1]);
      } else if (dx > 0 && currentIdx > 0) {
        // Swipe right → prev tab
        navigate(TAB_ORDER[currentIdx - 1]);
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [navigate, location.pathname]);
}
