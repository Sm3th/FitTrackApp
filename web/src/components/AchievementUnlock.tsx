import React, { useEffect } from 'react';
import { Achievement } from '../utils/achievements';
import { soundEffects } from '../utils/soundEffects';

interface AchievementUnlockProps {
  achievement: Achievement;
  onClose: () => void;
}

const AchievementUnlock: React.FC<AchievementUnlockProps> = ({ achievement, onClose }) => {
  useEffect(() => {
    // Play achievement sound
    soundEffects.achievement();
    
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-bounce-in">
      <div className={`bg-gradient-to-r ${achievement.color} text-white px-8 py-6 rounded-2xl shadow-2xl border-4 border-white max-w-md`}>
        <div className="text-center">
          <div className="text-6xl mb-3 animate-bounce">{achievement.icon}</div>
          <div className="text-sm font-semibold text-white/90 mb-1 uppercase tracking-wider">
            🏆 Achievement Unlocked!
          </div>
          <h3 className="text-2xl font-bold mb-2">{achievement.name}</h3>
          <p className="text-white/90">{achievement.description}</p>
        </div>
      </div>
    </div>
  );
};

export default AchievementUnlock;