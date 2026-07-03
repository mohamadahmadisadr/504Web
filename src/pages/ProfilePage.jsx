import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Trophy, BookOpen, Target, Star, Award, ChevronRight, LogOut } from 'lucide-react';
import { formatScore, calculateProgress } from '../lib/utils';
import { toast } from 'react-hot-toast';

const ProfilePage = () => {
  const { user, userProfile, logout, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setDisplayName(userProfile?.displayName || '');
  }, [userProfile]);

  const handleSave = async () => {
    if (!displayName.trim()) { toast.error('Name cannot be empty'); return; }
    try {
      setIsUpdating(true);
      await updateUserProfile(displayName.trim());
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const completedLessons = userProfile?.completedLessons?.length || 0;
  const totalLessons     = 42;
  const progress         = calculateProgress(completedLessons, totalLessons);
  const score            = userProfile?.totalScore || 0;
  const currentLesson    = userProfile?.currentLesson || 1;

  const achievements = [
    { name: 'First Steps',       desc: 'Complete 1 lesson',    unlocked: completedLessons >= 1,  icon: BookOpen, color: '#3b82f6' },
    { name: 'Getting Started',   desc: 'Complete 5 lessons',   unlocked: completedLessons >= 5,  icon: Target,   color: '#22c55e' },
    { name: 'Dedicated Learner', desc: 'Complete 10 lessons',  unlocked: completedLessons >= 10, icon: Star,     color: '#a855f7' },
    { name: 'Halfway There',     desc: 'Complete 21 lessons',  unlocked: completedLessons >= 21, icon: Trophy,   color: '#f59e0b' },
    { name: 'Master Learner',    desc: 'Complete all 42',      unlocked: completedLessons >= 42, icon: Award,    color: '#ef4444' },
  ];

  return (
    <div className="tg-page">
      {/* ── Avatar + Name ── */}
      <div className="px-4 pt-4 pb-2">
        <div className="tg-card p-5 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{ background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)' }}
          >
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8" style={{ color: 'var(--tg-theme-hint-color)' }} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input text-sm"
                  placeholder="Your name"
                  disabled={isUpdating}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={isUpdating} className="btn btn-primary btn-sm flex-1">
                    {isUpdating ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => { setIsEditing(false); setDisplayName(userProfile?.displayName || ''); }} className="btn btn-secondary btn-sm flex-1">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold truncate" style={{ color: 'var(--tg-theme-text-color)' }}>
                    {userProfile?.displayName || 'User'}
                  </h1>
                  <button onClick={() => setIsEditing(true)} style={{ color: 'var(--tg-theme-button-color)' }}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                {userProfile?.telegramUsername && (
                  <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
                    @{userProfile.telegramUsername}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="px-4 pb-2">
        <div className="tg-card p-4 grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Score',   value: formatScore(score), color: '#f59e0b' },
            { label: 'Lessons', value: `${completedLessons}/${totalLessons}`, color: '#3390ec' },
            { label: 'Lesson',  value: `#${currentLesson}`, color: '#22c55e' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="text-lg font-bold" style={{ color }}>{value}</div>
              <div className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Overall progress ── */}
      <div className="px-4 pb-2">
        <div className="tg-card px-4 py-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-medium" style={{ color: 'var(--tg-theme-text-color)' }}>Overall Progress</span>
            <span className="text-xs font-bold" style={{ color: 'var(--tg-theme-button-color)' }}>{progress}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--tg-theme-secondary-bg-color)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'var(--tg-theme-button-color, #3390ec)' }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--tg-theme-hint-color)' }}>
            {totalLessons - completedLessons} lessons remaining
          </p>
        </div>
      </div>

      {/* ── Achievements ── */}
      <div className="tg-label">Achievements</div>
      <div className="px-4 pb-2">
        <div className="tg-card overflow-hidden">
          {achievements.map((a, idx) => {
            const Icon = a.icon;
            const isLast = idx === achievements.length - 1;
            return (
              <div
                key={a.name}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderBottom: isLast ? 'none' : '1px solid var(--tg-theme-secondary-bg-color)',
                  opacity: a.unlocked ? 1 : 0.4,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: a.unlocked ? `${a.color}22` : 'var(--tg-theme-secondary-bg-color)' }}
                >
                  <Icon className="w-4 h-4" style={{ color: a.unlocked ? a.color : 'var(--tg-theme-hint-color)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--tg-theme-text-color)' }}>{a.name}</p>
                  <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>{a.desc}</p>
                </div>
                {a.unlocked && (
                  <Star className="w-4 h-4 flex-shrink-0" style={{ color: a.color }} fill={a.color} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recent activity ── */}
      {userProfile?.completedLessons?.length > 0 && (
        <>
          <div className="tg-label">Recent Activity</div>
          <div className="px-4 pb-2">
            <div className="tg-card overflow-hidden">
              {userProfile.completedLessons.slice(-5).reverse().map((lessonNum, idx, arr) => (
                <div
                  key={lessonNum}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: idx === arr.length - 1 ? 'none' : '1px solid var(--tg-theme-secondary-bg-color)' }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#dcfce7' }}>
                    <BookOpen className="w-4 h-4" style={{ color: '#16a34a' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--tg-theme-text-color)' }}>
                      Completed Lesson {lessonNum}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>Recently</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Sign Out ── */}
      <div className="px-4 pb-6">
        <button
          onClick={logout}
          className="tg-card w-full py-3.5 flex items-center justify-center gap-2 text-sm font-medium"
          style={{ color: 'var(--tg-theme-destructive-text-color, #e53935)' }}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
