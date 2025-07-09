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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link 
              to={`/lessons/${word.lessonNumber}`}
              className="btn btn-outline btn-sm flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to {word.lessonName}</span>
            </Link>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {word.word}
              </h1>
              <p className="text-gray-600">
                {word.lessonName} • Word {word.priority}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg">
          <WordCard word={word} />
        </div>
      </div>
    </div>
  );
};

export default WordDetailPage;
