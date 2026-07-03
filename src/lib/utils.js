import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatScore = (score) => {
  // Handle undefined, null, or NaN values
  if (score === undefined || score === null || isNaN(score)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(score);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const generateLessonId = (lessonNumber) => {
  return `lesson-${lessonNumber.toString().padStart(2, '0')}`;
};

export const generateWordId = (wordId) => {
  return `word-${wordId}`;
};

export const playAudio = (audioUrl) => {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(console.error);
  }
};

export const playSpeech = (text, lang = 'en-US') => {
  if (!text) return;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    // Attempt to select voice matching target language/region
    const voices = window.speechSynthesis.getVoices();
    
    // 1. Try to find an exact match for the language code + country code (e.g. en-US, en-GB)
    let voice = voices.find(v => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase());
    
    // 2. If not found, try to find a voice that contains the specific country indicator (e.g. 'us' or 'gb' / 'uk')
    if (!voice) {
      const region = lang.split('-')[1]?.toLowerCase();
      if (region) {
        voice = voices.find(v => {
          const vLang = v.lang.replace('_', '-').toLowerCase();
          return vLang.startsWith('en-') && (vLang.includes(region) || (region === 'gb' && vLang.includes('uk')));
        });
      }
    }
    
    // 3. Fallback to any voice starting with the language code (e.g. 'en')
    if (!voice) {
      voice = voices.find(v => v.lang.toLowerCase().startsWith(lang.split('-')[0].toLowerCase()));
    }

    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = 0.85; // Slower pace for clarity
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn('Web Speech API (speechSynthesis) is not supported.');
  }
};

// Pre-load voices on load
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
}

export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const calculateProgress = (completed, total) => {
  return Math.round((completed / total) * 100);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
