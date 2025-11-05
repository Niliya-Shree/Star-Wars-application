import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
  username: string;
  token: string;
};

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Check for existing session on initial load
    const token = localStorage.getItem('sw_token');
    const username = localStorage.getItem('sw_username');
    return token && username ? { username, token } : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!user);

  // Setup token refresh interval
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    
    if (isAuthenticated) {
      // Set up token refresh every 5 minutes
      refreshInterval = setInterval(() => {
        const newToken = `mock-jwt-token-${Date.now()}`;
        localStorage.setItem('sw_token', newToken);
        setUser(prev => prev ? { ...prev, token: newToken } : null);
      }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [isAuthenticated]);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Mock authentication
    if (username === 'jedi' && password === 'force123') {
      const token = 'mock-jwt-token';
      localStorage.setItem('sw_token', token);
      localStorage.setItem('sw_username', username);
      setUser({ username, token });
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('sw_token');
    localStorage.removeItem('sw_username');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
