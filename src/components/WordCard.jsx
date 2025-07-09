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
import { playAudio, cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { leitnerService } from '../services/firebaseService';
import toast from 'react-hot-toast';

const WordCard = ({ word }) => {
  const { user } = useAuth();
  const [currentAudio, setCurrentAudio] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [selectedAccent, setSelectedAccent] = useState('american');
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isInLeitnerBox, setIsInLeitnerBox] = useState(false);
  const [addingToLeitner, setAddingToLeitner] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);

  const handlePlayAudio = (audioUrl, audioId) => {
    if (playingAudio === audioId) {
      if (currentAudio) {
        currentAudio.pause();
        setPlayingAudio(null);
      }
      return;
    }

    if (currentAudio) {
      currentAudio.pause();
    }

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setPlayingAudio(null);
        setCurrentAudio(null);
      };
      audio.onerror = () => {
        setPlayingAudio(null);
        setCurrentAudio(null);
      };
      
      audio.play().then(() => {
        setCurrentAudio(audio);
        setPlayingAudio(audioId);
      }).catch(console.error);
    }
  };

  const getAccentAudio = () => {
    if (selectedAccent === 'british' && word.accents?.british) {
      return word.accents.british;
    }
    return word.accents?.american || word.media?.pronunciation;
  };

  const getVideoEmbedUrl = (url) => {
    if (!url || !url.trim()) return null;
    
    // Convert YouTube watch URLs to embed URLs
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    
    // Convert YouTube short URLs to embed URLs
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    
    // For direct video files or other URLs, return as-is
    // The iframe will attempt to load it, and we'll handle errors gracefully
    return url;
  };

  const isEmbeddableVideo = (url) => {
    if (!url || !url.trim()) return false;
    
    // Check if it's a known embeddable platform
    const embeddablePlatforms = [
      'youtube.com', 'www.youtube.com', 'youtu.be',
      'vimeo.com', 'player.vimeo.com',
      'dailymotion.com'
    ];
    
    try {
      const validUrl = new URL(url);
      return embeddablePlatforms.some(platform => validUrl.hostname.includes(platform));
    } catch {
      return false;
    }
  };

  const isValidVideoUrl = (url) => {
    if (!url || !url.trim()) return false;
    
    try {
      const validUrl = new URL(url);
      
      // Check for common video hosting domains
      const commonVideoHosts = [
        'youtube.com', 'www.youtube.com', 'youtu.be',
        'vimeo.com', 'player.vimeo.com',
        'dailymotion.com', 'dai.ly'
      ];
      
      // Check for direct video file extensions
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.m4v'];
      const hasVideoExtension = videoExtensions.some(ext => 
        validUrl.pathname.toLowerCase().includes(ext)
      );
      
      // Accept if it's a known video host OR has video extension
      return (
        commonVideoHosts.some(domain => validUrl.hostname.includes(domain)) ||
        hasVideoExtension
      );
    } catch {
      return false;
    }
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && selectedVideo) {
        setSelectedVideo(null);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedVideo]);

  // Reset video error when selecting a new video
  useEffect(() => {
    if (selectedVideo) {
      setVideoLoadError(false);
      setVideoLoading(true);
      
      // Set a timeout to show fallback if video doesn't load
      const timeout = setTimeout(() => {
        setVideoLoading(false);
        setVideoLoadError(true);
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [selectedVideo]);

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
    { id: 'examples', label: 'Examples', icon: FileText },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'more', label: 'More', icon: MoreHorizontal }
  ];

  // Filter tabs based on available content
  const availableTabs = tabs.filter(tab => {
    if (tab.id === 'examples') return word.examples && word.examples.length > 0;
    if (tab.id === 'videos') return word.videos && word.videos.length > 0;
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    English Definition
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {word.englishExplanation}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Persian Translation
                </h3>
                <p className="text-gray-700 leading-relaxed text-right font-persian" dir="rtl">
                  {word.persianTranslation}
                </p>
              </div>
            </div>
          </div>
        );

      case 'examples':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Examples</h3>
            {word.examples && word.examples.length > 0 ? (
              <div className="space-y-4">
                {word.examples.map((example) => (
                  <div key={example.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-900 mb-2">
                          "{example.text}"
                        </p>
                        <p className="text-gray-600 text-sm text-right font-persian" dir="rtl">
                          {example.translation}
                        </p>
                      </div>
                      {example.audioUrl && (
                        <button
                          onClick={() => handlePlayAudio(example.audioUrl, `example-${example.id}`)}
                          className="btn btn-outline btn-sm rounded-full w-8 h-8 p-0 ml-3"
                        >
                          {playingAudio === `example-${example.id}` ? (
                            <Pause className="w-3 h-3" />
                          ) : (
                            <Volume2 className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No examples available</p>
            )}
          </div>
        );

      case 'videos':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Examples</h3>
            {word.videos && word.videos.length > 0 ? (
              <div className="space-y-4">
                {(showAllVideos ? word.videos : word.videos.slice(0, 3)).map((video) => (
                  <div key={video.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-900 mb-2">
                          "{video.englishSubtitle}"
                        </p>
                        <p className="text-gray-600 text-sm text-right font-persian" dir="rtl">
                          {video.persianSubtitle}
                        </p>
                      </div>
                      {isValidVideoUrl(video.videoUrl) && (
                        <button
                          onClick={() => setSelectedVideo(video)}
                          className="btn btn-primary btn-sm rounded-full w-8 h-8 p-0"
                          title="Play video"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {word.videos.length > 3 && (
                  <div className="text-center">
                    <button 
                      onClick={() => setShowAllVideos(!showAllVideos)}
                      className="btn btn-outline btn-sm"
                    >
                      {showAllVideos 
                        ? 'Show Less Videos' 
                        : `View ${word.videos.length - 3} More Videos`
                      }
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No videos available</p>
            )}
          </div>
        );

      case 'more':
        return (
          <div className="space-y-6">
            {/* Synonyms */}
            {word.synonyms && word.synonyms.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Synonyms</h4>
                <div className="flex flex-wrap gap-2">
                  {word.synonyms.map((synonym, index) => (
                    <span
                      key={index}
                      className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {synonym}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Image */}
            {word.media?.image && (
              <div className="text-center">
                <h4 className="font-medium text-gray-900 mb-4">Visual</h4>
                <img
                  src={word.media.image}
                  alt={word.word}
                  className="max-w-xs mx-auto rounded-lg shadow-sm"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {!word.synonyms?.length && !word.media?.image && (
              <p className="text-gray-500 text-center py-8">No additional content available</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Word Header - Always visible */}
      <div className="p-6 space-y-4 bg-white border-b border-gray-200">
        <div className="text-center space-y-4">
          {/* Word Title - Same for both mobile and desktop */}
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              {word.word}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mt-1">
              {word.spell}
            </p>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => {
                const audioUrl = word.accents?.american || word.media?.pronunciation;
                if (audioUrl) {
                  handlePlayAudio(audioUrl, 'american');
                }
              }}
              className={cn(
                "btn btn-sm flex items-center space-x-2",
                playingAudio === 'american' ? 'btn-primary' : 'btn-outline'
              )}
              disabled={!word.accents?.american && !word.media?.pronunciation}
            >
              {playingAudio === 'american' ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>American</span>
            </button>
            <button
              onClick={() => {
                const audioUrl = word.accents?.british;
                if (audioUrl) {
                  handlePlayAudio(audioUrl, 'british');
                }
              }}
              className={cn(
                "btn btn-sm flex items-center space-x-2",
                playingAudio === 'british' ? 'btn-primary' : 'btn-outline'
              )}
              disabled={!word.accents?.british}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                English Definition
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {word.englishExplanation}
              </p>
            </div>

            {/* Synonyms */}
            {word.synonyms && word.synonyms.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Synonyms</h4>
                <div className="flex flex-wrap gap-2">
                  {word.synonyms.map((synonym, index) => (
                    <span
                      key={index}
                      className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {synonym}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Persian Translation
            </h3>
            <p className="text-gray-700 leading-relaxed text-right font-persian" dir="rtl">
              {word.persianTranslation}
            </p>
          </div>
        </div>

        {/* Examples */}
        {word.examples && word.examples.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Examples</h3>
            <div className="space-y-4">
              {word.examples.map((example) => (
                <div key={example.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900 mb-2">
                        "{example.text}"
                      </p>
                      <p className="text-gray-600 text-sm text-right font-persian" dir="rtl">
                        {example.translation}
                      </p>
                    </div>
                    {example.audioUrl && (
                      <button
                        onClick={() => handlePlayAudio(example.audioUrl, `example-${example.id}`)}
                        className="btn btn-outline btn-sm rounded-full w-8 h-8 p-0 ml-3"
                      >
                        {playingAudio === `example-${example.id}` ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Videos */}
        {word.videos && word.videos.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Examples</h3>
            <div className="space-y-4">
              {(showAllVideos ? word.videos : word.videos.slice(0, 3)).map((video) => (
                <div key={video.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900 mb-2">
                        "{video.englishSubtitle}"
                      </p>
                      <p className="text-gray-600 text-sm text-right font-persian" dir="rtl">
                        {video.persianSubtitle}
                      </p>
                    </div>
                    {isValidVideoUrl(video.videoUrl) && (
                      <button
                        onClick={() => setSelectedVideo(video)}
                        className="btn btn-primary btn-sm rounded-full w-8 h-8 p-0"
                        title="Play video"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {word.videos.length > 3 && (
                <div className="text-center">
                  <button 
                    onClick={() => setShowAllVideos(!showAllVideos)}
                    className="btn btn-outline btn-sm"
                  >
                    {showAllVideos 
                      ? 'Show Less Videos' 
                      : `View ${word.videos.length - 3} More Videos`
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image */}
        {word.media?.image && (
          <div className="text-center">
            <img
              src={word.media.image}
              alt={word.word}
              className="max-w-xs mx-auto rounded-lg shadow-sm"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Mobile View - Tabbed content */}
      <div className="md:hidden flex flex-col flex-1">
        {/* Mobile Tab Headers */}
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex space-x-1 overflow-x-auto">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    isActive 
                      ? "bg-primary-100 text-primary-700 border border-primary-200" 
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-4 h-4" />
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

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedVideo(null)}>
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Video Example</h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="btn btn-outline btn-sm rounded-full w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="aspect-video mb-4">
                {!videoLoadError && selectedVideo.videoUrl && selectedVideo.videoUrl.trim() ? (
                  <iframe
                    src={getVideoEmbedUrl(selectedVideo.videoUrl)}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Video Example"
                    onLoad={() => {
                      setVideoLoading(false);
                      setVideoLoadError(false);
                    }}
                    onError={() => {
                      console.error('Failed to load video:', selectedVideo.videoUrl);
                      setVideoLoading(false);
                      setVideoLoadError(true);
                    }}
                  ></iframe>
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-lg flex flex-col items-center justify-center space-y-4">
                    <div className="text-center">
                      {videoLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
                          <p className="text-gray-600 mb-2">Loading video...</p>
                        </>
                      ) : (
                        <>
                          <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-2">
                            {!selectedVideo.videoUrl || !selectedVideo.videoUrl.trim() 
                              ? "No video URL available" 
                              : videoLoadError 
                                ? "Failed to load video" 
                                : "This video cannot be embedded"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-gray-900">
                  "{selectedVideo.englishSubtitle}"
                </p>
                <p className="text-gray-600 text-right font-persian" dir="rtl">
                  {selectedVideo.persianSubtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Leitner Button */}
      {user && (
        <div className="fixed bottom-20 left-6 z-30">
          <button
            onClick={handleAddToLeitnerBox}
            disabled={isInLeitnerBox || addingToLeitner}
            className={cn(
              "rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors",
              isInLeitnerBox
                ? "bg-green-600 text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            )}
            title={isInLeitnerBox ? "Already in Leitner box" : "Add to Leitner box"}
          >
            {addingToLeitner ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : isInLeitnerBox ? (
              <Check className="w-6 h-6" />
            ) : (
              <Brain className="w-6 h-6" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default WordCard;
