// Haptic feedback utility — uses Vibration API where available (Android Chrome, PWA)
// Silently no-ops on iOS / unsupported browsers

const canVibrate = (): boolean =>
  typeof navigator !== 'undefined' && 'vibrate' in navigator;

export const haptics = {
  /** Short tap — button press */
  tap: () => canVibrate() && navigator.vibrate(8),

  /** Success — set logged, goal hit */
  success: () => canVibrate() && navigator.vibrate([10, 30, 20]),

  /** Achievement unlocked */
  achievement: () => canVibrate() && navigator.vibrate([20, 50, 20, 50, 60]),

  /** Workout complete */
  workoutComplete: () => canVibrate() && navigator.vibrate([30, 40, 30, 40, 80]),

  /** Warning — validation error */
  warning: () => canVibrate() && navigator.vibrate(40),

  /** Heavy — delete action */
  heavy: () => canVibrate() && navigator.vibrate(50),
};
