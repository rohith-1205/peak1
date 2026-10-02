/**
 * Admin API Service Client
 * Handles HTTP requests for the Organizer Console using a dedicated token ('peak1_admin_token')
 * so participant and admin authentication sessions remain completely isolated.
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach Admin Token
adminApi.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('peak1_admin_token');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract data & handle 401 unauthorized errors
adminApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('peak1_admin_token');
      // Redirect to admin login if not already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/admin/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    const message = error.response?.data?.message || error.message || 'An unexpected server error occurred';
    const errors = error.response?.data?.errors;
    const errorCode = error.response?.data?.errorCode || 'ADMIN_API_ERROR';
    return Promise.reject({ message, errors, errorCode, status: error.response?.status, raw: error });
  }
);

export default adminApi;
