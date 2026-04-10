import React, { useEffect, useState, useRef } from 'react';

const OfflineBanner: React.FC = () => {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [showOnline, setShowOnline] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const goOffline = () => {
      if (timer.current) clearTimeout(timer.current);
      setShowOnline(false);
      setOffline(true);
    };
    const goOnline = () => {
      setOffline(false);
      setShowOnline(true);
      timer.current = setTimeout(() => setShowOnline(false), 3000);
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!offline && !showOnline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 text-white text-xs font-bold py-2 px-4 shadow-lg transition-all"
      style={{ background: offline ? '#f59e0b' : '#10b981' }}
    >
      {offline ? (
        <>
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"/>
          </svg>
          You're offline — changes will sync when reconnected
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
          </svg>
          Back online — syncing queued changes…
        </>
      )}
    </div>
  );
};

export default OfflineBanner;
