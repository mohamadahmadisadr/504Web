import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/firebaseService';
import { Trophy, Crown, Medal, User, TrendingUp } from 'lucide-react';
import { formatScore } from '../lib/utils';
import LoadingSpinner from '../components/LoadingSpinner';

const RankingPage = () => {
  const { userProfile, user } = useAuth();
  const [topUsers, setTopUsers] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRankingData();
  }, [userProfile]);

  const fetchRankingData = async () => {
    try {
      setLoading(true);
      const [users, rank] = await Promise.all([
        userService.getTopUsers(100),
        userProfile ? userService.getUserRank(user.uid, userProfile.totalScore) : Promise.resolve(null),
      ]);
      setTopUsers(users);
      setUserRank(rank);
    } catch (e) {
      console.error('Error fetching ranking:', e);
      setError('Failed to load rankings');
    } finally {
      setLoading(false);
    }
  };

  const rankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-500" />;
    return <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--tg-theme-hint-color)' }}>#{rank}</span>;
  };

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (error)   return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p style={{ color: 'var(--tg-theme-destructive-text-color, #e53935)' }}>{error}</p>
      <button onClick={fetchRankingData} className="btn btn-primary">Retry</button>
    </div>
  );

  return (
    <div className="tg-page">
      {/* ── My rank banner ── */}
      {userProfile && userRank && (
        <div className="px-4 pt-4 pb-2">
          <div
            className="tg-card p-4 flex items-center justify-between"
            style={{ borderLeft: '4px solid var(--tg-theme-button-color, #3390ec)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                style={{ background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)' }}
              >
                {userProfile.photoURL ? (
                  <img src={userProfile.photoURL} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5" style={{ color: 'var(--tg-theme-hint-color)' }} />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--tg-theme-text-color)' }}>
                  {userProfile.displayName || 'You'}
                </p>
                <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  {formatScore(userProfile.totalScore)} points
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--tg-theme-button-color)' }} />
              <span className="text-xl font-bold" style={{ color: 'var(--tg-theme-button-color)' }}>
                #{userRank}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Leaderboard list ── */}
      <div className="tg-label">Top Learners</div>
      <div className="px-4 pb-4">
        {topUsers.length === 0 ? (
          <div className="tg-card p-8 text-center">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--tg-theme-hint-color)' }} />
            <p className="text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>No rankings yet. Be the first!</p>
          </div>
        ) : (
          <div className="tg-card overflow-hidden">
            {topUsers.map((u, idx) => {
              const isMe = user && u.id === user.uid;
              const isLast = idx === topUsers.length - 1;

              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    borderBottom: isLast ? 'none' : '1px solid var(--tg-theme-secondary-bg-color, #f4f4f5)',
                    background: isMe
                      ? 'color-mix(in srgb, var(--tg-theme-button-color, #3390ec) 6%, transparent)'
                      : u.rank === 1
                      ? 'color-mix(in srgb, #f59e0b 8%, transparent)'
                      : 'transparent',
                  }}
                >
                  {/* Rank icon */}
                  <div className="w-6 flex items-center justify-center flex-shrink-0">
                    {rankIcon(u.rank)}
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={{ background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)' }}
                  >
                    {u.photoURL ? (
                      <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4" style={{ color: 'var(--tg-theme-hint-color)' }} />
                    )}
                  </div>

                  {/* Name + lessons */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--tg-theme-text-color)' }}>
                      {u.displayName || 'Anonymous'}
                      {isMe && <span style={{ color: 'var(--tg-theme-button-color)' }}> (You)</span>}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
                      {u.completedLessons?.length || 0} lessons
                    </p>
                  </div>

                  {/* Score */}
                  <span
                    className="text-sm font-bold flex-shrink-0"
                    style={{
                      color: u.rank <= 3
                        ? u.rank === 1 ? '#d97706' : u.rank === 2 ? '#6b7280' : '#92400e'
                        : isMe ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-text-color)',
                    }}
                  >
                    {formatScore(u.totalScore)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingPage;
