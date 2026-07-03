import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Award,
  Gamepad2
} from 'lucide-react';
import { shuffleArray, cn, playSpeech } from '../lib/utils';
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
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8" style={{ background: 'var(--tg-theme-bg-color, #ffffff)' }}>
        <div className="w-full max-w-sm">
          <div className="rounded-2xl shadow-lg p-6 text-center" style={{ background: 'var(--tg-theme-section-bg-color, #ffffff)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(34,197,94,0.12)' }}>
              <Award className="w-8 h-8 text-green-500" />
            </div>

            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--tg-theme-text-color, #212121)' }}>
              Congratulations!
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--tg-theme-hint-color, #707579)' }}>
              You completed the learning session
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl p-3" style={{ background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)' }}>
                <div className="text-2xl font-bold" style={{ color: 'var(--tg-theme-button-color, #3390ec)' }}>{score}</div>
                <div className="text-xs" style={{ color: 'var(--tg-theme-hint-color, #707579)' }}>Points Earned</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)' }}>
                <div className="text-2xl font-bold text-green-500">{totalQuestions}</div>
                <div className="text-xs" style={{ color: 'var(--tg-theme-hint-color, #707579)' }}>Words Practiced</div>
              </div>
            </div>

            <div className="space-y-2">
              <button onClick={restartGame} className="btn btn-primary w-full py-3 rounded-xl text-sm font-semibold">
                Practice Again
              </button>
              <button
                onClick={() => window.history.back()}
                className="btn btn-outline w-full py-3 rounded-xl text-sm font-semibold"
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
    <div className="bg-tg-bg pb-4">
      {/* Compact Header - inline score + progress */}
      <div
        className="sticky z-40 px-3 py-2 border-b"
        style={{
          top: 0,
          background: 'var(--tg-theme-bg-color, #ffffff)',
          borderColor: 'var(--tg-theme-secondary-bg-color, #e5e7eb)',
        }}
      >
        {/* Top row: title + stats + restart */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Brain className="w-4 h-4" style={{ color: 'var(--tg-theme-accent-text-color, #3390ec)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--tg-theme-text-color, #212121)' }}>Quick Learn</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-semibold" style={{ color: 'var(--tg-theme-text-color, #212121)' }}>{score}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-semibold" style={{ color: 'var(--tg-theme-text-color, #212121)' }}>{streak}</span>
            </div>
            <button
              onClick={restartGame}
              className="p-1 rounded-md"
              style={{ color: 'var(--tg-theme-hint-color, #707579)' }}
              title="Restart"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar + counter */}
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--tg-theme-secondary-bg-color, #e5e7eb)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: 'var(--tg-theme-button-color, #3390ec)' }}
            />
          </div>
          <span className="text-xs whitespace-nowrap" style={{ color: 'var(--tg-theme-hint-color, #707579)' }}>
            {currentWordIndex + 1}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* 2D Space Shooter Promo Card */}
      <div className="px-3 pt-3">
        <Link
          to="/shooter"
          className="relative flex items-center justify-between p-4 rounded-2xl overflow-hidden border shadow-sm active:scale-95 transition-all duration-150 animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, #0d1527, #1e1b4b)',
            borderColor: 'rgba(51, 144, 236, 0.25)'
          }}
        >
          <div className="z-10 space-y-1">
            <span className="inline-block bg-[#3390ec] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider mb-1">
              Arcade Game Mode
            </span>
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <span>Space Blaster</span>
              <span className="animate-pulse">🚀</span>
            </h3>
            <p className="text-[11px] text-gray-300 leading-normal max-w-[220px]">
              Shoot correct translation asteroids & defend your shields to earn score points!
            </p>
          </div>
          <div 
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-opacity-20 bg-blue-500 border border-blue-400 border-opacity-30 text-[#3390ec]"
          >
            <Gamepad2 className="w-5 h-5 animate-bounce" />
          </div>
        </Link>
      </div>

      {/* Game Mode Pills */}
      <div className="flex gap-2 px-3 pt-3 pb-1">
        {[
          { key: 'definition', label: 'Definition' },
          { key: 'translation', label: 'Translation' },
          { key: 'synonym', label: 'Synonym' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setGameMode(key)}
            className="flex-1 py-1.5 rounded-full text-xs font-medium transition-all"
            style={
              gameMode === key
                ? {
                    background: 'var(--tg-theme-button-color, #3390ec)',
                    color: 'var(--tg-theme-button-text-color, #ffffff)',
                  }
                : {
                    background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)',
                    color: 'var(--tg-theme-hint-color, #707579)',
                  }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Question Content */}
      <div className="px-3 pt-2">
        {currentWord && (
          <div className="rounded-2xl overflow-hidden shadow-md" style={{ background: 'var(--tg-theme-section-bg-color, #ffffff)' }}>
            {/* Word Display — compact gradient */}
            <div
              className="px-4 py-5 text-center"
              style={{ background: 'linear-gradient(135deg, var(--tg-theme-button-color, #3390ec), #8b5cf6)', color: '#fff' }}
            >
              <div className="flex items-center justify-center gap-3 mb-1">
                <h2 className="text-3xl font-bold tracking-tight">{currentWord.word}</h2>
                <button
                  onClick={() => playSpeech(currentWord.word, 'en-US')}
                  className="rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm opacity-80">{currentWord.spell}</p>
            </div>

            {/* Question + Options */}
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-3 text-center" style={{ color: 'var(--tg-theme-text-color, #212121)' }}>
                {getQuestionText()}
              </h3>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {options.map((option, index) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = showResult && checkAnswer(option);
                  const isWrong = showResult && isSelected && !isCorrect;

                  let optionStyle = {
                    borderColor: 'var(--tg-theme-secondary-bg-color, #e5e7eb)',
                    background: 'var(--tg-theme-bg-color, #ffffff)',
                    color: 'var(--tg-theme-text-color, #212121)',
                  };
                  if (isCorrect) optionStyle = { borderColor: '#22c55e', background: '#f0fdf4', color: '#166534' };
                  else if (isWrong) optionStyle = { borderColor: '#ef4444', background: '#fef2f2', color: '#991b1b' };
                  else if (isSelected && !showResult) optionStyle = { borderColor: 'var(--tg-theme-button-color, #3390ec)', background: 'rgba(51,144,236,0.06)', color: 'var(--tg-theme-text-color, #212121)' };

                  return (
                    <button
                      key={index}
                      onClick={() => handleOptionSelect(option)}
                      disabled={showResult}
                      className="p-3 text-left rounded-xl border-2 transition-all duration-200 w-full"
                      style={{
                        ...optionStyle,
                        opacity: !isSelected && showResult ? 0.5 : 1,
                        cursor: showResult ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'text-sm',
                            gameMode === 'translation' && 'font-persian text-right w-full'
                          )}
                          dir={gameMode === 'translation' ? 'rtl' : 'ltr'}
                        >
                          {option}
                        </span>
                        {showResult && isCorrect && <CheckCircle className="w-4 h-4 text-green-600 ml-2 flex-shrink-0" />}
                        {showResult && isWrong && <X className="w-4 h-4 text-red-600 ml-2 flex-shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Result Message */}
              {showResult && (
                <div className="mt-4 text-center">
                  {checkAnswer(selectedOption) ? (
                    <div className="text-green-600">
                      <CheckCircle className="w-6 h-6 mx-auto mb-1" />
                      <p className="text-sm font-semibold">Correct! +{10 + (streak * 2)} pts</p>
                      {streak > 0 && <p className="text-xs opacity-70">Streak bonus: +{streak * 2}</p>}
                    </div>
                  ) : (
                    <div className="text-red-600">
                      <X className="w-6 h-6 mx-auto mb-1" />
                      <p className="text-sm font-semibold">Incorrect</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--tg-theme-hint-color)' }}>
                        Answer:{' '}
                        <span
                          className={cn(gameMode === 'translation' && 'font-persian')}
                          dir={gameMode === 'translation' ? 'rtl' : 'ltr'}
                        >
                          {gameMode === 'definition'
                            ? currentWord.englishExplanation
                            : gameMode === 'translation'
                            ? currentWord.persianTranslation
                            : currentWord.synonyms?.[0] || currentWord.englishExplanation}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Next Button */}
              {showResult && (
                <div className="mt-4">
                  <button
                    onClick={nextQuestion}
                    className="btn btn-primary w-full py-3 rounded-xl text-sm font-semibold"
                  >
                    {currentWordIndex + 1 >= totalQuestions ? 'Complete' : 'Next Question →'}
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
