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
  Volume2,
  Info,
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle,
  HelpCircle,
  Keyboard
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
  const [showPersianHint, setShowPersianHint] = useState(false);

  // Add pronunciation functionality
  const playPronunciation = (word) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
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
        toast.error('Database setup in progress. Please try again in a few minutes.');
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
    setShowPersianHint(false);
  };

  const handleReviewAnswer = (isCorrect) => {
    const currentCard = dueFlashcards[currentCardIndex];
    
    // Trigger database update in background optimistically
    leitnerService.updateFlashcardAfterReview(currentCard.id, isCorrect).catch(error => {
      console.error('Error updating flashcard:', error);
      toast.error('Failed to save review');
    });

    // Move to next card immediately
    if (currentCardIndex < dueFlashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setShowAnswer(false);
      setShowPersianHint(false);
    } else {
      // Study session complete
      setStudyMode(false);
      setCurrentCardIndex(0);
      setShowAnswer(false);
      setShowPersianHint(false);
      toast.success('Study session complete!');
      loadLeitnerData(); // Refresh data in background
    }
  };

  // Keyboard controls for study mode
  useEffect(() => {
    if (!studyMode || dueFlashcards.length === 0) return;

    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setShowAnswer(true);
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setShowPersianHint(prev => !prev);
      } else if (e.key === '1' || e.key === 'ArrowLeft') {
        if (showAnswer) {
          handleReviewAnswer(false);
        }
      } else if (e.key === '2' || e.key === 'ArrowRight') {
        if (showAnswer) {
          handleReviewAnswer(true);
        }
      } else if (e.key === 'Escape') {
        setStudyMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [studyMode, showAnswer, currentCardIndex, dueFlashcards]);

  // Calculate box details locally based on stats/flashcards
  const getBoxDetails = (boxNum) => {
    const totalCount = stats?.boxDistribution[boxNum] || 0;
    const dueCount = dueFlashcards.filter(card => card.box === boxNum).length;
    
    const boxMeta = {
      1: { name: 'Box 1: Daily', interval: '1 day', color: '#ef4444', desc: 'Starting point for new or missed words.' },
      2: { name: 'Box 2: Every 2 Days', interval: '2 days', color: '#f59e0b', desc: 'Short-term retention checkpoint.' },
      3: { name: 'Box 3: Every 4 Days', interval: '4 days', color: '#06b6d4', desc: 'Medium-term storage and recall.' },
      4: { name: 'Box 4: Every 8 Days', interval: '8 days', color: '#6366f1', desc: 'Long-term consolidation phase.' },
      5: { name: 'Box 5: Every 16 Days', interval: '16 days', color: '#10b981', desc: 'Permanent memory reinforcement.' }
    };

    return {
      ...boxMeta[boxNum],
      totalCount,
      dueCount
    };
  };

  if (loading && dueFlashcards.length === 0 && flashcards.length === 0 && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--tg-theme-secondary-bg-color)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // ── Study Mode UI ──
  if (studyMode && dueFlashcards.length > 0) {
    const currentCard = dueFlashcards[currentCardIndex];
    
    return (
      <div className="min-h-screen p-4 flex flex-col justify-between tg-page bg-[var(--tg-theme-secondary-bg-color)]">
        {/* Study Header */}
        <div className="w-full max-w-sm mx-auto flex items-center justify-between py-2">
          <span className="text-xs font-bold" style={{ color: 'var(--tg-theme-hint-color)' }}>
            Session Progress: {currentCardIndex + 1}/{dueFlashcards.length}
          </span>
          <button
            onClick={() => setStudyMode(false)}
            className="text-xs font-bold px-3 py-1 rounded-full bg-[color-mix(in srgb,var(--tg-theme-destructive-text-color,#e53935)_12%,transparent)] transition-all duration-150"
            style={{ color: 'var(--tg-theme-destructive-text-color, #e53935)' }}
          >
            Exit Study
          </button>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full max-w-sm mx-auto h-1.5 rounded-full overflow-hidden mb-6 bg-[color-mix(in srgb,var(--tg-theme-hint-color)_15%,transparent)]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ 
              width: `${((currentCardIndex + 1) / dueFlashcards.length) * 100}%`,
              background: 'var(--tg-theme-button-color, #3390ec)' 
            }}
          />
        </div>

        {/* 3D Flipping Flashcard Wrapper */}
        <div className="w-full max-w-sm mx-auto flex-1 flex items-center justify-center py-2">
          <div className="w-full flashcard-perspective">
            <div className={`flashcard-inner ${showAnswer ? 'is-flipped' : ''}`}>
              
              {/* CARD FRONT FACE */}
              <div className={`flashcard-front tg-card p-6 border shadow-md flex flex-col justify-between box-glow-${currentCard.box}`}>
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold box-badge-${currentCard.box}`}>
                    Box {currentCard.box}
                  </span>
                  {currentCard.isCustomWord && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[color-mix(in srgb,var(--tg-theme-button-color,#3390ec)_10%,transparent)]" style={{ color: 'var(--tg-theme-button-color)' }}>
                      Custom
                    </span>
                  )}
                </div>

                {/* Main Content */}
                <div className="text-center my-auto py-4 space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--tg-theme-text-color)' }}>
                      {currentCard.word}
                    </h1>
                    <button
                      onClick={() => playPronunciation(currentCard.word)}
                      className="p-1.5 rounded-full hover:bg-[color-mix(in srgb,var(--tg-theme-button-color,#3390ec)_15%,transparent)] transition-all"
                      style={{ color: 'var(--tg-theme-button-color)' }}
                      title="Pronounce"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Persian Hint Button & Value */}
                  <div className="pt-2 min-h-[3rem]">
                    {showPersianHint ? (
                      <div className="text-lg font-bold text-center text-emerald-600 persian">
                        <PersianText>{currentCard.meaning}</PersianText>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowPersianHint(true)}
                        className="text-xs font-semibold px-3 py-1 rounded-full border border-dashed hover:bg-[color-mix(in srgb,var(--tg-theme-hint-color)_8%,transparent)] transition-all"
                        style={{ color: 'var(--tg-theme-hint-color)', borderColor: 'color-mix(in srgb,var(--tg-theme-hint-color)_30%,transparent)' }}
                      >
                        Show Persian Translation Hint
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer action */}
                <button
                  onClick={() => setShowAnswer(true)}
                  className="w-full py-3.5 btn btn-primary rounded-xl font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  <Play className="w-4 h-4" />
                  <span>Show Definition & Answer</span>
                </button>
              </div>

              {/* CARD BACK FACE */}
              <div className={`flashcard-back tg-card p-6 border shadow-md flex flex-col justify-between box-glow-${currentCard.box}`}>
                {/* Header info */}
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
                  <h3 className="text-base font-bold" style={{ color: 'var(--tg-theme-text-color)' }}>{currentCard.word}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold box-badge-${currentCard.box}`}>
                    Box {currentCard.box}
                  </span>
                </div>

                {/* Back content (Scrollable if too long) */}
                <div className="flex-1 overflow-y-auto py-3 pr-1 space-y-4 no-scrollbar">
                  {/* Persian translation */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: 'var(--tg-theme-hint-color)' }}>
                      Persian Translation
                    </span>
                    <div className="text-lg font-bold text-right persian" style={{ color: 'var(--tg-theme-text-color)' }}>
                      <PersianText>{currentCard.meaning}</PersianText>
                    </div>
                  </div>

                  {/* English Definition */}
                  {currentCard.definition && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: 'var(--tg-theme-hint-color)' }}>
                        Definition
                      </span>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--tg-theme-text-color)' }}>
                        {currentCard.definition}
                      </p>
                    </div>
                  )}

                  {/* Examples */}
                  {currentCard.examples && currentCard.examples.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                        Example Sentences
                      </span>
                      <ul className="space-y-1.5">
                        {currentCard.examples.slice(0, 2).map((example, idx) => (
                          <li key={idx} className="text-xs leading-relaxed pl-2.5 border-l-2 relative" style={{ color: 'var(--tg-theme-hint-color)', borderColor: 'var(--tg-theme-button-color)' }}>
                            {typeof example === 'string' ? example : example.text || example.sentence || ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Grading options */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
                  <button
                    onClick={() => handleReviewAnswer(false)}
                    className="py-3 px-4 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                    style={{ background: 'var(--tg-theme-destructive-text-color, #e53935)' }}
                  >
                    <span>❌ No</span>
                  </button>
                  <button
                    onClick={() => handleReviewAnswer(true)}
                    className="py-3 px-4 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 hover:bg-emerald-700"
                  >
                    <span>✅ Yes</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Hotkeys helper for desktop testers */}
        <div className="hidden sm:flex justify-center items-center gap-4 text-[10px] mt-4 py-1.5 px-3 rounded-full bg-[color-mix(in srgb,var(--tg-theme-hint-color)_6%,transparent)] text-[var(--tg-theme-hint-color)] max-w-sm mx-auto">
          <div className="flex items-center gap-1">
            <span className="kbd-shortcut">Space</span> Flip
          </div>
          <div className="flex items-center gap-1">
            <span className="kbd-shortcut">H</span> Hint
          </div>
          <div className="flex items-center gap-1">
            <span className="kbd-shortcut">1</span> Wrong
          </div>
          <div className="flex items-center gap-1">
            <span className="kbd-shortcut">2</span> Correct
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard / main page ──
  return (
    <div className="tg-page px-4 pt-4 bg-[var(--tg-theme-secondary-bg-color)]">
      
      {/* Redesigned Premium Header Title Block */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[color-mix(in srgb,var(--tg-theme-button-color,#3390ec)_12%,transparent)]" style={{ color: 'var(--tg-theme-button-color)' }}>
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight" style={{ color: 'var(--tg-theme-text-color)' }}>
              Leitner Box
            </h1>
            <p className="text-[10px]" style={{ color: 'var(--tg-theme-hint-color)' }}>
              Spaced Repetition System
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddCustomWord(true)}
          className="p-2 rounded-xl border flex items-center justify-center transition-all bg-[var(--tg-theme-bg-color)] active:scale-95"
          style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}
          title="Add Custom Word"
        >
          <Plus className="w-5 h-5" style={{ color: 'var(--tg-theme-button-color)' }} />
        </button>
      </div>

      {/* Main Review CTA Widget */}
      {dueFlashcards.length > 0 && (
        <div className="mb-5 p-4 rounded-2xl flex items-center justify-between shadow-md border relative overflow-hidden bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30">
          <div className="space-y-1.5 flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-600 animate-bounce" />
              <span className="text-xs font-black uppercase tracking-wider text-cyan-700">Cards Due</span>
            </div>
            <p className="text-sm font-extrabold" style={{ color: 'var(--tg-theme-text-color)' }}>
              You have {dueFlashcards.length} word{dueFlashcards.length > 1 ? 's' : ''} ready to review!
            </p>
            <p className="text-[10px]" style={{ color: 'var(--tg-theme-hint-color)' }}>
              Recall now to push them to higher boxes.
            </p>
          </div>
          <button
            onClick={startStudyMode}
            className="flex-shrink-0 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-lg active:scale-95 hover:shadow-xl transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span className="text-xs uppercase tracking-wide">Review</span>
          </button>
        </div>
      )}

      {/* Glassmorphic Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          
          <div className="tg-card p-3 border shadow-sm flex items-center gap-3" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tg-theme-hint-color)' }}>Total Cards</p>
              <h3 className="text-base font-black" style={{ color: 'var(--tg-theme-text-color)' }}>{stats.totalCards}</h3>
            </div>
          </div>

          <div className="tg-card p-3 border shadow-sm flex items-center gap-3" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tg-theme-hint-color)' }}>Due Today</p>
              <h3 className="text-base font-black" style={{ color: 'var(--tg-theme-text-color)' }}>{stats.dueCards}</h3>
            </div>
          </div>

          <div className="tg-card p-3 border shadow-sm flex items-center gap-3" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tg-theme-hint-color)' }}>Accuracy</p>
              <h3 className="text-base font-black" style={{ color: 'var(--tg-theme-text-color)' }}>{stats.averageAccuracy}%</h3>
            </div>
          </div>

          <div className="tg-card p-3 border shadow-sm flex items-center gap-3" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tg-theme-hint-color)' }}>Custom</p>
              <h3 className="text-base font-black" style={{ color: 'var(--tg-theme-text-color)' }}>{stats.customWords}</h3>
            </div>
          </div>

        </div>
      )}

      {/* Segmented Control Tabs */}
      <div className="mb-5">
        <div className="flex p-1 rounded-xl gap-1 bg-[var(--tg-theme-secondary-bg-color)] border" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
          {[
            { id: 'overview', label: 'Distribution', icon: Layers },
            { id: 'due', label: `Due (${dueFlashcards.length})`, icon: Clock },
            { id: 'all', label: 'All Cards', icon: BookOpen }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-150"
                style={
                  isActive
                    ? {
                        background: 'var(--tg-theme-bg-color, #ffffff)',
                        color: 'var(--tg-theme-button-color, #3390ec)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                      }
                    : {
                        color: 'var(--tg-theme-hint-color, #707579)'
                      }
                }
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ── */}

      {activeTab === 'overview' && stats && (
        <div className="space-y-3 pb-6">
          {/* Interactive Boxes Visualization Grid */}
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3, 4, 5].map((boxNum) => {
              const details = getBoxDetails(boxNum);
              const percentage = stats.totalCards > 0 ? Math.round((details.totalCount / stats.totalCards) * 100) : 0;
              
              return (
                <div
                  key={boxNum}
                  className={`tg-card p-4 border shadow-sm flex flex-col justify-between transition-all duration-200 box-glow-${boxNum} hover:scale-[1.01]`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider box-badge-${boxNum}`}>
                          Box {boxNum}
                        </span>
                        <span className="text-[10px] font-bold" style={{ color: 'var(--tg-theme-hint-color)' }}>
                          Interval: {details.interval}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold" style={{ color: 'var(--tg-theme-text-color)' }}>
                        {details.name}
                      </h4>
                      <p className="text-[10px] leading-tight max-w-[85%]" style={{ color: 'var(--tg-theme-hint-color)' }}>
                        {details.desc}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black" style={{ color: details.color }}>
                        {details.totalCount} card{details.totalCount !== 1 ? 's' : ''}
                      </div>
                      {details.dueCount > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 animate-pulse mt-0.5">
                          {details.dueCount} due
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Custom progress bar */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-[9px] font-semibold mb-1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                      <span>Distribution</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-[color-mix(in srgb,var(--tg-theme-secondary-bg-color,#f4f4f5)_80%,transparent)]">
                      <div
                        className={`h-full rounded-full box-progress-${boxNum}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'due' && (
        <div className="space-y-3 pb-6">
          {dueFlashcards.length === 0 ? (
            <div className="tg-card p-8 text-center border shadow-sm" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-500" />
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--tg-theme-text-color)' }}>All Cards Cleared!</h3>
              <p className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>Great job! Check back later or add new words to study.</p>
            </div>
          ) : (
            <FlashcardList 
              flashcards={dueFlashcards} 
              onDelete={handleDeleteFlashcard}
              showDueInfo={true}
            />
          )}
        </div>
      )}

      {activeTab === 'all' && (
        <div className="space-y-3 pb-6">
          {flashcards.length === 0 ? (
            <div className="tg-card p-8 text-center border shadow-sm" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--tg-theme-hint-color)' }} />
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--tg-theme-text-color)' }}>Leitner Box is Empty</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--tg-theme-hint-color)' }}>
                Add words from lesson pages or create custom ones here.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setShowAddCustomWord(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-xs font-bold"
                >
                  Add Custom Word
                </button>
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

      {/* Add Custom Word Modal Component */}
      {showAddCustomWord && (
        <AddCustomWordModal
          onClose={() => setShowAddCustomWord(false)}
          onAdd={loadLeitnerData}
        />
      )}

    </div>
  );
};

// ── Redesigned Flashcard List Row Item ──
const FlashcardList = ({ flashcards, onDelete, showDueInfo = false }) => {
  return (
    <div className="tg-card border shadow-sm overflow-hidden" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
      <div className="divide-y" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
        {flashcards.map((flashcard) => (
          <div
            key={flashcard.id}
            className="p-3.5 flex items-center justify-between hover:bg-[color-mix(in srgb,var(--tg-theme-secondary-bg-color,#f4f4f5)_30%,transparent)] transition-all duration-150"
          >
            <div className="flex-1 min-w-0 pr-3">
              {/* Word, custom badge, box indicator */}
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                <h3 className="text-sm font-black truncate" style={{ color: 'var(--tg-theme-text-color)' }}>
                  {flashcard.word}
                </h3>
                
                {flashcard.isCustomWord && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide bg-blue-500/10 text-blue-600">
                    Custom
                  </span>
                )}

                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide box-badge-${flashcard.box}`}>
                  Box {flashcard.box}
                </span>
              </div>
              
              {/* Persian meaning translation */}
              <p className="text-xs truncate mb-1.5 text-right persian" style={{ color: 'var(--tg-theme-text-color)' }}>
                <PersianText as="span">{flashcard.meaning}</PersianText>
              </p>
              
              {/* Review metrics */}
              <div className="flex items-center gap-2.5 text-[9px] font-semibold" style={{ color: 'var(--tg-theme-hint-color)' }}>
                <span>Reviews: {flashcard.reviewCount || 0}</span>
                <span>Accuracy: {
                  flashcard.reviewCount > 0
                    ? Math.round(((flashcard.correctCount || 0) / flashcard.reviewCount) * 100)
                    : 0
                }%</span>
                {showDueInfo ? (
                  <span className="font-extrabold text-orange-600 animate-pulse">
                    Due Now
                  </span>
                ) : (
                  <span className="truncate">
                    Next: {formatDistanceToNow(flashcard.nextReviewDate, { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => onDelete(flashcard.id)}
              className="p-1.5 rounded-xl hover:bg-[color-mix(in srgb,var(--tg-theme-destructive-text-color,#e53935)_12%,transparent)] transition-all duration-150 flex-shrink-0"
              style={{ color: 'var(--tg-theme-hint-color)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--tg-theme-destructive-text-color, #e53935)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--tg-theme-hint-color)'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Redesigned Custom Word Modal ──
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
      toast.success('Word added to Leitner Box!');
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="rounded-2xl border shadow-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto"
           style={{ background: 'var(--tg-theme-bg-color)', borderColor: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-text-color)' }}>
        <div className="p-5">
          
          <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
            <h2 className="text-base font-black" style={{ color: 'var(--tg-theme-text-color)' }}>Add Custom Word</h2>
            <button
              onClick={onClose}
              className="text-xl font-bold leading-none p-1 hover:opacity-75"
              style={{ color: 'var(--tg-theme-hint-color)' }}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                Word (English) *
              </label>
              <input
                type="text"
                value={formData.word}
                onChange={(e) => setFormData(prev => ({ ...prev, word: e.target.value }))}
                className="input"
                placeholder="Enter English word"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                Meaning (Persian) *
              </label>
              <input
                type="text"
                value={formData.meaning}
                onChange={(e) => setFormData(prev => ({ ...prev, meaning: e.target.value }))}
                className="input text-right persian"
                placeholder="معنی فارسی را وارد کنید"
                dir="rtl"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                Pronunciation Accent
              </label>
              <input
                type="text"
                value={formData.pronunciation}
                onChange={(e) => setFormData(prev => ({ ...prev, pronunciation: e.target.value }))}
                className="input"
                placeholder="e.g. /ˌæn.tiˈɡræv.ə.ti/"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                Definition (English)
              </label>
              <textarea
                value={formData.definition}
                onChange={(e) => setFormData(prev => ({ ...prev, definition: e.target.value }))}
                className="input h-auto min-h-[4rem] py-1.5"
                rows="2"
                placeholder="English description..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                Examples
              </label>
              {formData.examples.map((example, index) => (
                <div key={index} className="mb-1.5">
                  <input
                    type="text"
                    value={example}
                    onChange={(e) => updateExample(index, e.target.value)}
                    className="input text-xs"
                    placeholder={`Example sentence ${index + 1}`}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addExample}
                className="text-[10px] font-bold tracking-wide transition-opacity hover:opacity-80"
                style={{ color: 'var(--tg-theme-button-color)' }}
              >
                + Add Another Example
              </button>
            </div>

            <div className="flex gap-3 pt-3 border-t" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all bg-[var(--tg-theme-bg-color)]"
                style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add to Box'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default LeitnerBoxPage;
