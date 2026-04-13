import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPUyhR67ChMI9csliO-uCULPIAL3XRy9E",
  authDomain: "typeaworld-a6da9.firebaseapp.com",
  projectId: "typeaworld-a6da9",
  storageBucket: "typeaworld-a6da9.firebasestorage.app",
  messagingSenderId: "534947691002",
  appId: "1:534947691002:web:d3dd538cc79873e276cc43"
};

// Initialize Firebase - ensure only one instance
let app, auth, db, storage;

function initializeFirebase() {
  try {
    // Check if already initialized
    if (getApps().length > 0) {
      app = getApp();
      console.log('Firebase app already exists, reusing');
    } else {
      app = initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully');
    }
    
    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    app = null;
    auth = null;
    db = null;
    storage = null;
    return false;
  }
}

// Initialize immediately
initializeFirebase();

export { app, auth, db, storage };
export { initializeFirebase };

// ALLOWED EMAILS - Add your 11 approved emails here
export const ALLOWED_EMAILS = [
  'denismwg4@gmail.com',
  'secretary@jasminsoyian@mail.com',
  'member1@bykiptoo@gmail.com',
  'member2@rugakarule@gmail.com',
  'member3@pmuchai17@gmail.com',
  'ceo@amgideonkaranja@gmail.com',
  'member5@typeaworld.com',
  'member6@typeaworld.com',
  'member7@typeaworld.com',
  'member8@typeaworld.com',
  'member9@typeaworld.com'
  // Add your actual emails here
];

// Check if email is allowed
export const isEmailAllowed = (email) => {
  return ALLOWED_EMAILS.includes(email.toLowerCase());
};
