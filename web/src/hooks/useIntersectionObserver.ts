import { useState, useEffect, useRef, RefObject } from 'react';

/**
 * Returns true once the element enters the viewport.
 * After that, stays true — useful for "animate on scroll" effects
 * and lazy-rendering expensive sections.
 */
export function useIntersectionObserver<T extends Element>(
  options: IntersectionObserverInit = { threshold: 0.1, rootMargin: '50px' }
): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect(); // only trigger once
      }
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return [ref, isVisible];
}
