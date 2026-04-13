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
export { query, where, orderBy, onSnapshot };

// Generic CRUD operations
export const addDocument = async (collectionName, data) => {
  try {
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
    await deleteDoc(doc(db, collectionName, docId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { success: false, error: error.message };
  }
};

export const subscribeToCollection = (collectionName, conditions = [], orderByField = 'createdAt', orderDirection = 'desc', callback) => {
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
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    let dataToSet = {
      ...userData,
      updatedAt: new Date().toISOString()
    };
    
    // Always set admin email as Admin
    if (userData.email === 'denismwg4@gmail.com') {
      dataToSet.role = 'Admin';
    } else if (!userDoc.exists() || !userDoc.data().role) {
      dataToSet.role = 'Member';
    }
    
    await setDoc(userRef, dataToSet, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return { success: false, error: error.message };
  }
};
