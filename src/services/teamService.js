import api from '../lib/api';

/**
 * Team API Service
 * Handles all team-related API calls
 */

// ========== Team CRUD ==========

// Create a new team
export const createTeam = async (data) => {
  const response = await api.post('/teams', data);
  return response.data;
};

// Get team by ID
export const getTeamById = async (teamId) => {
  const response = await api.get(`/teams/${teamId}`);
  return response.data;
};

// Update team
export const updateTeam = async (teamId, data) => {
  const response = await api.put(`/teams/${teamId}`, data);
  return response.data;
};

// Delete team (leader or admin)
export const deleteTeam = async (teamId) => {
  const response = await api.delete(`/teams/${teamId}`);
  return response.data;
};

// ========== Team Membership ==========

// Leave team
export const leaveTeam = async (teamId) => {
  const response = await api.post(`/teams/${teamId}/leave`);
  return response.data;
};

// Remove member from team (leader or admin)
export const removeMember = async (teamId, memberId) => {
  const response = await api.delete(`/teams/${teamId}/members/${memberId}`);
  return response.data;
};

// Transfer leadership
export const transferLeadership = async (teamId, newLeaderId) => {
  const response = await api.patch(`/teams/${teamId}/leader`, { newLeaderId });
  return response.data;
};

// ========== Join Requests ==========

// Request to join a team
export const requestToJoinTeam = async (teamId, message = '') => {
  const response = await api.post(`/teams/${teamId}/request-join`, { message });
  return response.data;
};

// Get join requests for a team (leader only)
export const getTeamJoinRequests = async (teamId, status = 'pending') => {
  const response = await api.get(`/teams/${teamId}/requests`, {
    params: { status }
  });
  return response.data;
};

// Approve join request (leader only)
export const approveJoinRequest = async (teamId, requestId) => {
  const response = await api.post(`/teams/${teamId}/requests/${requestId}/approve`);
  return response.data;
};

// Reject join request (leader only)
export const rejectJoinRequest = async (teamId, requestId) => {
  const response = await api.post(`/teams/${teamId}/requests/${requestId}/reject`);
  return response.data;
};

// Cancel my join request
export const cancelJoinRequest = async (requestId) => {
  const response = await api.delete(`/join-requests/${requestId}`);
  return response.data;
};

// Get my join requests
export const getMyJoinRequests = async (status) => {
  const params = status ? { status } : {};
  const response = await api.get('/me/join-requests', { params });
  return response.data;
};

// ========== User's Teams ==========

// Get my teams
export const getMyTeams = async () => {
  const response = await api.get('/me/teams');
  return response.data;
};

// ========== Hackathon Teams ==========

// Get teams for a hackathon (already in hackathonService, but adding here for completeness)
export const getHackathonTeams = async (hackathonId, page = 1) => {
  const response = await api.get(`/hackathons/${hackathonId}/teams`, {
    params: { page }
  });
  return response.data;
};

// ========== Utility Functions ==========

// Check if user is team leader
export const isTeamLeader = (team, userId) => {
  if (!team || !userId) return false;
  const leaderId = team.leaderId?._id || team.leaderId;
  return leaderId === userId;
};

// Check if user is team member
export const isTeamMember = (team, userId) => {
  if (!team || !userId) return false;
  return team.members?.some(m => {
    const memberId = m.userId?._id || m.userId;
    return memberId === userId;
  });
};

// Get member role display
export const getMemberRoleDisplay = (role) => {
  const roles = {
    leader: { label: 'Leader', color: 'bg-secondary text-white' },
    member: { label: 'Member', color: 'bg-muted text-foreground' },
  };
  return roles[role] || roles.member;
};

// Get join request status display
export const getRequestStatusDisplay = (status) => {
  const statuses = {
    pending: { label: 'Pending', color: 'bg-warning/10 text-warning' },
    approved: { label: 'Approved', color: 'bg-success/10 text-success' },
    rejected: { label: 'Rejected', color: 'bg-error/10 text-error' },
    cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground' },
  };
  return statuses[status] || { label: status, color: 'bg-muted text-muted-foreground' };
};
