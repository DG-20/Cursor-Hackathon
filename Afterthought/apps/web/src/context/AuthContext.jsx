import { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'afterthought_auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { user: u, session: s } = JSON.parse(stored);
        if (u && s?.access_token) {
          setUser(u);
          setSession(s);
        }
      }
    } catch (_) {
      localStorage.removeItem(STORAGE_KEY);
    }
    setIsReady(true);
  }, []);

  const setAuth = (userData, sessionData) => {
    setUser(userData);
    setSession(sessionData);
    if (userData && sessionData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData, session: sessionData }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const signOut = () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = {
    user,
    session,
    setAuth,
    signOut,
    isReady,
    isLoggedIn: !!user && !!session?.access_token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
