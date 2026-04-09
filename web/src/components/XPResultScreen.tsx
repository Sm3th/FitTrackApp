import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { XPGain, LevelInfo } from '../utils/xpSystem';

interface Props {
  xpGain: XPGain;
  prevLevelInfo: LevelInfo;
  newLevelInfo: LevelInfo;
  leveledUp: boolean;
  onClose: () => void;
}

const XPResultScreen: React.FC<Props> = ({ xpGain, newLevelInfo, leveledUp, onClose }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [barWidth, setBarWidth] = useState(newLevelInfo.progressPct);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [xpCounter, setXpCounter] = useState(0);
  const animFrame = useRef<number | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    const target = xpGain.total;
    const duration = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setXpCounter(Math.round(eased * target));
      if (progress < 1) animFrame.current = requestAnimationFrame(tick);
    };
    animFrame.current = requestAnimationFrame(tick);

    setTimeout(() => setShowBreakdown(true), 400);

    setTimeout(() => {
      if (leveledUp) {
        setBarWidth(100);
        setTimeout(() => {
          setShowLevelUp(true);
          setTimeout(() => setBarWidth(newLevelInfo.progressPct), 100);
        }, 600);
      } else {
        setBarWidth(newLevelInfo.progressPct);
      }
    }, 800);

    return () => { if (animFrame.current) cancelAnimationFrame(animFrame.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const breakdownRows = [
    { label: t('xp.baseXP'), value: xpGain.base, icon: '⚡' },
    { label: t('xp.durationBonus'), value: xpGain.durationBonus, icon: '⏱️' },
    { label: t('xp.setsBonus'), value: xpGain.setsBonus, icon: '🏋️' },
    { label: t('xp.ratingBonus'), value: xpGain.ratingBonus, icon: '⭐' },
  ].filter(r => r.value > 0);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      {showLevelUp && <LevelUpParticles />}

      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: '#0d0f1a',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 60px color-mix(in srgb, var(--p-500) 20%, transparent)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Top glow strip */}
        <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, var(--p-from), var(--p-to))' }} />

        <div className="p-7">
          {/* XP Earned header */}
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4"
              style={{
                background: 'color-mix(in srgb, var(--p-500) 15%, transparent)',
                border: '1px solid color-mix(in srgb, var(--p-500) 25%, transparent)',
                color: 'var(--p-text)',
              }}
            >
              ⚡ {t('xp.workoutComplete')}
            </div>

            <div
              className="text-7xl font-black leading-none mb-1"
              style={{ color: 'var(--p-text)', textShadow: '0 0 40px color-mix(in srgb, var(--p-500) 60%, transparent)' }}
            >
              +{xpCounter}
            </div>
            <div className="text-white/40 text-sm font-bold uppercase tracking-widest">{t('xp.xpEarned')}</div>
          </div>

          {/* XP Breakdown */}
          {showBreakdown && (
            <div
              className="rounded-2xl p-4 mb-5 space-y-2"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                animation: 'fadeSlideUp 0.4s ease forwards',
              }}
            >
              {breakdownRows.map((row, i) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between text-sm"
                  style={{ animation: `fadeSlideUp 0.3s ease ${i * 80}ms both` }}
                >
                  <span className="text-white/50 flex items-center gap-2">
                    <span>{row.icon}</span>
                    {row.label}
                  </span>
                  <span className="font-black text-white/80">+{row.value} XP</span>
                </div>
              ))}
              <div className="border-t border-white/10 pt-2 mt-1 flex items-center justify-between text-sm">
                <span className="font-black text-white/60">{t('xp.total')}</span>
                <span className="font-black" style={{ color: 'var(--p-text)' }}>+{xpGain.total} XP</span>
              </div>
            </div>
          )}

          {/* Level & Progress Bar */}
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white"
                  style={{ background: 'linear-gradient(135deg, var(--p-from), var(--p-to))' }}
                >
                  {newLevelInfo.level}
                </div>
                <div>
                  <div className="text-white font-black text-sm leading-none">{newLevelInfo.title}</div>
                  <div className="text-white/35 text-[10px] font-medium mt-0.5">
                    {t('xp.level', { n: newLevelInfo.level })}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/60 text-xs font-bold">
                  {newLevelInfo.currentXP - newLevelInfo.xpForCurrentLevel} / {newLevelInfo.xpForNextLevel - newLevelInfo.xpForCurrentLevel} XP
                </div>
                <div className="text-white/30 text-[10px]">{t('xp.toLevel', { n: newLevelInfo.level + 1 })}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{
                  width: `${barWidth}%`,
                  background: 'linear-gradient(90deg, var(--p-from), var(--p-to))',
                  boxShadow: '0 0 12px color-mix(in srgb, var(--p-500) 60%, transparent)',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                    animation: 'shimmer 1.5s ease infinite',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Level up banner */}
          {showLevelUp && (
            <div
              className="mt-4 rounded-2xl p-4 text-center"
              style={{
                background: 'linear-gradient(135deg, color-mix(in srgb, var(--p-500) 15%, transparent), color-mix(in srgb, var(--p-500) 5%, transparent))',
                border: '1px solid color-mix(in srgb, var(--p-500) 30%, transparent)',
                animation: 'bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              }}
            >
              <div className="text-3xl mb-1">🎊</div>
              <div className="font-black text-white text-base">{t('xp.levelUp')}</div>
              <div className="text-white/50 text-xs font-medium mt-0.5">
                {t('xp.levelUpDesc', { n: newLevelInfo.level })}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-5 py-3.5 rounded-2xl font-black text-white text-sm transition-all active:scale-95 hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, var(--p-from), var(--p-to))',
              boxShadow: '0 8px 24px color-mix(in srgb, var(--p-500) 35%, transparent)',
            }}
          >
            {t('xp.continue')}
          </button>
        </div>
      </div>
    </div>
  );
};

const LevelUpParticles: React.FC = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random(),
    color: ['var(--p-from)', 'var(--p-to)', '#f59e0b', '#22d3ee', '#a855f7'][Math.floor(Math.random() * 5)],
    size: 4 + Math.random() * 8,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[101]">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            background: p.color,
            animation: `particleFall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
};

export default XPResultScreen;
