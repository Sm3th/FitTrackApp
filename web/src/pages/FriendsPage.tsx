import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import Navbar from '../components/Navbar';

interface FriendUser {
  userId: string;
  username: string;
  fullName: string | null;
  workouts: number;
  totalVolume: number;
  rank: number;
}

interface ActivityItem {
  id: string;
  userId: string;
  username: string;
  fullName: string | null;
  type: 'workout' | 'achievement' | 'goal';
  title: string;
  detail: string;
  timestamp: string;
}

const FOLLOWING_KEY = 'fittrack_following';

const loadFollowing = (): string[] => {
  try { return JSON.parse(localStorage.getItem(FOLLOWING_KEY) || '[]'); }
  catch { return []; }
};

const saveFollowing = (ids: string[]) =>
  localStorage.setItem(FOLLOWING_KEY, JSON.stringify(ids));

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// Generate mock activity for a user based on their stats
const mockActivity = (user: FriendUser): ActivityItem[] => {
  const items: ActivityItem[] = [];
  const now = Date.now();
  if (user.workouts > 0) {
    items.push({
      id: `${user.userId}_w`,
      userId: user.userId,
      username: user.username,
      fullName: user.fullName,
      type: 'workout',
      title: 'Completed a workout',
      detail: `${user.workouts} total workouts • ${(user.totalVolume / 1000).toFixed(1)}t lifted`,
      timestamp: new Date(now - Math.random() * 86400000 * 3).toISOString(),
    });
  }
  if (user.workouts >= 10) {
    items.push({
      id: `${user.userId}_a`,
      userId: user.userId,
      username: user.username,
      fullName: user.fullName,
      type: 'achievement',
      title: 'Unlocked "Dedicated" achievement',
      detail: '10 workouts completed',
      timestamp: new Date(now - Math.random() * 86400000 * 7).toISOString(),
    });
  }
  return items;
};

const ACTIVITY_ICONS: Record<ActivityItem['type'], string> = {
  workout: '🏋️',
  achievement: '🏆',
  goal: '🎯',
};

const FriendsPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [tab, setTab] = useState<'discover' | 'following' | 'feed'>('discover');
  const [users, setUsers] = useState<FriendUser[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    setFollowing(loadFollowing());
    fetchUsers();
  }, [navigate]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/leaderboard?type=workouts&limit=50');
      const data: FriendUser[] = (res.data.data || []).filter(
        (u: FriendUser) => u.userId !== currentUser.userId && u.userId !== currentUser.id
      );
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser.userId, currentUser.id]);

  const toggleFollow = (userId: string) => {
    setFollowing(prev => {
      const next = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      saveFollowing(next);
      return next;
    });
  };

  const filtered = users.filter(u =>
    search.trim() === '' ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.fullName || '').toLowerCase().includes(search.toLowerCase())
  );

  const followingUsers = users.filter(u => following.includes(u.userId));

  const activityFeed: ActivityItem[] = followingUsers
    .flatMap(mockActivity)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const UserCard: React.FC<{ user: FriendUser }> = ({ user }) => {
    const isFollowing = following.includes(user.userId);
    return (
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl px-5 py-4 shadow-sm">
        {/* Avatar */}
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
              <span className="font-bold text-gray-700 dark:text-gray-300">{user.workouts}</span> workouts
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-bold text-gray-700 dark:text-gray-300">{(user.totalVolume / 1000).toFixed(1)}t</span> lifted
            </span>
          </div>
        </div>

        <button
          onClick={() => toggleFollow(user.userId)}
          className={`flex-shrink-0 text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95 ${
            isFollowing
              ? 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500'
              : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/20 hover:opacity-90'
          }`}>
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      {/* Hero */}
      <div className="relative bg-slate-950 overflow-hidden py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-blue-400 text-sm font-bold uppercase tracking-widest mb-1">Community</p>
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">Friends</h1>
          <p className="text-white/40 text-sm">Follow athletes and stay motivated together</p>

          <div className="flex items-center gap-2 mt-4">
            <div className="text-white/60 text-sm">
              <span className="font-black text-white">{following.length}</span> following
            </div>
            <span className="text-white/20">·</span>
            <div className="text-white/60 text-sm">
              <span className="font-black text-white">{users.length}</span> athletes
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-1">
          {([
            { key: 'discover', label: '🔍 Discover', count: users.length },
            { key: 'following', label: '❤️ Following', count: following.length },
            { key: 'feed', label: '📰 Activity', count: activityFeed.length },
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
                placeholder="Search athletes by name or username…"
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl px-5 py-4 flex items-center gap-4 animate-pulse">
                    <div className="w-11 h-11 bg-gray-200 dark:bg-slate-800 rounded-2xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-1/4" />
                    </div>
                    <div className="w-20 h-8 bg-gray-200 dark:bg-slate-800 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">👤</div>
                <p className="font-bold text-gray-600 dark:text-gray-400">
                  {search ? 'No athletes found' : 'No other athletes yet'}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {search ? 'Try a different search term' : 'Invite your friends to join FitTrack!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(user => <UserCard key={user.userId} user={user} />)}
              </div>
            )}
          </div>
        )}

        {/* Following */}
        {tab === 'following' && (
          <div className="space-y-3">
            {followingUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-3">👋</div>
                <p className="font-bold text-gray-600 dark:text-gray-400 text-lg">Not following anyone yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-5">
                  Discover athletes and follow them to see their activity
                </p>
                <button onClick={() => setTab('discover')}
                  className="btn-primary px-8 py-3">
                  Discover Athletes
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
            {activityFeed.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-3">📰</div>
                <p className="font-bold text-gray-600 dark:text-gray-400 text-lg">Your feed is empty</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-5">
                  Follow athletes to see their workouts and achievements here
                </p>
                <button onClick={() => setTab('discover')}
                  className="btn-primary px-8 py-3">
                  Find Athletes
                </button>
              </div>
            ) : (
              activityFeed.map(item => (
                <div key={item.id}
                  className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl px-5 py-4 shadow-sm flex gap-4">
                  {/* Avatar */}
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
                      <span className="text-base">{ACTIVITY_ICONS[item.type]}</span>
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
