import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
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
  'pmuchai17@gmail.com',
  'amgideonkaranja@gmail.com',
  'bykiptoo@gmail.com',
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

// Check if email exists in members collection (fallback for permission issues)
const isEmailInMembers = async (email) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const membersQuery = query(collection(db, 'members'), where('email', '==', normalizedEmail));
    const snapshot = await getDocs(membersQuery);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking members:', error);
    return false;
  }
};

// Check if email is allowed (case-insensitive comparison)
// Falls back to members collection if allowedEmails fails due to permissions
export const isEmailAllowed = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();

  // First check DEFAULT_ALLOWED_EMAILS (always works, no permissions needed)
  const inDefaultList = DEFAULT_ALLOWED_EMAILS.some(e => e.toLowerCase().trim() === normalizedEmail);
  if (inDefaultList) return true;

  // Try to fetch from Firestore allowedEmails collection
  try {
    const emails = await fetchAllowedEmails();
    const inFirestoreList = emails.some(e => e.toLowerCase().trim() === normalizedEmail);
    if (inFirestoreList) return true;
  } catch (error) {
    console.log('Firestore allowedEmails check failed, trying members collection...');
  }

  // Fallback: check if email exists in members collection
  const inMembers = await isEmailInMembers(email);
  if (inMembers) return true;

  // Not authorized
  return false;
};

// For backward compatibility
export const ALLOWED_EMAILS = DEFAULT_ALLOWED_EMAILS;
