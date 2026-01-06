import { create } from 'zustand';
import api, { tokenStorage } from '../lib/api';

const useAuthStore = create((set, get) => ({
  // State
  user: tokenStorage.getUser(),
  token: tokenStorage.getToken(),
  isAuthenticated: !!tokenStorage.getToken(),
  isLoading: false,
  error: null,

  // Actions
  setUser: (user) => {
    tokenStorage.setUser(user);
    set({ user, isAuthenticated: !!user });
  },

  setToken: (token) => {
    tokenStorage.setToken(token);
    set({ token, isAuthenticated: !!token });
  },

  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  // Register new user
  register: async ({ name, email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { user, token } = response.data;
      
      tokenStorage.setToken(token);
      tokenStorage.setUser(user);
      
      set({ 
        user, 
        token, 
        isAuthenticated: true, 
        isLoading: false,
        error: null 
      });
      
      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.errors?.[0]?.msg || 
                          error.response?.data?.message || 
                          'Registration failed';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Login user
  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      
      tokenStorage.setToken(token);
      tokenStorage.setUser(user);
      
      set({ 
        user, 
        token, 
        isAuthenticated: true, 
        isLoading: false,
        error: null 
      });
      
      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.errors?.[0]?.msg || 
                          error.response?.data?.message || 
                          'Login failed';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Logout user
  logout: async () => {
    set({ isLoading: true });
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      tokenStorage.clear();
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null 
      });
    }
  },

  // Get current user profile
  fetchCurrentUser: async () => {
    const token = tokenStorage.getToken();
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return null;
    }

    set({ isLoading: true });
    try {
      const response = await api.get('/me');
      const user = response.data.user;
      
      tokenStorage.setUser(user);
      set({ user, isAuthenticated: true, isLoading: false });
      
      return user;
    } catch (error) {
      tokenStorage.clear();
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
      return null;
    }
  },

  // Update user profile
  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put('/me', data);
      const user = response.data.user;
      
      tokenStorage.setUser(user);
      set({ user, isLoading: false });
      
      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Update failed';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Change password
  changePassword: async ({ currentPassword, newPassword }) => {
    set({ isLoading: true, error: null });
    try {
      await api.put('/me/password', { currentPassword, newPassword });
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/password/forgot', { email });
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Request failed';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Reset password
  resetPassword: async ({ token, password }) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/password/reset', { token, password });
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Reset failed';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Accept invite
  acceptInvite: async ({ token, name, password }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/users/invite/accept', { token, name, password });
      const { user, token: authToken } = response.data;
      
      tokenStorage.setToken(authToken);
      tokenStorage.setUser(user);
      
      set({ 
        user, 
        token: authToken, 
        isAuthenticated: true, 
        isLoading: false 
      });
      
      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Invite acceptance failed';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Check if user has specific role
  hasRole: (role) => {
    const { user } = get();
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  },

  // Check if user is admin
  isAdmin: () => get().user?.role === 'admin',
  
  // Check if user is organizer
  isOrganizer: () => get().user?.role === 'organizer',
  
  // Check if user is judge
  isJudge: () => get().user?.role === 'judge',
  
  // Check if user is participant
  isParticipant: () => get().user?.role === 'participant',
}));

export default useAuthStore;
