import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { lessonsService } from '../services/firebaseService';
import { CheckCircle, Circle, Star, Play, Clock, Target, Lock } from 'lucide-react';
import { calculateProgress } from '../lib/utils';
import LoadingSpinner from '../components/LoadingSpinner';

const LessonsPage = () => {
  const { userProfile } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);
        const data = await lessonsService.getAllLessons();
        setLessons(data);
      } catch (e) {
        console.error('Error fetching lessons:', e);
        setError('Failed to load lessons');
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, []);

  const isCompleted = (n) => userProfile?.completedLessons?.includes(n) || false;
  const isUnlocked  = (n) => n <= 1 || (userProfile?.currentLesson || 1) >= n;
  const isCurrent   = (n) => (userProfile?.currentLesson || 1) === n;

  const completedCount    = userProfile?.completedLessons?.length || 0;
  const progress          = calculateProgress(completedCount, lessons.length);

  if (loading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (error)   return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p style={{ color: 'var(--tg-theme-destructive-text-color, #e53935)' }}>{error}</p>
      <button onClick={() => window.location.reload()} className="btn btn-primary">Retry</button>
    </div>
  );

  return (
    <div className="tg-page">
      {/* ── Progress header card ── */}
      <div className="px-4 pt-4 pb-2">
        <div className="tg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: 'var(--tg-theme-button-color, #3390ec)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--tg-theme-text-color, #212121)' }}>
                Your Progress
              </span>
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--tg-theme-button-color, #3390ec)' }}>
              {progress}%
            </span>
          </div>
          {/* progress bar */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'var(--tg-theme-button-color, #3390ec)' }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--tg-theme-hint-color, #707579)' }}>
            {completedCount} of {lessons.length} lessons completed
          </p>
        </div>
      </div>

      {/* ── Lessons list ── */}
      <div className="tg-label">Lessons</div>
      <div className="px-4 pb-4">
        <div className="tg-card overflow-hidden">
          {lessons.map((lesson, idx) => {
            const done      = isCompleted(lesson.number);
            const unlocked  = isUnlocked(lesson.number);
            const current   = isCurrent(lesson.number);
            const isLast    = idx === lessons.length - 1;

            return (
              <div
                key={lesson.id}
                style={{
                  borderBottom: isLast ? 'none' : '1px solid var(--tg-theme-secondary-bg-color, #f4f4f5)',
                }}
              >
                {unlocked ? (
                  <Link
                    to={`/lessons/${lesson.number}`}
                    className="flex items-center gap-3 px-4 py-3 transition-all active:opacity-70"
                    style={{
                      background: current && !done
                        ? 'color-mix(in srgb, var(--tg-theme-button-color, #3390ec) 6%, transparent)'
                        : 'transparent',
                    }}
                  >
                    {/* Lesson number badge */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={
                        done
                          ? { background: '#dcfce7', color: '#16a34a' }
                          : current
                          ? { background: 'color-mix(in srgb, var(--tg-theme-button-color, #3390ec) 15%, transparent)', color: 'var(--tg-theme-button-color, #3390ec)' }
                          : { background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)', color: 'var(--tg-theme-hint-color, #707579)' }
                      }
                    >
                      {done ? <CheckCircle className="w-5 h-5" style={{ color: '#16a34a' }} /> : lesson.number}
                    </div>

                    {/* Lesson info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--tg-theme-text-color, #212121)' }}
                      >
                        {lesson.name}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs" style={{ color: 'var(--tg-theme-hint-color, #707579)' }}>
                          {lesson.wordCount} words
                        </span>
                        {current && !done && (
                          <span
                            className="text-xs font-semibold"
                            style={{ color: 'var(--tg-theme-button-color, #3390ec)' }}
                          >
                            Current
                          </span>
                        )}
                        {done && (
                          <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>
                            Completed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action label */}
                    <span
                      className="text-xs font-semibold flex-shrink-0"
                      style={{ color: 'var(--tg-theme-button-color, #3390ec)' }}
                    >
                      {done ? 'Review' : current ? 'Continue' : 'Start'} ›
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 opacity-40">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                      style={{ background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)', color: 'var(--tg-theme-hint-color)' }}
                    >
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--tg-theme-text-color, #212121)' }}>
                        {lesson.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color, #707579)' }}>
                        Complete previous lesson to unlock
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LessonsPage;
