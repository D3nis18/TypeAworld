import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase Configuration
// REPLACE THESE WITH YOUR ACTUAL FIREBASE CONFIGURATION KEYS


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

// ALLOWED EMAILS - Add your 11 approved emails here
export const ALLOWED_EMAILS = [
  'admin@denismwg4gmail.com',
  'secretary@jasminsoyian@mail.com',
  'member1@bykiptoo@gmail.com',
  'member2@rugakarule@gmail.com',
  'member3@pmuchai17@gmail.com',
  'member4@typeaworld.com',
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
