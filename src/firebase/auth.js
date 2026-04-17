import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';
import { auth, db, isEmailAllowed } from './config';

// Sign in with email and password
export const signIn = async (email, password) => {
  try {
    // Check if auth is initialized
    if (!auth) {
      return { success: false, error: 'Firebase Auth not initialized. Please try again later.' };
    }
    
    // Check if email is in allowlist (async)
    const allowed = await isEmailAllowed(email);
    if (!allowed) {
      throw new Error('This email is not authorized to access the system.');
    }

    try {
      // Try to sign in normally
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (signInError) {
      // If sign in fails, check if this is first-time login with initial password
      if (signInError.code === 'auth/invalid-credential' || signInError.code === 'auth/user-not-found') {
        // Check if member exists with initial password (case-insensitive)
        const normalizedEmail = email.toLowerCase().trim();
        const membersQuery = query(collection(db, 'members'), where('email', '==', normalizedEmail));
        const membersSnapshot = await getDocs(membersQuery);

        if (!membersSnapshot.empty) {
          const memberDoc = membersSnapshot.docs[0];
          const memberData = memberDoc.data();

          // Check if initial password matches
          if (memberData.initialPassword === password) {
            try {
              // Create Firebase Auth account for member (use lowercase email)
              const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

              // Update member record to mark password as set
              await updateDoc(doc(db, 'members', memberDoc.id), {
                passwordSet: true,
                uid: userCredential.user.uid,
                email: normalizedEmail // Ensure email is lowercase in members record
              });

              return { success: true, user: userCredential.user, message: 'Account created successfully. Welcome!' };
            } catch (createError) {
              if (createError.code === 'auth/email-already-in-use') {
                // Account already exists, user should use their Firebase password
                return {
                  success: false,
                  error: 'Your account already exists. Please use your Firebase password (the one you set when you first logged in), not the initial password. If you forgot your password, contact the admin to reset it.'
                };
              }
              throw createError;
            }
          }
        }
      }
      
      // Re-throw the original error
      throw signInError;
    }
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
