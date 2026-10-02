/**
 * Frontend Environment Configuration
 */

// The base URL for REST API calls. 
// Locally, it uses the '/api/v1' relative path which Vite proxies to the backend.
// In production, it should be the full Render backend URL.
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// The URL for Socket.io connections.
// If VITE_SOCKET_URL is set, we use it. Otherwise, we try to derive it from VITE_API_URL.
// Fallback to localhost:5000 for local dev if neither is set.
const derivedSocketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:5000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || derivedSocketUrl;

// The current environment of the frontend (development, staging, production)
export const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';
