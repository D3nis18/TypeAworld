import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isEmailAllowed } from './config';

// Sign in with email and password
export const signIn = async (email, password) => {
  try {
    // Check if auth is initialized
    if (!auth) {
      return { success: false, error: 'Firebase Auth not initialized. Please try again later.' };
    }
    
    // Check if email is in allowlist
    if (!isEmailAllowed(email)) {
      throw new Error('This email is not authorized to access the system.');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: error.message };
  }
};

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: error.message };
  }
};

// Get user role from Firestore
export const getUserRole = async (uid) => {
  try {
    if (!db) {
      console.error('Firestore not initialized');
      return 'Member';
    }
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().role || 'Member';
    }
    return 'Member';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'Member';
  }
};

// Auth state listener
export const onAuthStateChange = (callback) => {
  if (!auth) {
    console.error('Firebase Auth not initialized');
    // Return a dummy unsubscribe function
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
