/**
 * AdminAuthContext & Provider
 * Manages administrator session state isolated from public participant auth sessions.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import adminApi from '../services/adminApi';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    const verifyAdminSession = async () => {
      const adminToken = localStorage.getItem('peak1_admin_token');
      if (adminToken) {
        try {
          const res = await adminApi.get('/auth/admin/me');
          if (res.success && res.data?.user) {
            setAdminUser(res.data.user);
          }
        } catch (err) {
          console.error('Admin session verification failed:', err);
          localStorage.removeItem('peak1_admin_token');
          setAdminUser(null);
        }
      }
      setAdminLoading(false);
    };

    verifyAdminSession();
  }, []);

  const adminLogin = async ({ email, password }) => {
    const res = await adminApi.post('/auth/admin/login', { email, password });
    if (res.success && res.data) {
      localStorage.setItem('peak1_admin_token', res.data.token);
      setAdminUser(res.data.user);
      return res.data;
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('peak1_admin_token');
    setAdminUser(null);
  };

  const value = {
    adminUser,
    adminLoading,
    adminLogin,
    adminLogout,
    isAdminAuthenticated: !!adminUser && (adminUser.role === 'ADMIN' || adminUser.role === 'SUPER_ADMIN' || adminUser.role === 'CHECKIN_STAFF')
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
