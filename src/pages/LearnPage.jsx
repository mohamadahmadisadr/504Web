import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { wordsService } from '../services/firebaseService';
import { 
  Brain, 
  Trophy, 
  Target, 
  CheckCircle, 
  X, 
  RotateCcw,
  Zap,
  Volume2,
  Award
} from 'lucide-react';
import { shuffleArray, cn, playAudio } from '../lib/utils';
import LoadingSpinner from '../components/LoadingSpinner';

const LearnPage = () => {
  const { updateUserScore, userProfile } = useAuth();
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gameMode, setGameMode] = useState('definition'); // 'definition', 'translation', 'synonym'
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    fetchWords();
  }, []);

  const fetchWords = async () => {
    try {
      setLoading(true);
      const randomWords = await wordsService.getRandomWords(20);
      setWords(randomWords);
      setTotalQuestions(randomWords.length);
      
      if (randomWords.length > 0) {
        setupQuestion(randomWords, 0);
      }
    } catch (error) {
      console.error('Error fetching words:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupQuestion = (wordsList, index) => {
    if (index >= wordsList.length) {
      // Game completed
      handleGameComplete();
      return;
    }

    const word = wordsList[index];
    setCurrentWord(word);
    setCurrentWordIndex(index);
    setSelectedOption(null);
    setShowResult(false);

    // Generate options based on game mode
    generateOptions(word, wordsList);
  };

  const generateOptions = (correctWord, allWords) => {
    let correctAnswer;
    let wrongAnswers = [];

    switch (gameMode) {
      case 'definition':
        correctAnswer = correctWord.englishExplanation;
        wrongAnswers = allWords
          .filter(w => w.id !== correctWord.id)
          .map(w => w.englishExplanation)
          .filter(def => def && def !== correctAnswer);
        break;
        
      case 'translation':
        correctAnswer = correctWord.persianTranslation;
        wrongAnswers = allWords
          .filter(w => w.id !== correctWord.id)
          .map(w => w.persianTranslation)
          .filter(trans => trans && trans !== correctAnswer);
        break;
        
      case 'synonym':
        if (correctWord.synonyms && correctWord.synonyms.length > 0) {
          correctAnswer = correctWord.synonyms[0];
          wrongAnswers = allWords
            .filter(w => w.id !== correctWord.id)
            .flatMap(w => w.synonyms || [])
            .filter(syn => syn && syn !== correctAnswer);
        } else {
          // Fallback to definition if no synonyms
          correctAnswer = correctWord.englishExplanation;
          wrongAnswers = allWords
            .filter(w => w.id !== correctWord.id)
            .map(w => w.englishExplanation)
            .filter(def => def && def !== correctAnswer);
        }
        break;
        
      default:
        correctAnswer = correctWord.englishExplanation;
        wrongAnswers = allWords
          .filter(w => w.id !== correctWord.id)
          .map(w => w.englishExplanation)
          .filter(def => def && def !== correctAnswer);
    }

    // Select 3 random wrong answers
    const selectedWrong = shuffleArray(wrongAnswers).slice(0, 3);
    const allOptions = shuffleArray([correctAnswer, ...selectedWrong]);
    
    setOptions(allOptions);
  };

  const handleOptionSelect = (option) => {
    if (showResult) return;
    
    setSelectedOption(option);
    setShowResult(true);
    
    const isCorrect = checkAnswer(option);
    
    if (isCorrect) {
      const points = 10 + (streak * 2); // Bonus points for streak
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      updateUserScore(points);
    } else {
      setStreak(0);
    }
  };

  const checkAnswer = (selectedOption) => {
    if (!currentWord) return false;
    
    switch (gameMode) {
      case 'definition':
        return selectedOption === currentWord.englishExplanation;
      case 'translation':
        return selectedOption === currentWord.persianTranslation;
      case 'synonym':
        return currentWord.synonyms?.includes(selectedOption) || 
               selectedOption === currentWord.englishExplanation;
      default:
        return selectedOption === currentWord.englishExplanation;
    }
  };

  const nextQuestion = () => {
    setupQuestion(words, currentWordIndex + 1);
  };

  const restartGame = async () => {
    setScore(0);
    setStreak(0);
    setCurrentWordIndex(0);
    await fetchWords();
  };

  const handleGameComplete = () => {
    // Show completion message
    setCurrentWord(null);
  };

  const getQuestionText = () => {
    switch (gameMode) {
      case 'definition':
        return `What does "${currentWord?.word}" mean?`;
      case 'translation':
        return `What is the Persian translation of "${currentWord?.word}"?`;
      case 'synonym':
        return `Which word is a synonym of "${currentWord?.word}"?`;
      default:
        return `What does "${currentWord?.word}" mean?`;
    }
  };

  const progress = totalQuestions > 0 ? ((currentWordIndex) / totalQuestions) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Game completed
  if (!currentWord && words.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-10 h-10 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Congratulations!
            </h2>
            <p className="text-gray-600 mb-6">
              You completed the learning session
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{score}</div>
                <div className="text-sm text-gray-600">Points Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalQuestions}</div>
                <div className="text-sm text-gray-600">Words Practiced</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={restartGame}
                className="btn btn-primary btn-lg w-full"
              >
                Practice Again
              </button>
              <button
                onClick={() => window.history.back()}
                className="btn btn-outline btn-lg w-full"
              >
                Back to Lessons
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-6 h-6 text-primary-600" />
                <h1 className="text-xl font-bold text-gray-900">Quick Learn</h1>
              </div>
              
              {/* Game Mode Selector */}
              <div className="hidden sm:flex space-x-2">
                <button
                  onClick={() => setGameMode('definition')}
                  className={cn(
                    "btn btn-sm",
                    gameMode === 'definition' ? 'btn-primary' : 'btn-outline'
                  )}
                >
                  Definition
                </button>
                <button
                  onClick={() => setGameMode('translation')}
                  className={cn(
                    "btn btn-sm",
                    gameMode === 'translation' ? 'btn-primary' : 'btn-outline'
                  )}
                >
                  Translation
                </button>
                <button
                  onClick={() => setGameMode('synonym')}
                  className={cn(
                    "btn btn-sm",
                    gameMode === 'synonym' ? 'btn-primary' : 'btn-outline'
                  )}
                >
                  Synonym
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Target className="w-4 h-4 text-green-500" />
                  <span className="font-semibold">{score}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold">{streak}</span>
                </div>
              </div>
              
              <button
                onClick={restartGame}
                className="btn btn-outline btn-sm flex items-center space-x-1"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentWordIndex + 1} of {totalQuestions}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentWord && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Word Display */}
            <div className="bg-gradient-to-r from-primary-600 to-purple-600 text-white p-8 text-center">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <h2 className="text-4xl font-bold">{currentWord.word}</h2>
                <button
                  onClick={() => playAudio(currentWord.accents?.american || currentWord.media?.pronunciation)}
                  className="btn bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-full w-12 h-12 p-0"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xl opacity-90">{currentWord.spell}</p>
            </div>

            {/* Question */}
            <div className="p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                {getQuestionText()}
              </h3>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((option, index) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = showResult && checkAnswer(option);
                  const isWrong = showResult && isSelected && !isCorrect;

                  return (
                    <button
                      key={index}
                      onClick={() => handleOptionSelect(option)}
                      disabled={showResult}
                      className={cn(
                        "p-4 text-left rounded-lg border-2 transition-all duration-200",
                        !showResult && "hover:border-primary-300 hover:bg-primary-50",
                        isSelected && !showResult && "border-primary-500 bg-primary-50",
                        isCorrect && "border-green-500 bg-green-50 text-green-800",
                        isWrong && "border-red-500 bg-red-50 text-red-800",
                        !isSelected && showResult && "opacity-50",
                        showResult && "cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          gameMode === 'translation' ? 'text-right w-full font-persian' : '',
                          gameMode === 'translation' && 'font-persian'
                        )} 
                              dir={gameMode === 'translation' ? 'rtl' : 'ltr'}>
                          {option}
                        </span>
                        {showResult && isCorrect && (
                          <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
                        )}
                        {showResult && isWrong && (
                          <X className="w-5 h-5 text-red-600 ml-2" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Result Message */}
              {showResult && (
                <div className="mt-6 text-center">
                  {checkAnswer(selectedOption) ? (
                    <div className="text-green-600">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-semibold">Correct! +{10 + (streak * 2)} points</p>
                      {streak > 0 && (
                        <p className="text-sm">Streak bonus: +{streak * 2} points</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-600">
                      <X className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-semibold">Incorrect</p>
                      <p className="text-sm mt-1">
                        Correct answer: <span className={cn(
                          gameMode === 'translation' && 'font-persian',
                          gameMode === 'translation' && 'text-right'
                        )} dir={gameMode === 'translation' ? 'rtl' : 'ltr'}>{
                          gameMode === 'definition' ? currentWord.englishExplanation :
                          gameMode === 'translation' ? currentWord.persianTranslation :
                          currentWord.synonyms?.[0] || currentWord.englishExplanation
                        }</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Next Button */}
              {showResult && (
                <div className="mt-6 text-center">
                  <button
                    onClick={nextQuestion}
                    className="btn btn-primary btn-lg"
                  >
                    {currentWordIndex + 1 >= totalQuestions ? 'Complete' : 'Next Question'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnPage;
