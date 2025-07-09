import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Create or update user profile in Firestore
  const createUserProfile = async (user, additionalData = {}) => {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      const { displayName, email, photoURL } = user;
      try {
        await setDoc(userRef, {
          displayName: displayName || email?.split('@')[0],
          email,
          photoURL: photoURL || null,
          totalScore: 0,
          completedLessons: [],
          currentLesson: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...additionalData
        });
        toast.success('Welcome! Your profile has been created.');
      } catch (error) {
        console.error('Error creating user profile:', error);
        toast.error('Error creating profile');
      }
    }
    
    // Fetch and set user profile
    const updatedUserSnap = await getDoc(userRef);
    if (updatedUserSnap.exists()) {
      setUserProfile({ id: user.uid, ...updatedUserSnap.data() });
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      await createUserProfile(result.user, { displayName });
      toast.success('Account created successfully!');
      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back!');
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await createUserProfile(result.user);
      return result;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Error signing out');
    }
  };

  // Update user score
  const updateUserScore = async (points) => {
    if (!user || !userProfile) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const newScore = userProfile.totalScore + points;
      
      await setDoc(userRef, {
        totalScore: newScore,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setUserProfile(prev => ({
        ...prev,
        totalScore: newScore
      }));
      
      if (points > 0) {
        toast.success(`+${points} points earned!`);
      }
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  // Mark lesson as completed
  const completeLesson = async (lessonNumber) => {
    if (!user || !userProfile) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const completedLessons = [...(userProfile.completedLessons || [])];
      
      if (!completedLessons.includes(lessonNumber)) {
        completedLessons.push(lessonNumber);
        
        await setDoc(userRef, {
          completedLessons,
          currentLesson: Math.max(userProfile.currentLesson, lessonNumber + 1),
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        setUserProfile(prev => ({
          ...prev,
          completedLessons,
          currentLesson: Math.max(prev.currentLesson, lessonNumber + 1)
        }));
        
        // Award completion bonus
        await updateUserScore(50); // 50 points for completing a lesson
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  // Update user profile
  const updateUserProfile = async (displayName) => {
    if (!user) return;
    
    try {
      // Update Firebase Auth profile
      await updateProfile(user, { displayName });
      
      // Update Firestore profile
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        displayName
      }));
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      toast.error('Error sending reset email');
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        await createUserProfile(user);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    updateUserScore,
    completeLesson,
    updateUserProfile,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
