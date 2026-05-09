import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateProfile: (profileData: { username?: string; currentPassword?: string; password?: string; avatar?: string | null }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${savedToken}` }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setToken(savedToken);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const logoutAll = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout-all', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateProfile = async (profileData: { username?: string; currentPassword?: string; password?: string; avatar?: string | null }): Promise<boolean> => {
    try {
      if (!token) throw new Error('No token found');

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Profile update failed');
      }

      const responseData = await res.json();
      setUser(responseData.user);
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, loading, login, logout, logoutAll, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
