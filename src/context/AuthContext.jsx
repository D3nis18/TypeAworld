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
          // Set default role immediately for faster UI
          setRole('Member');
          setLoading(false);

          // Load actual role and update user in background (non-blocking)
          getUserRole(user.uid).then(userRole => {
            if (userRole) setRole(userRole);
          }).catch(() => {});

          // Update last login in background (non-blocking)
          createOrUpdateUser(user.uid, {
            email: user.email,
            lastLogin: new Date().toISOString()
          }).catch(() => {});
        } else {
          setRole(null);
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      setLoading(false);
    }

    return unsubscribe;
  }, []);

  // Helper to get display name for user
  const getDisplayName = () => {
    if (!user?.email) return 'User';
    // Admin account
    if (user.email.toLowerCase() === 'denismwg4@gmail.com') {
      return 'Denis Mwangi';
    }
    // Default: use email username
    return user.email.split('@')[0];
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, displayName: getDisplayName() }}>
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
