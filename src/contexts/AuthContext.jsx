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
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);

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
    } else if (Object.keys(additionalData).length > 0) {
      // Update with any additional fields if profile already exists
      try {
        await setDoc(userRef, {
          ...additionalData,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error('Error updating existing profile:', error);
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
    // 1. Detect Telegram WebApp or Localhost mock
    const tg = window.Telegram?.WebApp;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isTelegramEnv = !!(tg && tg.initData && tg.initData !== '');
    const isTMA = isTelegramEnv || isLocalhost;
    
    setIsTelegramWebApp(isTMA);

    if (isTMA && tg) {
      try {
        tg.ready();
        tg.expand();
      } catch (e) {
        console.error('Telegram WebApp ready/expand error:', e);
      }
    }

    // 2. Resolve Telegram User
    let tgUser = tg?.initDataUnsafe?.user;
    if (!tgUser && isLocalhost) {
      tgUser = {
        id: 99999999,
        first_name: 'Local',
        last_name: 'Tester',
        username: 'local_tester'
      };
    }

    if (!isTMA || !tgUser) {
      setLoading(false);
      return;
    }

    const email = `tg_${tgUser.id}@tg.vocab.local`;
    const password = `tg_pass_${tgUser.id}_secure_salt_vocab`;
    const displayName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username || `User ${tgUser.id}`;

    // 3. Set up Auth state change observer and perform silent Telegram authentication
    let isInitialAuthCheck = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (isInitialAuthCheck) {
        isInitialAuthCheck = false;
        
        // If user is already logged in with the matching Telegram email
        if (currentUser && currentUser.email === email) {
          setUser(currentUser);
          try {
            await createUserProfile(currentUser, {
              displayName,
              telegramId: tgUser.id,
              telegramUsername: tgUser.username || null,
              photoURL: tgUser.photo_url || null,
              updatedAt: serverTimestamp()
            });
          } catch (profileError) {
            console.error('Error creating user profile in initial load:', profileError);
          } finally {
            setLoading(false);
          }
        } else {
          // If logged in with a different user, sign out first
          if (currentUser) {
            await signOut(auth);
          }
          
          // Perform silent login
          try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            setUser(result.user);
            await createUserProfile(result.user, {
              displayName,
              telegramId: tgUser.id,
              telegramUsername: tgUser.username || null,
              photoURL: tgUser.photo_url || null,
              updatedAt: serverTimestamp()
            });
          } catch (loginError) {
            // If user doesn't exist, register
            if (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-credential' || loginError.code === 'auth/wrong-password') {
              try {
                const result = await createUserWithEmailAndPassword(auth, email, password);
                if (displayName) {
                  await updateProfile(result.user, { displayName });
                }
                setUser(result.user);
                await createUserProfile(result.user, {
                  displayName,
                  telegramId: tgUser.id,
                  telegramUsername: tgUser.username || null,
                  photoURL: tgUser.photo_url || null,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
              } catch (registerError) {
                console.error('Telegram silent registration failed:', registerError);
                toast.error('Failed to register Telegram account');
              }
            } else {
              console.error('Telegram silent login failed:', loginError);
              toast.error('Failed to log in to Telegram account');
            }
          }
          setLoading(false);
        }
      } else {
        setUser(currentUser);
        if (currentUser) {
          await createUserProfile(currentUser);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    isTelegramWebApp,
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
