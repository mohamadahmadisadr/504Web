import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { wordsService, lessonsService } from '../services/firebaseService';
import { 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Play, 
  CheckCircle,
  BookOpen,
  Globe,
  Star
} from 'lucide-react';
import { playSpeech, cn } from '../lib/utils';
import LoadingSpinner from '../components/LoadingSpinner';
import WordCard from '../components/WordCard';

const LessonDetailPage = () => {
  const { lessonNumber } = useParams();
  const { userProfile, completeLesson } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'card'

  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        setLoading(true);
        const lessonNum = parseInt(lessonNumber);
        
        const [lessonData, wordsData] = await Promise.all([
          lessonsService.getLessonByNumber(lessonNum),
          wordsService.getWordsByLesson(lessonNum)
        ]);
        
        setLesson(lessonData);
        setWords(wordsData);
        
        if (wordsData.length > 0) {
          setSelectedWord(wordsData[0]);
        }
      } catch (error) {
        console.error('Error fetching lesson data:', error);
        setError('Failed to load lesson');
      } finally {
        setLoading(false);
      }
    };

    if (lessonNumber) {
      fetchLessonData();
    }
  }, [lessonNumber]);

  const handleCompleteLesson = async () => {
    if (lesson) {
      await completeLesson(lesson.number);
    }
  };

  const isLessonCompleted = () => {
    return userProfile?.completedLessons?.includes(parseInt(lessonNumber)) || false;
  };

  const navigateWord = (direction) => {
    const newIndex = direction === 'next' 
      ? Math.min(currentWordIndex + 1, words.length - 1)
      : Math.max(currentWordIndex - 1, 0);
    
    setCurrentWordIndex(newIndex);
    setSelectedWord(words[newIndex]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error || 'Lesson not found'}</div>
          <Link to="/lessons" className="btn btn-primary">
            Back to Lessons
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="tg-page">
      {/* Redesigned Premium Header Nav Bar */}
      <div 
        className="sticky top-0 z-40 border-b flex items-center justify-between px-4 py-2.5" 
        style={{ background: 'var(--tg-theme-bg-color)', borderColor: 'var(--tg-theme-secondary-bg-color)' }}
      >
        <Link 
          to="/lessons" 
          className="flex items-center text-sm font-semibold gap-1"
          style={{ color: 'var(--tg-theme-button-color, #3390ec)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg p-0.5" style={{ background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)' }}>
            <button
              onClick={() => setViewMode('grid')}
              className="px-2.5 py-1 text-xs font-bold rounded-md transition-all duration-150"
              style={
                viewMode === 'grid'
                  ? {
                      background: 'var(--tg-theme-bg-color, #ffffff)',
                      color: 'var(--tg-theme-button-color, #3390ec)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }
                  : {
                      color: 'var(--tg-theme-hint-color, #707579)'
                    }
              }
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('card')}
              className="px-2.5 py-1 text-xs font-bold rounded-md transition-all duration-150"
              style={
                viewMode === 'card'
                  ? {
                      background: 'var(--tg-theme-bg-color, #ffffff)',
                      color: 'var(--tg-theme-button-color, #3390ec)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }
                  : {
                      color: 'var(--tg-theme-hint-color, #707579)'
                    }
              }
            >
              Cards
            </button>
          </div>

          {!isLessonCompleted() ? (
            <button
              onClick={handleCompleteLesson}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm active:scale-95 transition-all"
              style={{ background: '#22c55e', color: '#ffffff' }}
              title="Complete Lesson"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Finish</span>
            </button>
          ) : (
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 bg-green-100 text-green-700"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Done</span>
            </span>
          )}
        </div>
      </div>

      {/* Page Content Title Block */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--tg-theme-text-color)' }}>
          {lesson.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--tg-theme-hint-color)' }}>
          {words.length} words • {isLessonCompleted() ? 'Completed' : 'In Progress'}
        </p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'grid' ? (
          <>
            {/* Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {words.map((word, index) => (
              <div
                key={word.id}
                className="tg-card shadow-sm border hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}
                onClick={() => {
                  setSelectedWord(word);
                  setCurrentWordIndex(index);
                  setViewMode('card');
                }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                           style={{ background: 'color-mix(in srgb, var(--tg-theme-button-color, #3390ec) 15%, transparent)' }}>
                        <span className="font-bold text-sm" style={{ color: 'var(--tg-theme-button-color)' }}>
                          {word.priority}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold" style={{ color: 'var(--tg-theme-text-color)' }}>
                          {word.word}
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
                          {word.spell}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playSpeech(word.word, 'en-US');
                      }}
                      className="btn btn-outline btn-sm rounded-full w-10 h-10 p-0"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--tg-theme-text-color)' }}>Definition</h4>
                      <p className="text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
                        {word.englishExplanation}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--tg-theme-text-color)' }}>Translation</h4>
                      <p className="text-sm text-right font-persian" dir="rtl" style={{ color: 'var(--tg-theme-text-color)' }}>
                        {word.persianTranslation}
                      </p>
                    </div>

                    {word.synonyms && word.synonyms.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--tg-theme-text-color)' }}>Synonyms</h4>
                        <div className="flex flex-wrap gap-1">
                          {word.synonyms.slice(0, 3).map((synonym, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-1 text-xs rounded font-semibold"
                              style={{
                                background: 'color-mix(in srgb, var(--tg-theme-button-color, #3390ec) 12%, transparent)',
                                color: 'var(--tg-theme-button-color)'
                              }}
                            >
                              {synonym}
                            </span>
                          ))}
                          {word.synonyms.length > 3 && (
                            <span className="inline-block px-2 py-1 text-xs rounded font-semibold"
                                  style={{ background: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-hint-color)' }}>
                              +{word.synonyms.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 flex items-center justify-between text-sm"
                       style={{ borderTop: '1px solid var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-hint-color)' }}>
                    <div className="flex items-center space-x-4">
                      <span>{word.examples?.length || 0} examples</span>
                      <span>{word.videos?.length || 0} videos</span>
                    </div>
                    <div className="flex items-center space-x-1 font-semibold" style={{ color: 'var(--tg-theme-button-color)' }}>
                      <Play className="w-3 h-3" />
                      <span>View Details</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Prominent completion call-to-action */}
          {!isLessonCompleted() ? (
            <div className="mt-8 p-6 tg-card border text-center space-y-4" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
              <div className="inline-flex p-3 rounded-full bg-green-500/10 text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold" style={{ color: 'var(--tg-theme-text-color)' }}>
                  Finished studying all words?
                </h3>
                <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Mark this lesson as completed to unlock the next one and earn +50 points!
                </p>
              </div>
              <button
                onClick={handleCompleteLesson}
                className="w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 mx-auto"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Lesson as Completed (+50 pts)</span>
              </button>
            </div>
          ) : (
            <div className="mt-8 p-5 tg-card border text-center space-y-2" style={{ borderColor: 'rgba(34, 197, 94, 0.2)', background: 'color-mix(in srgb, #22c55e 5%, transparent)' }}>
              <div className="inline-flex text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-green-700">
                Lesson Completed!
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--tg-theme-hint-color)' }}>
                You have finished this lesson and claimed your points. Great job!
              </p>
            </div>
          )}
          </>
        ) : (
          // Card View
          <div className="max-w-4xl mx-auto">
            {selectedWord && (
              <div className="tg-card shadow-lg border overflow-hidden" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
                {/* Navigation */}
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
                  <button
                    onClick={() => navigateWord('prev')}
                    disabled={currentWordIndex === 0}
                    className="btn btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="text-center">
                    <span className="text-sm font-semibold" style={{ color: 'var(--tg-theme-hint-color)' }}>
                      {currentWordIndex + 1} of {words.length}
                    </span>
                  </div>
                  
                  {currentWordIndex === words.length - 1 ? (
                    !isLessonCompleted() ? (
                      <button
                        onClick={handleCompleteLesson}
                        className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Finish</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                        Completed
                      </span>
                    )
                  ) : (
                    <button
                      onClick={() => navigateWord('next')}
                      className="btn btn-outline btn-sm"
                    >
                      Next
                    </button>
                  )}
                </div>

                {/* Word Card */}
                <WordCard word={selectedWord} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonDetailPage;
