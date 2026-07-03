import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { wordsService } from '../services/firebaseService';
import { ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import WordCard from '../components/WordCard';

const WordDetailPage = () => {
  const { wordId } = useParams();
  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWord = async () => {
      try {
        setLoading(true);
        const wordData = await wordsService.getWordById(wordId);
        if (wordData) {
          setWord(wordData);
        } else {
          setError('Word not found');
        }
      } catch (error) {
        console.error('Error fetching word:', error);
        setError('Failed to load word');
      } finally {
        setLoading(false);
      }
    };

    if (wordId) {
      fetchWord();
    }
  }, [wordId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !word) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error || 'Word not found'}</div>
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
          to={`/lessons/${word.lessonNumber}`} 
          className="flex items-center text-sm font-semibold gap-1"
          style={{ color: 'var(--tg-theme-button-color, #3390ec)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <span className="text-sm font-bold" style={{ color: 'var(--tg-theme-text-color)' }}>
          Word Details
        </span>
        <div className="w-12 h-4"></div> {/* Balance flexbox spacing */}
      </div>

      {/* Page Content Title Block */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--tg-theme-text-color)' }}>
          {word.word}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--tg-theme-hint-color)' }}>
          {word.lessonName} • Word {word.priority}
        </p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="tg-card shadow-lg border overflow-hidden" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
          <WordCard word={word} />
        </div>
      </div>
    </div>
  );
};

export default WordDetailPage;
