import api from '../lib/api';

/**
 * User API Service
 * Handles user management operations
 */

// ========== User Listing & Search ==========

// List all users (admin only)
export const getUsers = async (params = {}) => {
  const response = await api.get('/users', { params });
  return response.data;
};

// Get user by ID
export const getUserById = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

// Search users by role (for assigning judges)
export const getUsersByRole = async (role, params = {}) => {
  const response = await api.get('/users', { 
    params: { ...params, role } 
  });
  return response.data;
};

// Search users
export const searchUsers = async (query, params = {}) => {
  const response = await api.get('/users', { 
    params: { ...params, q: query } 
  });
  return response.data;
};

// ========== User Management (Admin) ==========

// Update user
export const updateUser = async (userId, data) => {
  const response = await api.put(`/users/${userId}`, data);
  return response.data;
};

// Change user role
export const changeUserRole = async (userId, role) => {
  const response = await api.patch(`/users/${userId}/role`, { role });
  return response.data;
};

// Deactivate user
export const deactivateUser = async (userId) => {
  const response = await api.patch(`/users/${userId}/deactivate`);
  return response.data;
};

// Delete user
export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};

// ========== Utility Functions ==========

// Get role display
export const getRoleDisplay = (role) => {
  const roleConfig = {
    admin: { label: 'Administrator', color: 'bg-error/10 text-error', icon: '🛡️' },
    organizer: { label: 'Organizer', color: 'bg-info/10 text-info', icon: '📋' },
    judge: { label: 'Judge', color: 'bg-warning/10 text-warning', icon: '⚖️' },
    participant: { label: 'Participant', color: 'bg-success/10 text-success', icon: '👤' },
  };
  return roleConfig[role] || { label: role, color: 'bg-muted text-muted-foreground', icon: '👤' };
};

// Available roles for selection
export const ROLES = [
  { value: 'participant', label: 'Participant' },
  { value: 'judge', label: 'Judge' },
  { value: 'organizer', label: 'Organizer' },
  { value: 'admin', label: 'Administrator' },
];
