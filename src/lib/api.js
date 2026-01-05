import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Token storage keys
const TOKEN_KEY = 'hackathon_judge_token';
const USER_KEY = 'hackathon_judge_user';

// Token management utilities
export const tokenStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  
  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(USER_KEY),
  
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    // Handle specific error cases
    if (response) {
      switch (response.status) {
        case 401:
          // Unauthorized - clear tokens and redirect to login
          tokenStorage.clear();
          // Only redirect if not already on auth pages
          if (!window.location.pathname.includes('/login') && 
              !window.location.pathname.includes('/register')) {
            window.location.href = '/login';
          }
          break;
        case 403:
          // Forbidden - user doesn't have permission
          console.error('Access forbidden');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          break;
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - please check your connection');
    }
    
    return Promise.reject(error);
  }
);

export default api;
