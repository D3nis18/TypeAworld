import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Default allowed emails (fallback)
const DEFAULT_ALLOWED_EMAILS = [
  'denismwg4@gmail.com',
  'jasminsoyian@mail.com',
  'amgideonkaranja@gmail.com',
  'ramatsammy@gmail.com',
  'member3@pmuchai17@gmail.com',
  'ceo@amgideonkaranja@gmail.com',
  'member5@typeaworld.com',
  'member6@typeaworld.com',
  'member7@typeaworld.com',
  'member8@typeaworld.com',
  'member9@typeaworld.com'
];

// Cache for allowed emails
let cachedAllowedEmails = null;

// Fetch allowed emails from Firestore
export const fetchAllowedEmails = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'allowedEmails'));
    const emails = querySnapshot.docs.map(doc => doc.data().email);
    cachedAllowedEmails = emails;
    return emails;
  } catch (error) {
    console.error('Error fetching allowed emails:', error);
    return DEFAULT_ALLOWED_EMAILS;
  }
};

// Get cached allowed emails (synchronous)
export const getAllowedEmails = () => {
  return cachedAllowedEmails || DEFAULT_ALLOWED_EMAILS;
};

// Check if email is allowed (case-insensitive comparison)
export const isEmailAllowed = async (email) => {
  const emails = await fetchAllowedEmails();
  const normalizedEmail = email.toLowerCase().trim();
  return emails.some(e => e.toLowerCase().trim() === normalizedEmail);
};

// For backward compatibility
export const ALLOWED_EMAILS = DEFAULT_ALLOWED_EMAILS;
