import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateLessonId, generateWordId } from '../lib/utils';

// Lessons Service
export const lessonsService = {
  // Get all lessons
  async getAllLessons() {
    try {
      const lessonsRef = collection(db, 'lessons');
      const q = query(lessonsRef, orderBy('number'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching lessons:', error);
      throw error;
    }
  },

  // Get lesson by number
  async getLessonByNumber(lessonNumber) {
    try {
      const lessonId = generateLessonId(lessonNumber);
      const lessonRef = doc(db, 'lessons', lessonId);
      const lessonSnap = await getDoc(lessonRef);
      
      if (lessonSnap.exists()) {
        return {
          id: lessonSnap.id,
          ...lessonSnap.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching lesson:', error);
      throw error;
    }
  }
};

// Words Service
export const wordsService = {
  // Get all words for a lesson
  async getWordsByLesson(lessonNumber) {
    try {
      const wordsRef = collection(db, 'words');
      const q = query(
        wordsRef, 
        where('lessonNumber', '==', lessonNumber),
        orderBy('priority')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching lesson words:', error);
      throw error;
    }
  },

  // Get word by ID
  async getWordById(wordId) {
    try {
      const wordRef = doc(db, 'words', generateWordId(wordId));
      const wordSnap = await getDoc(wordRef);
      
      if (wordSnap.exists()) {
        return {
          id: wordSnap.id,
          ...wordSnap.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching word:', error);
      throw error;
    }
  },

  // Get random words for learning
  async getRandomWords(count = 10) {
    try {
      const wordsRef = collection(db, 'words');
      // Get a random lesson number (1-42)
      const randomLesson = Math.floor(Math.random() * 42) + 1;
      const q = query(
        wordsRef,
        where('lessonNumber', '>=', randomLesson),
        limit(count)
      );
      const snapshot = await getDocs(q);
      
      const words = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // If we don't have enough words, get more from earlier lessons
      if (words.length < count && randomLesson > 1) {
        const additionalQ = query(
          wordsRef,
          where('lessonNumber', '<', randomLesson),
          limit(count - words.length)
        );
        const additionalSnapshot = await getDocs(additionalQ);
        const additionalWords = additionalSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        words.push(...additionalWords);
      }
      
      return words;
    } catch (error) {
      console.error('Error fetching random words:', error);
      throw error;
    }
  },

  // Search words
  async searchWords(searchTerm, lessonNumber = null) {
    try {
      const searchRef = collection(db, 'word_search');
      let q;
      
      if (lessonNumber) {
        q = query(
          searchRef,
          where('lessonNumber', '==', lessonNumber),
          where('searchTerm', '>=', searchTerm.toLowerCase()),
          where('searchTerm', '<=', searchTerm.toLowerCase() + '\uf8ff'),
          limit(20)
        );
      } else {
        q = query(
          searchRef,
          where('searchTerm', '>=', searchTerm.toLowerCase()),
          where('searchTerm', '<=', searchTerm.toLowerCase() + '\uf8ff'),
          limit(20)
        );
      }
      
      const snapshot = await getDocs(q);
      const searchResults = snapshot.docs.map(doc => doc.data());
      
      // Get full word details
      const wordPromises = searchResults.map(result => 
        this.getWordById(result.wordId.replace('word-', ''))
      );
      
      const words = await Promise.all(wordPromises);
      return words.filter(word => word !== null);
    } catch (error) {
      console.error('Error searching words:', error);
      throw error;
    }
  }
};

// User Service
export const userService = {
  // Get top users for ranking
  async getTopUsers(limitCount = 50) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        orderBy('totalScore', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc, index) => ({
        id: doc.id,
        rank: index + 1,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching top users:', error);
      throw error;
    }
  },

  // Get user rank
  async getUserRank(userId, userScore) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('totalScore', '>', userScore)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.size + 1; // User's rank is number of users with higher score + 1
    } catch (error) {
      console.error('Error getting user rank:', error);
      return null;
    }
  }
};

// Statistics Service
export const statsService = {
  // Get app statistics
  async getAppStats() {
    try {
      const [lessonsSnapshot, wordsSnapshot, usersSnapshot] = await Promise.all([
        getDocs(collection(db, 'lessons')),
        getDocs(collection(db, 'words')),
        getDocs(collection(db, 'users'))
      ]);
      
      return {
        totalLessons: lessonsSnapshot.size,
        totalWords: wordsSnapshot.size,
        totalUsers: usersSnapshot.size
      };
    } catch (error) {
      console.error('Error fetching app stats:', error);
      return {
        totalLessons: 42,
        totalWords: 504,
        totalUsers: 0
      };
    }
  }
};

// Leitner Box Service
export const leitnerService = {
  // Add word to Leitner box
  async addToLeitnerBox(userId, wordData) {
    try {
      const flashcardRef = collection(db, 'leitner_cards');
      
      // Process examples to extract text content
      let processedExamples = [];
      if (Array.isArray(wordData.examples)) {
        processedExamples = wordData.examples.map(example => {
          if (typeof example === 'string') {
            return example;
          } else if (typeof example === 'object' && example !== null) {
            return example.text || example.sentence || example.example || '';
          }
          return '';
        }).filter(ex => ex.trim());
      }
      
      const flashcard = {
        userId,
        wordId: wordData.id || null,
        word: wordData.word || '',
        meaning: wordData.meaning || wordData.persianTranslation || '',
        pronunciation: wordData.pronunciation || '',
        definition: wordData.definition || wordData.englishExplanation || '',
        synonyms: Array.isArray(wordData.synonyms) ? wordData.synonyms : [],
        antonyms: Array.isArray(wordData.antonyms) ? wordData.antonyms : [],
        examples: processedExamples,
        box: 1, // Start in box 1
        nextReviewDate: new Date(),
        reviewCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        isCustomWord: !wordData.id, // Custom if no ID from database
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(flashcardRef, flashcard);
      return docRef.id;
    } catch (error) {
      console.error('Error adding to Leitner box:', error);
      throw error;
    }
  },

  // Add custom word to Leitner box
  async addCustomWord(userId, customWordData) {
    try {
      const flashcardRef = collection(db, 'leitner_cards');
      const flashcard = {
        userId,
        wordId: null,
        word: customWordData.word || '',
        meaning: customWordData.meaning || '',
        pronunciation: customWordData.pronunciation || '',
        definition: customWordData.definition || '',
        synonyms: Array.isArray(customWordData.synonyms) ? customWordData.synonyms : [],
        antonyms: Array.isArray(customWordData.antonyms) ? customWordData.antonyms : [],
        examples: Array.isArray(customWordData.examples) ? customWordData.examples.filter(ex => ex && ex.trim()) : [],
        box: 1,
        nextReviewDate: new Date(),
        reviewCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        isCustomWord: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(flashcardRef, flashcard);
      return docRef.id;
    } catch (error) {
      console.error('Error adding custom word:', error);
      throw error;
    }
  },

  // Get user's flashcards
  async getUserFlashcards(userId) {
    try {
      const flashcardsRef = collection(db, 'leitner_cards');
      const q = query(
        flashcardsRef,
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      
      const flashcards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        nextReviewDate: doc.data().nextReviewDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      }));
      
      // Sort by nextReviewDate on client side for now
      return flashcards.sort((a, b) => a.nextReviewDate - b.nextReviewDate);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      throw error;
    }
  },

  // Get flashcards due for review
  async getDueFlashcards(userId) {
    try {
      const flashcardsRef = collection(db, 'leitner_cards');
      const q = query(
        flashcardsRef,
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      
      const now = new Date();
      const flashcards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        nextReviewDate: doc.data().nextReviewDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      }));
      
      // Filter and sort due cards on client side for now
      return flashcards
        .filter(card => card.nextReviewDate <= now)
        .sort((a, b) => a.nextReviewDate - b.nextReviewDate);
    } catch (error) {
      console.error('Error fetching due flashcards:', error);
      throw error;
    }
  },

  // Update flashcard after review
  async updateFlashcardAfterReview(flashcardId, isCorrect) {
    try {
      const flashcardRef = doc(db, 'leitner_cards', flashcardId);
      const flashcardDoc = await getDoc(flashcardRef);
      
      if (!flashcardDoc.exists()) {
        throw new Error('Flashcard not found');
      }
      
      const flashcard = flashcardDoc.data();
      const currentBox = flashcard.box || 1;
      let newBox = currentBox;
      let nextReviewDate = new Date();
      
      // Leitner system logic
      if (isCorrect) {
        // Move to next box (max 5 boxes)
        newBox = Math.min(currentBox + 1, 5);
        // Calculate next review date based on box number
        const daysToAdd = Math.pow(2, newBox - 1); // 1, 2, 4, 8, 16 days
        nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);
      } else {
        // Move back to box 1
        newBox = 1;
        // Review again tomorrow
        nextReviewDate.setDate(nextReviewDate.getDate() + 1);
      }
      
      await updateDoc(flashcardRef, {
        box: newBox,
        nextReviewDate,
        reviewCount: (flashcard.reviewCount || 0) + 1,
        correctCount: (flashcard.correctCount || 0) + (isCorrect ? 1 : 0),
        incorrectCount: (flashcard.incorrectCount || 0) + (isCorrect ? 0 : 1),
        updatedAt: serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error updating flashcard:', error);
      throw error;
    }
  },

  // Delete flashcard
  async deleteFlashcard(flashcardId) {
    try {
      const flashcardRef = doc(db, 'leitner_cards', flashcardId);
      await deleteDoc(flashcardRef);
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      throw error;
    }
  },

  // Get user's Leitner box statistics
  async getUserLeitnerStats(userId) {
    try {
      const flashcardsRef = collection(db, 'leitner_cards');
      const q = query(flashcardsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      const stats = {
        totalCards: 0,
        dueCards: 0,
        boxDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        customWords: 0,
        averageAccuracy: 0
      };
      
      let totalReviews = 0;
      let totalCorrect = 0;
      const now = new Date();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        stats.totalCards++;
        
        if (data.nextReviewDate?.toDate() <= now) {
          stats.dueCards++;
        }
        
        const box = data.box || 1;
        stats.boxDistribution[box]++;
        
        if (data.isCustomWord) {
          stats.customWords++;
        }
        
        totalReviews += data.reviewCount || 0;
        totalCorrect += data.correctCount || 0;
      });
      
      if (totalReviews > 0) {
        stats.averageAccuracy = Math.round((totalCorrect / totalReviews) * 100);
      }
      
      return stats;
    } catch (error) {
      console.error('Error fetching Leitner stats:', error);
      throw error;
    }
  },

  // Check if word is already in Leitner box
  async isWordInLeitnerBox(userId, wordId) {
    try {
      const flashcardsRef = collection(db, 'leitner_cards');
      const q = query(
        flashcardsRef,
        where('userId', '==', userId),
        where('wordId', '==', wordId)
      );
      const snapshot = await getDocs(q);
      
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking word in Leitner box:', error);
      return false;
    }
  }
};
