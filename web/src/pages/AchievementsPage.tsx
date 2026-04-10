import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Navbar from '../components/Navbar';
import { PageSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ConfettiBurst from '../components/ConfettiBurst';
import { calculateAchievements, getRecentlyUnlocked, getNextAchievement, Achievement } from '../utils/achievements';
import { calculateStreak, getTotalVolume } from '../utils/statsHelper';
import { useTranslation } from 'react-i18next';

const AchievementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [confetti, setConfetti] = useState(false);
  const confettiFired = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchAchievements();
  }, [navigate]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/workouts/sessions');
      const workouts = response.data.data || [];
      const totalWorkouts = workouts.length;
      const totalSets = workouts.reduce((sum: number, w: any) => sum + (w.exerciseSets?.length || 0), 0);
      const totalVolume = getTotalVolume(workouts);
      const streak = calculateStreak(workouts);
      const calculated = calculateAchievements({ totalWorkouts, totalSets, totalVolume, streak });
      setAchievements(calculated);
      // Fire confetti once per session if any achievements are unlocked
      if (!confettiFired.current && calculated.some(a => a.unlocked)) {
        confettiFired.current = true;
        setTimeout(() => {
          setConfetti(true);
          setTimeout(() => setConfetti(false), 2800);
        }, 400);
      }
    } catch (error) {
      console.error('Fetch achievements error:', error);
    } finally {
      setLoading(false);
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const completionPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
  const recentlyUnlocked = getRecentlyUnlocked(achievements);
  const nextAchievement = getNextAchievement(achievements);

  const groupedAchievements = {
    workouts: achievements.filter(a => a.category === 'workouts'),
    sets: achievements.filter(a => a.category === 'sets'),
    volume: achievements.filter(a => a.category === 'volume'),
    streak: achievements.filter(a => a.category === 'streak'),
  };

  const groupMeta: Record<string, { label: string; icon: string }> = {
    workouts: { label: t('achievements.workouts'), icon: '🏋️' },
    sets: { label: t('achievements.sets'), icon: '📝' },
    volume: { label: t('achievements.volume'), icon: '💪' },
    streak: { label: t('achievements.streak'), icon: '🔥' },
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-48 mb-6 animate-pulse" />
          <PageSkeleton cards={9} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ConfettiBurst active={confetti} count={90} />
      <Navbar />

      {/* Hero */}
      <div className="relative bg-slate-950 overflow-hidden py-10 sm:py-14">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-orange-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-amber-400 text-sm font-semibold uppercase tracking-wide mb-2">Milestones</p>
          <h1 className="text-4xl font-black text-white tracking-tight mb-3">{t('achievements.title')}</h1>
          <div className="text-white/40 text-sm mb-6">{t('achievements.subtitle')}</div>

          {/* Progress badge */}
          <div className="inline-flex items-center gap-4 bg-white/10 border border-white/15 backdrop-blur-sm rounded-2xl px-6 py-3 animate-fade-up delay-200">
            <span className="text-4xl animate-float">🏆</span>
            <div className="text-left">
              <div className="text-2xl font-black text-white tabular-nums">{unlockedCount} <span className="text-white/40 font-normal text-lg">/ {totalCount}</span></div>
              <div className="text-xs text-white/50">{completionPct}% {t('achievements.complete')}</div>
            </div>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                style={{
                  width: `${completionPct}%`,
                  transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1) 0.5s',
                }} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5 sm:py-8 sm:px-6 lg:px-8 space-y-8">

        {achievements.filter(a => a.unlocked).length === 0 && (
          <EmptyState
            icon="🏆"
            title={t('achievements.noAchievementsTitle')}
            description={t('achievements.noAchievementsFullDesc')}
            actionLabel={t('achievements.startTraining')}
            actionPath="/workout-plans"
            variant="gradient"
          />
        )}

        {/* Recently Unlocked */}
        {recentlyUnlocked.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🎉</span> {t('achievements.recentlyUnlocked')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentlyUnlocked.map(achievement => (
                <div key={achievement.id}
                  className={`bg-gradient-to-br ${achievement.color} rounded-2xl p-6 text-white shadow-md active:scale-[0.98] transition-transform`}>
                  <div className="text-5xl mb-3">{achievement.icon}</div>
                  <h3 className="text-lg font-black mb-1">{achievement.name}</h3>
                  <p className="text-sm text-white/80">{achievement.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Goal */}
        {nextAchievement && (
          <div className="list-card p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🎯</span> {t('achievements.nextGoal')}
            </h2>
            <div className="flex items-center gap-6">
              <div className="text-6xl flex-shrink-0">{nextAchievement.icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">{nextAchievement.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{nextAchievement.description}</p>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span>{nextAchievement.progress} / {nextAchievement.requirement}</span>
                  <span>{Math.round((nextAchievement.progress / nextAchievement.requirement) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                    style={{ width: `${Math.min((nextAchievement.progress / nextAchievement.requirement) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Achievements by Category */}
        {Object.entries(groupedAchievements).map(([category, list], catIdx) => (
          <div key={category}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {groupMeta[category]?.icon} {groupMeta[category]?.label}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map((achievement, idx) => (
                <div key={achievement.id}
                  className={`rounded-2xl p-6 border transition-all duration-300 animate-fade-up ${
                    achievement.unlocked
                      ? `bg-gradient-to-br ${achievement.color} text-white shadow-md border-transparent active:scale-[0.98]`
                      : 'list-card border-transparent text-gray-400 dark:text-gray-500'
                  }`}
                  style={{ animationDelay: `${(catIdx * 3 + idx) * 60}ms`, animationFillMode: 'both' }}>
                  <div className={`text-5xl mb-3 ${achievement.unlocked ? 'opacity-100' : 'opacity-30'}`}>
                    {achievement.icon}
                  </div>
                  <h3 className={`text-base font-bold mb-1 ${achievement.unlocked ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {achievement.name}
                  </h3>
                  <p className={`text-sm mb-3 ${achievement.unlocked ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'}`}>
                    {achievement.description}
                  </p>
                  {!achievement.unlocked && (
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span>{achievement.progress} / {achievement.requirement}</span>
                        <span>{Math.round((achievement.progress / achievement.requirement) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-300 dark:bg-slate-600 rounded-full transition-all"
                          style={{ width: `${Math.min((achievement.progress / achievement.requirement) * 100, 100)}%` }} />
                      </div>
                    </div>
                  )}
                  {achievement.unlocked && (
                    <div className="text-xs font-bold text-white/80 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      {t('achievements.unlocked')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="text-center pb-4">
          <button onClick={() => navigate('/workout-plans')} className="btn-primary text-base px-10 py-4">
            {t('achievements.keepWorking')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;
