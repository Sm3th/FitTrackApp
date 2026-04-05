import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';
import { useTranslation } from 'react-i18next';

interface LeaderboardUser {
  userId: string;
  username: string;
  fullName: string | null;
  workouts: number;
  totalVolume: number;
  totalDuration: number;
  rank: number;
  isCurrentUser?: boolean;
}

type LeaderboardType = 'workouts' | 'volume' | 'duration';

const LeaderboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [activeTab, setActiveTab] = useState<LeaderboardType>('workouts');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    apiClient.get('/users/leaderboard')
      .then(res => {
        const data: LeaderboardUser[] = (res.data.data || []).map((u: LeaderboardUser) => ({
          ...u,
          isCurrentUser: u.username === currentUser.username,
        }));
        setLeaderboard(data);
      })
      .catch(err => console.error('Leaderboard error:', err))
      .finally(() => setLoading(false));
  }, [navigate, currentUser.username]);

  const getSortedLeaderboard = (): LeaderboardUser[] => {
    const sorted = [...leaderboard].sort((a, b) => {
      if (activeTab === 'volume')   return b.totalVolume   - a.totalVolume;
      if (activeTab === 'duration') return b.totalDuration - a.totalDuration;
      return b.workouts - a.workouts;
    });
    return sorted.map((u, i) => ({ ...u, rank: i + 1 }));
  };

  const sortedLeaderboard = getSortedLeaderboard();
  const currentUserEntry = sortedLeaderboard.find(u => u.isCurrentUser);

  const getMedalEmoji = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const getStatValue = (user: LeaderboardUser): string => {
    if (activeTab === 'volume')   return `${Math.round(user.totalVolume).toLocaleString()} kg`;
    if (activeTab === 'duration') return `${user.totalDuration} min`;
    return t('leaderboard.workoutsStat', { n: user.workouts });
  };

  const currentUserWorkouts = currentUserEntry?.workouts ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      {/* Header */}
      <div className="relative bg-slate-950 overflow-hidden py-14">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-red-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-amber-400 text-sm font-semibold uppercase tracking-widest mb-2">{t('leaderboard.competition')}</p>
          <h1 className="text-5xl font-black text-white tracking-tight mb-3">{t('leaderboard.title')}</h1>
          <p className="text-white/40">{t('leaderboard.subtitle')}</p>
        </div>
      </div>

      {currentUserWorkouts === 0 ? (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <EmptyState
            icon="🏅"
            title={t('leaderboard.noWorkoutsTitle')}
            description={t('leaderboard.noWorkoutsDesc')}
            actionLabel="🔥 Start Training"
            actionPath="/workout-plans"
            variant="gradient"
          />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 space-y-6">

          {/* Tabs */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-1.5 flex gap-1.5">
            {([
              { key: 'workouts',  icon: '💪', grad: 'from-blue-500 to-indigo-500' },
              { key: 'volume',    icon: '🏋️', grad: 'from-violet-500 to-purple-500' },
              { key: 'duration',  icon: '⏱️', grad: 'from-orange-500 to-red-500' },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === tab.key
                    ? `bg-gradient-to-r ${tab.grad} text-white shadow-lg`
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}>
                <span>{tab.icon}</span>
                <span>{t(`leaderboard.${tab.key}`)}</span>
              </button>
            ))}
          </div>

          {/* Your Rank card */}
          {currentUserEntry && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 shadow-xl shadow-blue-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-2xl">
                    {currentUserEntry.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white/60 text-xs font-semibold uppercase tracking-wide">{t('leaderboard.yourRanking')}</div>
                    <div className="text-white font-black text-2xl">#{currentUserEntry.rank}</div>
                    <div className="text-white/70 text-sm font-medium">{currentUserEntry.username}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">
                    {t(`leaderboard.${activeTab}`)}
                  </div>
                  <div className="text-white font-black text-2xl">{getStatValue(currentUserEntry)}</div>
                  <div className="text-white/50 text-xs mt-0.5">
                    {getMedalEmoji(currentUserEntry.rank) || `Top ${Math.round((currentUserEntry.rank / sortedLeaderboard.length) * 100)}%`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Podium — top 3 */}
          {!loading && sortedLeaderboard.length >= 3 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 dark:text-white mb-6 text-center">{t('leaderboard.podium')}</h2>
              <div className="flex items-end justify-center gap-3">
                {/* 2nd */}
                {[sortedLeaderboard[1], sortedLeaderboard[0], sortedLeaderboard[2]].map((user, pos) => {
                  const actualRank = pos === 0 ? 2 : pos === 1 ? 1 : 3;
                  const heights = ['h-24', 'h-32', 'h-20'];
                  const colors = [
                    'bg-gradient-to-b from-slate-300 to-slate-400',
                    'bg-gradient-to-b from-amber-400 to-yellow-500',
                    'bg-gradient-to-b from-orange-300 to-amber-400',
                  ];
                  const textColors = ['text-slate-600', 'text-amber-600', 'text-orange-600'];
                  const emojis = ['🥈', '🥇', '🥉'];
                  return (
                    <div key={user.userId} className="flex flex-col items-center gap-2 flex-1">
                      <div className="text-2xl">{emojis[pos]}</div>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg ${
                        user.isCurrentUser ? 'ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-slate-900' : ''
                      } bg-gradient-to-br from-blue-500 to-indigo-600`}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className={`text-xs font-bold truncate max-w-full ${user.isCurrentUser ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {user.isCurrentUser ? t('leaderboard.you') : user.username}
                      </div>
                      <div className={`text-xs font-semibold ${textColors[pos]}`}>{getStatValue(user)}</div>
                      <div className={`w-full ${heights[pos]} ${colors[pos]} rounded-t-xl flex items-center justify-center`}>
                        <span className="text-white font-black text-xl">#{actualRank}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full list */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="font-bold text-gray-900 dark:text-white">{t('leaderboard.fullRankings')}</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-slate-800/60">
                {sortedLeaderboard.map(user => (
                  <div key={user.userId}
                    className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                      user.isCurrentUser
                        ? 'bg-blue-50/60 dark:bg-blue-900/10'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'
                    }`}>
                    {/* Rank */}
                    <div className="w-8 text-center flex-shrink-0">
                      {user.rank <= 3
                        ? <span className="text-xl">{getMedalEmoji(user.rank)}</span>
                        : <span className="text-sm font-bold text-gray-400 dark:text-gray-500">#{user.rank}</span>}
                    </div>
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                      user.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-yellow-500' :
                      user.rank === 2 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                      user.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-amber-500' :
                      'bg-gradient-to-br from-blue-500 to-indigo-600'
                    }`}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm truncate ${user.isCurrentUser ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                        {user.username}
                        {user.isCurrentUser && <span className="ml-2 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">YOU</span>}
                      </div>
                    </div>
                    {/* Stat */}
                    <div className="text-sm font-bold text-gray-700 dark:text-gray-300 flex-shrink-0">
                      {getStatValue(user)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Demo note */}
          <div className="bg-slate-900/5 dark:bg-white/5 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 flex gap-3 items-start">
            <span className="text-lg">💡</span>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('leaderboard.demoNote')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;