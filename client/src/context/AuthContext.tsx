import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'reader' | 'creator' | 'admin';
  profileImage?: string;
  bio?: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = Cookies.get('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await api.get('/users/me');
      if (response.data.status) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.status) {
      const { accessToken, user: userData } = response.data.data;
      if (accessToken) {
        Cookies.set('accessToken', accessToken, { expires: 7 });
        try { localStorage.setItem('accessToken', accessToken); } catch {}
      }
      setUser(userData);
      return;
    }
    throw new Error('Login failed');
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    if (response.data.status) {
      // API returns created profile, but not necessarily tokens. Do not set user here to force login flow.
      return;
    }
    throw new Error('Registration failed');
  };

  const logout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    try { localStorage.removeItem('accessToken'); } catch {}
    try { sessionStorage.removeItem('accessToken'); } catch {}
    setUser(null);
    api.post('/auth/logout').catch(() => {});
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};