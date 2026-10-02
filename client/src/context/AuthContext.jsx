import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('peak1_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.success && res.data?.user) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.error('Failed to load authenticated user session:', err);
          localStorage.removeItem('peak1_token');
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, []);

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    if (res.success && res.data) {
      localStorage.setItem('peak1_token', res.data.token);
      setUser(res.data.user);
      return res.data;
    }
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.success && res.data) {
      localStorage.setItem('peak1_token', res.data.token);
      setUser(res.data.user);
      return res.data;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('peak1_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
