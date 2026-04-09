import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import Navbar from '../components/Navbar';
import { ListSkeleton } from '../components/LoadingSkeleton';

interface FriendUser {
  userId: string;
  username: string;
  fullName: string | null;
  workouts: number;
  totalVolume: number;
  isFollowing: boolean;
}

interface ActivityItem {
  id: string;
  userId: string;
  username: string;
  fullName: string | null;
  type: 'workout';
  title: string;
  detail: string;
  timestamp: string;
}

interface Stats {
  following: number;
  followers: number;
}

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const FriendsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [tab, setTab] = useState<'discover' | 'following' | 'feed'>('discover');
  const [discoverUsers, setDiscoverUsers] = useState<FriendUser[]>([]);
  const [followingUsers, setFollowingUsers] = useState<FriendUser[]>([]);
  const [feed, setFeed] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<Stats>({ following: 0, followers: 0 });
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    fetchDiscover('');
    fetchStats();
  }, [navigate]);

  // Debounced search
  useEffect(() => {
    if (tab !== 'discover') return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchDiscover(search), 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search, tab]);

  // Fetch following/feed when tab switches
  useEffect(() => {
    if (tab === 'following') fetchFollowing();
    if (tab === 'feed') fetchFeed();
  }, [tab]);

  const fetchDiscover = useCallback(async (q: string) => {
    try {
      setLoadingDiscover(true);
      const res = await apiClient.get(`/friends/discover${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      setDiscoverUsers(res.data.data || []);
    } catch {
      setDiscoverUsers([]);
    } finally {
      setLoadingDiscover(false);
    }
  }, []);

  const fetchFollowing = useCallback(async () => {
    try {
      setLoadingFollowing(true);
      const res = await apiClient.get('/friends/following');
      setFollowingUsers(res.data.data || []);
    } catch {
      setFollowingUsers([]);
    } finally {
      setLoadingFollowing(false);
    }
  }, []);

  const fetchFeed = useCallback(async () => {
    try {
      setLoadingFeed(true);
      const res = await apiClient.get('/friends/feed');
      setFeed(res.data.data || []);
    } catch {
      setFeed([]);
    } finally {
      setLoadingFeed(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.get('/friends/stats');
      setStats(res.data.data || { following: 0, followers: 0 });
    } catch { /* ignore */ }
  }, []);

  const toggleFollow = useCallback(async (userId: string, currentlyFollowing: boolean) => {
    if (toggling.has(userId)) return;
    setToggling(prev => new Set(prev).add(userId));

    // Optimistic update
    const update = (list: FriendUser[]) =>
      list.map(u => u.userId === userId ? { ...u, isFollowing: !currentlyFollowing } : u);
    setDiscoverUsers(prev => update(prev));

    try {
      if (currentlyFollowing) {
        await apiClient.delete(`/friends/unfollow/${userId}`);
        setFollowingUsers(prev => prev.filter(u => u.userId !== userId));
        setStats(prev => ({ ...prev, following: Math.max(0, prev.following - 1) }));
      } else {
        await apiClient.post(`/friends/follow/${userId}`);
        setStats(prev => ({ ...prev, following: prev.following + 1 }));
      }
    } catch {
      // Revert on error
      setDiscoverUsers(prev => update(prev));
    } finally {
      setToggling(prev => { const s = new Set(prev); s.delete(userId); return s; });
    }
  }, [toggling]);

  const UserCard: React.FC<{ user: FriendUser }> = ({ user }) => {
    const busy = toggling.has(user.userId);
    return (
      <div className="flex items-center gap-4 surface-elevated rounded-2xl px-5 py-4">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
          {(user.fullName || user.username).charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
            {user.fullName || user.username}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">@{user.username}</p>
          <div className="flex gap-3 mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-bold text-gray-700 dark:text-gray-300">{user.workouts}</span> {t('friends.workouts')}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-bold text-gray-700 dark:text-gray-300">{(user.totalVolume / 1000).toFixed(1)}t</span> {t('friends.lifted')}
            </span>
          </div>
        </div>

        <button
          disabled={busy}
          onClick={() => toggleFollow(user.userId, user.isFollowing)}
          className={`flex-shrink-0 text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-60 ${
            user.isFollowing
              ? 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500'
              : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/20 hover:opacity-90'
          }`}
        >
          {busy ? '…' : user.isFollowing ? t('friends.followingBtn') : t('friends.follow')}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      {/* Hero */}
      <div className="relative bg-slate-950 overflow-hidden py-8 sm:py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-blue-400 text-sm font-bold uppercase tracking-widest mb-1">{t('friends.community')}</p>
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">{t('friends.title')}</h1>
          <p className="text-white/40 text-sm">{t('friends.subtitle')}</p>

          <div className="flex items-center gap-4 mt-4">
            <div className="text-white/60 text-sm">
              <span className="font-black text-white">{stats.following}</span> {t('friends.following')}
            </div>
            <span className="text-white/20">·</span>
            <div className="text-white/60 text-sm">
              <span className="font-black text-white">{stats.followers}</span> {t('friends.followers')}
            </div>
            <span className="text-white/20">·</span>
            <div className="text-white/60 text-sm">
              <span className="font-black text-white">{discoverUsers.length}</span> {t('friends.athletes')}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-1">
          {([
            { key: 'discover',  label: t('friends.discover'),     count: discoverUsers.length },
            { key: 'following', label: t('friends.followingTab'), count: stats.following },
            { key: 'feed',      label: t('friends.activity'),     count: feed.length },
          ] as const).map(({ key, label, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === key
                  ? 'bg-gray-900 dark:bg-slate-700 text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}>
              {label}
              {count > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  tab === key ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'
                }`}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Discover */}
        {tab === 'discover' && (
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('friends.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>

            {loadingDiscover ? (
              <ListSkeleton />
            ) : discoverUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">👤</div>
                <p className="font-bold text-gray-600 dark:text-gray-400">
                  {search ? t('friends.noAthletesFound') : t('friends.noAthletesYet')}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {search ? t('friends.tryDifferentSearch') : t('friends.inviteFriends')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {discoverUsers.map(user => <UserCard key={user.userId} user={user} />)}
              </div>
            )}
          </div>
        )}

        {/* Following */}
        {tab === 'following' && (
          <div className="space-y-3">
            {loadingFollowing ? (
              <ListSkeleton />
            ) : followingUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-3">👋</div>
                <p className="font-bold text-gray-600 dark:text-gray-400 text-lg">{t('friends.notFollowingAnyone')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-5">{t('friends.notFollowingDesc')}</p>
                <button onClick={() => setTab('discover')} className="btn-primary px-8 py-3">
                  {t('friends.discoverAthletes')}
                </button>
              </div>
            ) : (
              followingUsers.map(user => <UserCard key={user.userId} user={user} />)
            )}
          </div>
        )}

        {/* Activity Feed */}
        {tab === 'feed' && (
          <div className="space-y-3">
            {loadingFeed ? (
              <ListSkeleton />
            ) : feed.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-3">📰</div>
                <p className="font-bold text-gray-600 dark:text-gray-400 text-lg">{t('friends.feedEmpty')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-5">{t('friends.feedEmptyDesc')}</p>
                <button onClick={() => setTab('discover')} className="btn-primary px-8 py-3">
                  {t('friends.findAthletes')}
                </button>
              </div>
            ) : (
              feed.map(item => (
                <div key={item.id}
                  className="surface-elevated rounded-2xl px-5 py-4 flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-base flex-shrink-0">
                    {(item.fullName || item.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                        {item.fullName || item.username}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 text-xs">@{item.username}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-base">🏋️</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.title}</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.detail}</p>
                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">{timeAgo(item.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
