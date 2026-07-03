import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause,
  Globe,
  BookOpen,
  Star,
  ExternalLink,
  X,
  FileText,
  Video,
  MoreHorizontal,
  Brain,
  Check
} from 'lucide-react';
import { playSpeech, cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { leitnerService } from '../services/firebaseService';
import toast from 'react-hot-toast';

const WordCard = ({ word }) => {
  const { user } = useAuth();
  const [playingAudio, setPlayingAudio] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isInLeitnerBox, setIsInLeitnerBox] = useState(false);
  const [addingToLeitner, setAddingToLeitner] = useState(false);

  const handleSpeak = (text, accent, audioId) => {
    if (playingAudio === audioId) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingAudio(null);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      const lang = accent === 'british' ? 'en-GB' : 'en-US';
      utterance.lang = lang;
      
      const voices = window.speechSynthesis.getVoices();
      let voice = voices.find(v => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase());
      if (!voice) {
        const region = lang.split('-')[1]?.toLowerCase();
        if (region) {
          voice = voices.find(v => {
            const vLang = v.lang.replace('_', '-').toLowerCase();
            return vLang.startsWith('en-') && (vLang.includes(region) || (region === 'gb' && vLang.includes('uk')));
          });
        }
      }
      if (!voice) {
        voice = voices.find(v => v.lang.toLowerCase().startsWith(lang.split('-')[0].toLowerCase()));
      }
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.rate = 0.85;
      
      utterance.onstart = () => {
        setPlayingAudio(audioId);
      };
      
      utterance.onend = () => {
        setPlayingAudio(null);
      };
      
      utterance.onerror = () => {
        setPlayingAudio(null);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };



  // Check if word is already in Leitner box
  useEffect(() => {
    const checkLeitnerStatus = async () => {
      if (user && word?.id && word.word) {
        try {
          const isInBox = await leitnerService.isWordInLeitnerBox(user.uid, word.id);
          setIsInLeitnerBox(isInBox);
        } catch (error) {
          console.error('Error checking Leitner status:', error);
        }
      }
    };
    
    checkLeitnerStatus();
  }, [user, word?.id]);

  const handleAddToLeitnerBox = async () => {
    if (!user || !word || addingToLeitner) return;
    
    try {
      setAddingToLeitner(true);
      
      const wordDataForLeitner = {
        id: word.id,
        word: word.word || '',
        meaning: word.persianTranslation || word.meaning || '',
        pronunciation: word.accents?.american || word.media?.pronunciation || '',
        definition: word.englishExplanation || word.definition || '',
        synonyms: Array.isArray(word.synonyms) ? word.synonyms : [],
        antonyms: Array.isArray(word.antonyms) ? word.antonyms : [],
        examples: Array.isArray(word.examples) ? word.examples : []
      };
      
      await leitnerService.addToLeitnerBox(user.uid, wordDataForLeitner);
      setIsInLeitnerBox(true);
      toast.success('Word added to Leitner box!');
    } catch (error) {
      console.error('Error adding to Leitner box:', error);
      toast.error('Failed to add word to Leitner box');
    } finally {
      setAddingToLeitner(false);
    }
  };

  // Mobile tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'examples', label: 'Examples', icon: FileText }
  ];

  // Filter tabs based on available content
  const availableTabs = tabs.filter(tab => {
    if (tab.id === 'examples') return word.examples && word.examples.length > 0;
    return true;
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Definitions */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center" style={{ color: 'var(--tg-theme-text-color)' }}>
                    <BookOpen className="w-5 h-5 mr-2" style={{ color: 'var(--tg-theme-button-color)' }} />
                    English Definition
                  </h3>
                  <p className="leading-relaxed" style={{ color: 'var(--tg-theme-text-color)' }}>
                    {word.englishExplanation}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center" style={{ color: 'var(--tg-theme-text-color)' }}>
                  <Globe className="w-5 h-5 mr-2" style={{ color: 'var(--tg-theme-button-color)' }} />
                  Persian Translation
                </h3>
                <p className="leading-relaxed text-right font-persian" dir="rtl" style={{ color: 'var(--tg-theme-text-color)' }}>
                  {word.persianTranslation}
                </p>
              </div>

              {/* Synonyms & Antonyms */}
              {((word.synonyms && word.synonyms.length > 0) || (word.antonyms && word.antonyms.length > 0)) && (
                <div className="border-t pt-4 space-y-4" style={{ borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
                  {word.synonyms && word.synonyms.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--tg-theme-text-color)' }}>Synonyms</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {word.synonyms.map((synonym, index) => (
                          <span
                            key={index}
                            className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium"
                            style={{
                              background: 'color-mix(in srgb, var(--tg-theme-button-color, #3390ec) 10%, transparent)',
                              color: 'var(--tg-theme-button-color, #3390ec)'
                            }}
                          >
                            {synonym}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {word.antonyms && word.antonyms.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--tg-theme-text-color)' }}>Antonyms</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {word.antonyms.map((antonym, index) => (
                          <span
                            key={index}
                            className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium"
                            style={{
                              background: 'color-mix(in srgb, var(--tg-theme-destructive-text-color, #e53935) 10%, transparent)',
                              color: 'var(--tg-theme-destructive-text-color, #e53935)'
                            }}
                          >
                            {antonym}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'examples':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--tg-theme-text-color)' }}>Examples</h3>
            {word.examples && word.examples.length > 0 ? (
              <div className="space-y-4">
                {word.examples.map((example) => (
                  <div key={example.id} className="rounded-xl p-4" style={{ background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)' }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="mb-2" style={{ color: 'var(--tg-theme-text-color)' }}>
                          "{example.text}"
                        </p>
                        <p className="text-sm text-right font-persian" dir="rtl" style={{ color: 'var(--tg-theme-hint-color)' }}>
                          {example.translation}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSpeak(example.text, 'american', `example-${example.id}`)}
                        className="btn btn-outline btn-sm rounded-full w-8 h-8 p-0 ml-3 flex items-center justify-center"
                      >
                        {playingAudio === `example-${example.id}` ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8" style={{ color: 'var(--tg-theme-hint-color)' }}>No examples available</p>
            )}
          </div>
        );



      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ color: 'var(--tg-theme-text-color)' }}>
      {/* Word Header - Always visible */}
      <div className="p-6 space-y-4 border-b" style={{ background: 'var(--tg-theme-bg-color)', borderColor: 'var(--tg-theme-secondary-bg-color)' }}>
        <div className="text-center space-y-4">
          {/* Word Title - Same for both mobile and desktop */}
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: 'var(--tg-theme-text-color)' }}>
              {word.word}
            </h1>
            <p className="text-base sm:text-lg mt-1" style={{ color: 'var(--tg-theme-hint-color)' }}>
              {word.spell}
            </p>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => handleSpeak(word.word, 'american', 'american')}
              className={cn(
                "btn btn-sm flex items-center space-x-2",
                playingAudio === 'american' ? 'btn-primary' : 'btn-outline'
              )}
            >
              {playingAudio === 'american' ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>American</span>
            </button>
            <button
              onClick={() => handleSpeak(word.word, 'british', 'british')}
              className={cn(
                "btn btn-sm flex items-center space-x-2",
                playingAudio === 'british' ? 'btn-primary' : 'btn-outline'
              )}
            >
              {playingAudio === 'british' ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>British</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop View - Full content */}
      <div className="hidden md:block p-6 space-y-6 flex-1 overflow-auto">
        {/* Definitions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center" style={{ color: 'var(--tg-theme-text-color)' }}>
                <BookOpen className="w-5 h-5 mr-2" style={{ color: 'var(--tg-theme-button-color)' }} />
                English Definition
              </h3>
              <p className="leading-relaxed" style={{ color: 'var(--tg-theme-text-color)' }}>
                {word.englishExplanation}
              </p>
            </div>

            {/* Synonyms */}
            {word.synonyms && word.synonyms.length > 0 && (
              <div>
                <h4 className="font-medium mb-2" style={{ color: 'var(--tg-theme-text-color)' }}>Synonyms</h4>
                <div className="flex flex-wrap gap-2">
                  {word.synonyms.map((synonym, index) => (
                    <span
                      key={index}
                      className="inline-block px-3 py-1 rounded-full text-sm"
                      style={{
                        background: 'color-mix(in srgb, var(--tg-theme-button-color, #3390ec) 12%, transparent)',
                        color: 'var(--tg-theme-button-color, #3390ec)'
                      }}
                    >
                      {synonym}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Antonyms */}
            {word.antonyms && word.antonyms.length > 0 && (
              <div>
                <h4 className="font-medium mb-2" style={{ color: 'var(--tg-theme-text-color)' }}>Antonyms</h4>
                <div className="flex flex-wrap gap-2">
                  {word.antonyms.map((antonym, index) => (
                    <span
                      key={index}
                      className="inline-block px-3 py-1 rounded-full text-sm"
                      style={{
                        background: 'color-mix(in srgb, var(--tg-theme-destructive-text-color, #e53935) 12%, transparent)',
                        color: 'var(--tg-theme-destructive-text-color, #e53935)'
                      }}
                    >
                      {antonym}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center" style={{ color: 'var(--tg-theme-text-color)' }}>
              <Globe className="w-5 h-5 mr-2" style={{ color: 'var(--tg-theme-button-color)' }} />
              Persian Translation
            </h3>
            <p className="leading-relaxed text-right font-persian" dir="rtl" style={{ color: 'var(--tg-theme-text-color)' }}>
              {word.persianTranslation}
            </p>
          </div>
        </div>

        {/* Examples */}
        {word.examples && word.examples.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--tg-theme-text-color)' }}>Examples</h3>
            <div className="space-y-4">
              {word.examples.map((example) => (
                <div key={example.id} className="rounded-xl p-4" style={{ background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="mb-2" style={{ color: 'var(--tg-theme-text-color)' }}>
                        "{example.text}"
                      </p>
                      <p className="text-sm text-right font-persian" dir="rtl" style={{ color: 'var(--tg-theme-hint-color)' }}>
                        {example.translation}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSpeak(example.text, 'american', `example-${example.id}`)}
                      className="btn btn-outline btn-sm rounded-full w-8 h-8 p-0 ml-3 flex items-center justify-center"
                    >
                      {playingAudio === `example-${example.id}` ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}




      </div>

      {/* Mobile View - Tabbed content */}
      <div className="md:hidden flex flex-col flex-1">
        {/* Mobile Tab Headers - Segmented Control */}
        <div className="px-4 py-3">
          <div className="flex p-1 rounded-xl gap-1 no-scrollbar overflow-x-auto" style={{ background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)' }}>
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150"
                  style={
                    isActive
                      ? {
                          background: 'var(--tg-theme-bg-color, #ffffff)',
                          color: 'var(--tg-theme-button-color, #3390ec)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                        }
                      : {
                          color: 'var(--tg-theme-hint-color, #707579)'
                        }
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-4">
          {renderTabContent()}
        </div>
      </div>



      {user && (
        <div className="fixed bottom-20 left-6 z-30">
          <button
            onClick={handleAddToLeitnerBox}
            disabled={isInLeitnerBox || addingToLeitner}
            className="rounded-full px-4 h-11 flex items-center justify-center gap-1.5 shadow-lg transition-all duration-150 active:scale-95 text-xs font-black uppercase tracking-wider"
            style={
              isInLeitnerBox
                ? { backgroundColor: '#16a34a', color: '#ffffff' }
                : { backgroundColor: 'var(--tg-theme-button-color, #3390ec)', color: 'var(--tg-theme-button-text-color, #ffffff)' }
            }
            title={isInLeitnerBox ? "Already in Leitner box" : "Add to Leitner box"}
          >
            {addingToLeitner ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Adding...</span>
              </>
            ) : isInLeitnerBox ? (
              <>
                <Check className="w-4 h-4" />
                <span>In Leitner</span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                <span>Add to Leitner</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default WordCard;
