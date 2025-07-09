import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { lessonsService } from '../services/firebaseService';
import { 
  BookOpen, 
  CheckCircle, 
  Circle, 
  Star, 
  Play,
  Clock,
  Target
} from 'lucide-react';
import { calculateProgress, cn } from '../lib/utils';
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
        const lessonsData = await lessonsService.getAllLessons();
        setLessons(lessonsData);
      } catch (error) {
        console.error('Error fetching lessons:', error);
        setError('Failed to load lessons');
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, []);

  const isLessonCompleted = (lessonNumber) => {
    return userProfile?.completedLessons?.includes(lessonNumber) || false;
  };

  const isLessonUnlocked = (lessonNumber) => {
    if (lessonNumber <= 1) return true;
    return (userProfile?.currentLesson || 1) >= lessonNumber;
  };

  const completedLessonsCount = userProfile?.completedLessons?.length || 0;
  const progressPercentage = calculateProgress(completedLessonsCount, lessons.length);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                504 Essential Words Lessons
              </h1>
              <p className="mt-2 text-gray-600">
                Master English vocabulary through structured lessons
              </p>
            </div>
            <div className="hidden sm:block">
              <Link 
                to="/learn"
                className="btn btn-primary flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Quick Learn</span>
              </Link>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Target className="w-6 h-6 text-primary-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Your Progress</h3>
                  <p className="text-sm text-gray-600">
                    {completedLessonsCount} of {lessons.length} lessons completed
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">
                  {progressPercentage}%
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Lessons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {lessons.map((lesson) => {
            const isCompleted = isLessonCompleted(lesson.number);
            const isUnlocked = isLessonUnlocked(lesson.number);
            const isCurrent = (userProfile?.currentLesson || 1) === lesson.number;

            return (
              <div
                key={lesson.id}
                className={cn(
                  "bg-white rounded-lg shadow-sm border-2 transition-all duration-200 hover:shadow-md",
                  isCompleted 
                    ? "border-green-200 bg-green-50" 
                    : isCurrent 
                      ? "border-primary-200 bg-primary-50" 
                      : isUnlocked 
                        ? "border-gray-200 hover:border-primary-200" 
                        : "border-gray-100 bg-gray-50 opacity-60"
                )}
              >
                <div className="p-6">
                  {/* Lesson Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                        isCompleted
                          ? "bg-green-100 text-green-600"
                          : isCurrent
                            ? "bg-primary-100 text-primary-600"
                            : isUnlocked
                              ? "bg-gray-100 text-gray-600"
                              : "bg-gray-50 text-gray-400"
                      )}>
                        {lesson.number}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {lesson.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {lesson.wordCount} words
                        </p>
                      </div>
                    </div>
                    
                    {/* Status Icon */}
                    <div>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : isCurrent ? (
                        <Star className="w-6 h-6 text-primary-500" />
                      ) : isUnlocked ? (
                        <Circle className="w-6 h-6 text-gray-400" />
                      ) : (
                        <Clock className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                  </div>

                  {/* Lesson Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{lesson.wordCount} words</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>~15 min</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {isUnlocked ? (
                      <Link
                        to={`/lessons/${lesson.number}`}
                        className={cn(
                          "w-full flex items-center justify-center space-x-2 font-medium py-3 px-4 rounded-lg transition-colors duration-200",
                          isCompleted
                            ? "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        )}
                      >
                        <Play className="w-5 h-5" />
                        <span>
                          {isCompleted ? 'Review' : isCurrent ? 'Continue' : 'Start'}
                        </span>
                      </Link>
                    ) : (
                      <div className="btn w-full bg-gray-100 text-gray-400 cursor-not-allowed flex items-center justify-center space-x-2 py-3">
                        <Clock className="w-5 h-5" />
                        <span>🔒 Locked</span>
                      </div>
                    )}
                  </div>

                  {/* Status Labels */}
                  <div className="mt-3 flex justify-center">
                    {isCompleted && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    )}
                    {isCurrent && !isCompleted && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        Current
                      </span>
                    )}
                    {!isUnlocked && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Complete previous lessons
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Learn Button for Mobile */}
        <div className="sm:hidden fixed bottom-20 right-6 z-30">
          <Link 
            to="/learn"
            className="btn btn-primary rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
          >
            <Play className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LessonsPage;
