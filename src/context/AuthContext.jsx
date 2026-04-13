import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChange, getUserRole } from '../firebase/auth';
import { createOrUpdateUser } from '../firebase/firestore';

// Demo mode - set to true to preview without Firebase, set to false for production
const DEMO_MODE = false;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      // Demo mode - simulate authenticated user as Admin
      setUser({
        email: 'admin@typeaworld.com',
        uid: 'demo-user-123'
      });
      setRole('Admin');
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};
    
    try {
      unsubscribe = onAuthStateChange(async (user) => {
        setUser(user);
        
        if (user) {
          // Get user role from Firestore
          const userRole = await getUserRole(user.uid);
          setRole(userRole);
          
          // Update user last login
          await createOrUpdateUser(user.uid, {
            email: user.email,
            lastLogin: new Date().toISOString()
          });
        } else {
          setRole(null);
        }
        
        setLoading(false);
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      setLoading(false);
    }

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
