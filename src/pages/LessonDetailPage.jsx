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
import { playAudio, cn } from '../lib/utils';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Mobile Layout */}
          <div className="sm:hidden">
            {/* Top Row: Back button and Complete lesson button */}
            <div className="flex items-center justify-between mb-3">
              <Link 
                to="/lessons"
                className="btn btn-outline btn-sm flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
              
              {!isLessonCompleted() && (
                <button
                  onClick={handleCompleteLesson}
                  className="btn btn-primary btn-sm flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden xs:inline">Complete</span>
                </button>
              )}
            </div>
            
            {/* Second Row: Lesson title */}
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {lesson.name}
              </h1>
              <p className="text-sm text-gray-600">
                {words.length} words • {isLessonCompleted() ? 'Completed' : 'In Progress'}
              </p>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/lessons"
                className="btn btn-outline btn-sm flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {lesson.name}
                </h1>
                <p className="text-gray-600">
                  {words.length} words • {isLessonCompleted() ? 'Completed' : 'In Progress'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "btn btn-sm",
                    viewMode === 'grid' ? 'btn-primary' : 'btn-outline'
                  )}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={cn(
                    "btn btn-sm",
                    viewMode === 'card' ? 'btn-primary' : 'btn-outline'
                  )}
                >
                  Cards
                </button>
              </div>

              {/* Complete Lesson Button */}
              {!isLessonCompleted() && (
                <button
                  onClick={handleCompleteLesson}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete Lesson</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {words.map((word, index) => (
              <div
                key={word.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedWord(word);
                  setCurrentWordIndex(index);
                  setViewMode('card');
                }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-primary-600">
                          {word.priority}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {word.word}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {word.spell}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudio(word.media?.pronunciation || word.accents?.american || word.accents?.british);
                      }}
                      className="btn btn-outline btn-sm rounded-full w-10 h-10 p-0"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Definition</h4>
                      <p className="text-sm text-gray-600">
                        {word.englishExplanation}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Translation</h4>
                      <p className="text-sm text-gray-600 text-right font-persian" dir="rtl">
                        {word.persianTranslation}
                      </p>
                    </div>

                    {word.synonyms && word.synonyms.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Synonyms</h4>
                        <div className="flex flex-wrap gap-1">
                          {word.synonyms.slice(0, 3).map((synonym, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                            >
                              {synonym}
                            </span>
                          ))}
                          {word.synonyms.length > 3 && (
                            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              +{word.synonyms.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>{word.examples?.length || 0} examples</span>
                      <span>{word.videos?.length || 0} videos</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Play className="w-3 h-3" />
                      <span>View Details</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Card View
          <div className="max-w-4xl mx-auto">
            {selectedWord && (
              <div className="bg-white rounded-lg shadow-lg">
                {/* Navigation */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => navigateWord('prev')}
                    disabled={currentWordIndex === 0}
                    className="btn btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="text-center">
                    <span className="text-sm text-gray-600">
                      {currentWordIndex + 1} of {words.length}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => navigateWord('next')}
                    disabled={currentWordIndex === words.length - 1}
                    className="btn btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>

                {/* Word Card */}
                <WordCard word={selectedWord} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="sm:hidden fixed bottom-20 right-6 z-30">
        <button
          onClick={() => setViewMode(viewMode === 'grid' ? 'card' : 'grid')}
          className="btn btn-primary rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
        >
          {viewMode === 'grid' ? (
            <BookOpen className="w-6 h-6" />
          ) : (
            <Globe className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
};

export default LessonDetailPage;
