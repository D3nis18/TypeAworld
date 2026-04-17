import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import { db } from './config';

// Export Firebase query functions for direct use
export { query, where, orderBy, onSnapshot, collection, doc, getDocs };

// Generic CRUD operations
export const addDocument = async (collectionName, data) => {
  try {
    if (!db) {
      return { success: false, error: 'Firestore not initialized' };
    }
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding document:', error);
    return { success: false, error: error.message };
  }
};

export const getDocument = async (collectionName, docId) => {
  try {
    if (!db) {
      return { success: false, error: 'Firestore not initialized' };
    }
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Document not found' };
  } catch (error) {
    console.error('Error getting document:', error);
    return { success: false, error: error.message };
  }
};

export const getCollection = async (collectionName, conditions = [], orderByField = 'createdAt', orderDirection = 'desc') => {
  try {
    if (!db) {
      return { success: false, error: 'Firestore not initialized', data: [] };
    }
    let q = collection(db, collectionName);
    
    if (conditions.length > 0) {
      q = query(q, ...conditions);
    }
    
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }
    
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: documents };
  } catch (error) {
    console.error('Error getting collection:', error);
    return { success: false, error: error.message };
  }
};

export const updateDocument = async (collectionName, docId, data) => {
  try {
    if (!db) {
      return { success: false, error: 'Firestore not initialized' };
    }
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating document:', error);
    return { success: false, error: error.message };
  }
};

export const deleteDocument = async (collectionName, docId) => {
  try {
    if (!db) {
      return { success: false, error: 'Firestore not initialized' };
    }
    await deleteDoc(doc(db, collectionName, docId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { success: false, error: error.message };
  }
};

export const subscribeToCollection = (collectionName, conditions = [], orderByField = 'createdAt', orderDirection = 'desc', callback) => {
  if (!db) {
    console.error('Firestore not initialized');
    return () => {};
  }
  let q = collection(db, collectionName);
  
  if (conditions.length > 0) {
    q = query(q, ...conditions);
  }
  
  if (orderByField) {
    q = query(q, orderBy(orderByField, orderDirection));
  }
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(documents);
  });
  
  return unsubscribe;
};

// Specific operations for TypeAworld
export const createOrUpdateUser = async (uid, userData) => {
  try {
    if (!db) {
      return { success: false, error: 'Firestore not initialized' };
    }
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    let dataToSet = {
      ...userData,
      updatedAt: new Date().toISOString()
    };
    
    // Normalize email to lowercase
    const normalizedEmail = userData.email?.toLowerCase().trim();
    dataToSet.email = normalizedEmail;

    // Always set admin email as Admin (case-insensitive check)
    if (normalizedEmail === 'denismwg4@gmail.com') {
      dataToSet.role = 'Admin';
    } else if (!userDoc.exists() || !userDoc.data().role) {
      dataToSet.role = 'Member';
    }
    
    await setDoc(userRef, dataToSet, { merge: true });
    
    // Also ensure Admin has a member record so they appear in members list and can chat
    if (normalizedEmail === 'denismwg4@gmail.com') {
      const membersQuery = query(collection(db, 'members'), where('email', '==', normalizedEmail));
      const membersSnapshot = await getDocs(membersQuery);
      
      if (membersSnapshot.empty) {
        // Admin doesn't have a member record - create one with full permissions
        await addDoc(collection(db, 'members'), {
          name: userData.name || 'Denis',
          surname: userData.surname || 'User',
          email: normalizedEmail,
          contact: userData.contact || '',
          position: 'Administrator',
          role: 'Admin',
          tags: ['admin'],
          permissions: {
            canEditMinutes: true,
            canEditProjects: true,
            canEditAttendance: true,
            canDeleteMinutes: true,
            canDeleteProjects: true,
            canDeleteAttendance: true,
            canPostTreasurerReports: true,
            canEditTreasurerReports: true,
            canDeleteTreasurerReports: true,
            canViewFeedback: true,
            canViewSuggestions: true,
            canEditCompanyProfile: true,
            canManageDepartments: true,
            canManageCategories: true,
            canManageAccounts: true
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return { success: false, error: error.message };
  }
};
