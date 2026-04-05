import { useState, useCallback } from 'react';

/**
 * Fires a one-shot confetti burst.
 * Usage:
 *   const { firing, fire } = useConfetti();
 *   // call fire() to trigger; `firing` drives the <ConfettiBurst> component
 */
export function useConfetti(duration = 2500) {
  const [firing, setFiring] = useState(false);

  const fire = useCallback(() => {
    setFiring(true);
    setTimeout(() => setFiring(false), duration);
  }, [duration]);

  return { firing, fire };
}
