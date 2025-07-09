import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { leitnerService } from '../services/firebaseService';
import { 
  Brain, 
  Plus, 
  BookOpen, 
  Clock, 
  Target, 
  BarChart3,
  Trash2,
  Play,
  ChevronRight,
  Calendar,
  Award,
  TrendingUp,
  Volume2
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import PersianText from '../components/PersianText';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const LeitnerBoxPage = () => {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState([]);
  const [dueFlashcards, setDueFlashcards] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddCustomWord, setShowAddCustomWord] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Add pronunciation functionality
  const playPronunciation = (word) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (user) {
      loadLeitnerData();
    }
  }, [user]);

  const loadLeitnerData = async () => {
    try {
      setLoading(true);
      const [flashcardsData, dueFlashcardsData, statsData] = await Promise.all([
        leitnerService.getUserFlashcards(user.uid),
        leitnerService.getDueFlashcards(user.uid),
        leitnerService.getUserLeitnerStats(user.uid)
      ]);
      setFlashcards(flashcardsData);
      setDueFlashcards(dueFlashcardsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading Leitner data:', error);
      if (error.message && error.message.includes('index')) {
        toast.error('Database is being set up. Please try again in a few minutes.');
      } else {
        toast.error('Failed to load flashcards');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFlashcard = async (flashcardId) => {
    if (window.confirm('Are you sure you want to delete this flashcard?')) {
      try {
        await leitnerService.deleteFlashcard(flashcardId);
        toast.success('Flashcard deleted');
        loadLeitnerData();
      } catch (error) {
        console.error('Error deleting flashcard:', error);
        toast.error('Failed to delete flashcard');
      }
    }
  };

  const startStudyMode = () => {
    if (dueFlashcards.length === 0) {
      toast.error('No cards due for review');
      return;
    }
    setStudyMode(true);
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  const handleReviewAnswer = async (isCorrect) => {
    try {
      const currentCard = dueFlashcards[currentCardIndex];
      await leitnerService.updateFlashcardAfterReview(currentCard.id, isCorrect);
      
      if (currentCardIndex < dueFlashcards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        // Study session complete
        setStudyMode(false);
        setCurrentCardIndex(0);
        setShowAnswer(false);
        toast.success('Study session complete!');
        loadLeitnerData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating flashcard:', error);
      toast.error('Failed to update flashcard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (studyMode && dueFlashcards.length > 0) {
    const currentCard = dueFlashcards[currentCardIndex];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">
                Card {currentCardIndex + 1} of {dueFlashcards.length}
              </span>
              <button
                onClick={() => setStudyMode(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Exit Study Mode
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentCardIndex + 1) / dueFlashcards.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Flashcard */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center min-h-[400px] flex flex-col justify-center">
            <div className="mb-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mb-4">
                Box {currentCard.box}
              </div>
              <div className="flex items-center justify-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-gray-900">
                  {currentCard.word}
                </h1>
                <button
                  onClick={() => playPronunciation(currentCard.word)}
                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors duration-200"
                  title="Play pronunciation"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>
              {/* {currentCard.pronunciation && (
                <p className="text-gray-500 text-lg mb-4">
                  /{typeof currentCard.pronunciation === 'string' ? currentCard.pronunciation : currentCard.pronunciation.text || currentCard.pronunciation}/
                </p>
              )} */}
              
              {/* Show Persian meaning before revealing answer */}
              <div className="text-xl font-medium text-gray-700 mb-4">
                <PersianText>{currentCard.persianMeaning}</PersianText>
              </div>
            </div>

            {showAnswer ? (
              <div className="space-y-4">
                {currentCard.definition && (
                  <p className="text-gray-600 text-lg">{currentCard.definition}</p>
                )}
                
                {currentCard.examples && currentCard.examples.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Examples:</h4>
                    <ul className="space-y-1">
                      {currentCard.examples.slice(0, 2).map((example, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          • {typeof example === 'string' ? example : example.text || example.sentence || ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                  <button
                    onClick={() => handleReviewAnswer(false)}
                    className="flex-1 sm:flex-none px-8 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 transform hover:scale-105 font-semibold shadow-lg hover:shadow-xl"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <span>❌</span>
                      <span>I didn't know it</span>
                    </span>
                  </button>
                  <button
                    onClick={() => handleReviewAnswer(true)}
                    className="flex-1 sm:flex-none px-8 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 transform hover:scale-105 font-semibold shadow-lg hover:shadow-xl"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <span>✅</span>
                      <span>I knew it!</span>
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="px-10 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <span>Show Answer</span>
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-10 h-10 text-purple-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Leitner Box
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Master your vocabulary with spaced repetition learning system
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
          {dueFlashcards.length > 0 && (
            <button
              onClick={startStudyMode}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-lg py-4 px-8 font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Play className="w-6 h-6" />
              <span>Study Now ({dueFlashcards.length})</span>
            </button>
          )}
          <button
            onClick={() => setShowAddCustomWord(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-4 px-8 font-medium bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            <Plus className="w-6 h-6" />
            <span>Add Custom Word</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalCards}</p>
              <p className="text-sm font-medium text-gray-600">Total Cards</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <Clock className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.dueCards}</p>
              <p className="text-sm font-medium text-gray-600">Due Today</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.averageAccuracy}%</p>
              <p className="text-sm font-medium text-gray-600">Accuracy</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <Award className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.customWords}</p>
              <p className="text-sm font-medium text-gray-600">Custom Words</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'due', label: `Due (${dueFlashcards.length})`, icon: Clock },
            { id: 'all', label: 'All Cards', icon: BookOpen }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                activeTab === tab.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Box Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Box Distribution</h3>
            <div className="space-y-3">
              {Object.entries(stats.boxDistribution).map(([box, count]) => (
                <div key={box} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Box {box} ({Math.pow(2, parseInt(box) - 1)} day{Math.pow(2, parseInt(box) - 1) > 1 ? 's' : ''} interval)
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${stats.totalCards > 0 ? (count / stats.totalCards) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 min-w-[2rem]">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'due' && (
        <div className="space-y-4">
          {dueFlashcards.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No cards due for review</h3>
              <p className="text-gray-600">Great job! Check back later or add more words to study.</p>
            </div>
          ) : (
            <>
              <div className="bg-purple-50 rounded-lg p-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-center sm:text-left">
                    <p className="text-purple-900 font-semibold">
                      {dueFlashcards.length} card{dueFlashcards.length > 1 ? 's' : ''} ready for review
                    </p>
                    <p className="text-purple-700 text-sm">Start studying to improve your vocabulary retention</p>
                  </div>
                  <button
                    onClick={startStudyMode}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 font-medium py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Studying</span>
                  </button>
                </div>
              </div>
              <FlashcardList 
                flashcards={dueFlashcards} 
                onDelete={handleDeleteFlashcard}
                showDueInfo={true}
              />
            </>
          )}
        </div>
      )}

      {activeTab === 'all' && (
        <div className="space-y-4">
          {flashcards.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No flashcards yet</h3>
              <p className="text-gray-600 mb-6">
                Start building your vocabulary by adding words to your Leitner box
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto">
                <button
                  onClick={() => setShowAddCustomWord(true)}
                  className="flex-1 sm:flex-none font-medium py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>Add Your First Word</span>
                  </span>
                </button>
                <a
                  href="/lessons"
                  className="flex-1 sm:flex-none font-medium py-3 px-6 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>Browse Lessons</span>
                  </span>
                </a>
              </div>
            </div>
          ) : (
            <FlashcardList 
              flashcards={flashcards} 
              onDelete={handleDeleteFlashcard}
            />
          )}
        </div>
      )}

      {/* Add Custom Word Modal */}
      {showAddCustomWord && (
        <AddCustomWordModal
          onClose={() => setShowAddCustomWord(false)}
          onAdd={loadLeitnerData}
        />
      )}
    </div>
  );
};

// Flashcard List Component
const FlashcardList = ({ flashcards, onDelete, showDueInfo = false }) => {
  return (
    <div className="grid gap-4">
      {flashcards.map((flashcard) => (
        <div
          key={flashcard.id}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {flashcard.word}
                </h3>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  flashcard.isCustomWord
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {flashcard.isCustomWord ? 'Custom' : 'From Lesson'}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  Box {flashcard.box}
                </span>
              </div>
              
              <p className="text-gray-800 mb-2" dir="rtl">
                <PersianText as="span">{flashcard.meaning}</PersianText>
              </p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>
                  Reviews: {flashcard.reviewCount || 0}
                </span>
                <span>
                  Accuracy: {
                    flashcard.reviewCount > 0
                      ? Math.round(((flashcard.correctCount || 0) / flashcard.reviewCount) * 100)
                      : 0
                  }%
                </span>
                {showDueInfo && (
                  <span className="text-orange-600 font-medium">
                    Due for review
                  </span>
                )}
                {!showDueInfo && (
                  <span>
                    Next review: {formatDistanceToNow(flashcard.nextReviewDate, { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => onDelete(flashcard.id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Add Custom Word Modal Component
const AddCustomWordModal = ({ onClose, onAdd }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    word: '',
    meaning: '',
    pronunciation: '',
    definition: '',
    examples: ['']
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.word.trim() || !formData.meaning.trim()) {
      toast.error('Word and meaning are required');
      return;
    }

    try {
      setLoading(true);
      await leitnerService.addCustomWord(user.uid, {
        ...formData,
        examples: formData.examples.filter(ex => ex.trim())
      });
      toast.success('Custom word added to Leitner box');
      onAdd();
      onClose();
    } catch (error) {
      console.error('Error adding custom word:', error);
      toast.error('Failed to add custom word');
    } finally {
      setLoading(false);
    }
  };

  const addExample = () => {
    setFormData(prev => ({
      ...prev,
      examples: [...prev.examples, '']
    }));
  };

  const updateExample = (index, value) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.map((ex, i) => i === index ? value : ex)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add Custom Word</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Word (English) *
              </label>
              <input
                type="text"
                value={formData.word}
                onChange={(e) => setFormData(prev => ({ ...prev, word: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter the English word"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meaning (Persian) *
              </label>
              <input
                type="text"
                value={formData.meaning}
                onChange={(e) => setFormData(prev => ({ ...prev, meaning: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="معنی فارسی کلمه را وارد کنید"
                dir="rtl"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pronunciation
              </label>
              <input
                type="text"
                value={formData.pronunciation}
                onChange={(e) => setFormData(prev => ({ ...prev, pronunciation: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="pronunciation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Definition
              </label>
              <textarea
                value={formData.definition}
                onChange={(e) => setFormData(prev => ({ ...prev, definition: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="3"
                placeholder="Definition or description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Examples
              </label>
              {formData.examples.map((example, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="text"
                    value={example}
                    onChange={(e) => updateExample(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={`Example ${index + 1}`}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addExample}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                + Add Another Example
              </button>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add to Leitner Box'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeitnerBoxPage;
