// Simple sound effects using Web Audio API

class SoundEffects {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize on user interaction to avoid autoplay restrictions
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Load sound enabled preference
    this.enabled = localStorage.getItem('soundEnabled') !== 'false';
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('soundEnabled', String(enabled));
  }

  isEnabled() {
    return this.enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.audioContext || !this.enabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Success sound (set logged)
  success() {
    this.playTone(800, 0.1);
    setTimeout(() => this.playTone(1000, 0.15), 100);
  }

  // Achievement unlocked
  achievement() {
    this.playTone(523, 0.15); // C
    setTimeout(() => this.playTone(659, 0.15), 150); // E
    setTimeout(() => this.playTone(784, 0.15), 300); // G
    setTimeout(() => this.playTone(1047, 0.3), 450); // C (octave)
  }

  // Workout complete
  workoutComplete() {
    this.playTone(440, 0.2); // A
    setTimeout(() => this.playTone(554, 0.2), 200); // C#
    setTimeout(() => this.playTone(659, 0.2), 400); // E
    setTimeout(() => this.playTone(880, 0.4), 600); // A (octave)
  }

  // Error sound
  error() {
    this.playTone(200, 0.2, 'sawtooth');
    setTimeout(() => this.playTone(150, 0.3, 'sawtooth'), 150);
  }

  // Timer beep
  timerBeep() {
    this.playTone(1000, 0.1);
  }

  // Rest complete
  restComplete() {
    this.playTone(600, 0.15);
    setTimeout(() => this.playTone(800, 0.15), 150);
    setTimeout(() => this.playTone(600, 0.15), 300);
  }

  // Exercise complete
  exerciseComplete() {
    this.playTone(784, 0.15); // G5
    setTimeout(() => this.playTone(988, 0.15), 100); // B5
  }
}

export const soundEffects = new SoundEffects();