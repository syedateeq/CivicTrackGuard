import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // { token, email, role, userId, name, points }
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const profile = await fetchMe();
          if (profile) {
            setUser({ ...profile, token });
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('token');
          }
        } catch {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [fetchMe]);

  const login = async (email, password) => {
    // Throws on error, so caller can catch and display message
    const response = await api.post('/api/auth/login', { email, password });
    const data = response.data; // { token, email, role, userId, name, points }

    if (!data.token) throw new Error('No token received from server');

    localStorage.setItem('token', data.token);
    setUser(data);
    setIsAuthenticated(true);
    return data;
  };

  const register = async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    const data = response.data;
    // Auto-login after register
    if (data.token) {
      localStorage.setItem('token', data.token);
      setUser(data);
      setIsAuthenticated(true);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    const profile = await fetchMe();
    if (profile) {
      setUser(prev => ({ ...prev, ...profile }));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
