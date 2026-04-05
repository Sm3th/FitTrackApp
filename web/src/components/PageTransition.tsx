import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Wraps page content with a smooth fade+slide-up transition
 * that fires on every route change.
 */
const PageTransition: React.FC<React.PropsWithChildren> = ({ children }) => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    // Tiny delay so the exit animation plays before the new page mounts
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(t);
  }, [location.pathname]);

  return (
    <div
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.22s ease, transform 0.22s ease',
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
};

export default PageTransition;
