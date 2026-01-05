import api from '../lib/api';

/**
 * Assignment API Service
 * Handles judge assignments to hackathon teams
 */

// ========== Assignment CRUD ==========

// Assign a single judge to teams
export const assignJudge = async (hackathonId, data) => {
  // data: { judgeId, teamIds, role }
  const response = await api.post(`/hackathons/${hackathonId}/assignments`, data);
  return response.data;
};

// Bulk assign judges to teams
export const bulkAssignJudges = async (hackathonId, assignments) => {
  // assignments: [{ judgeId, teamIds, role }, ...]
  const response = await api.post(`/hackathons/${hackathonId}/assignments/bulk`, { assignments });
  return response.data;
};

// Auto-assign judges evenly across teams
export const autoAssignJudges = async (hackathonId, judgesPerTeam = 2) => {
  const response = await api.post(`/hackathons/${hackathonId}/assignments/auto`, { judgesPerTeam });
  return response.data;
};

// ========== Get Assignments ==========

// Get all assignments for a hackathon (organizer/admin)
export const getAssignments = async (hackathonId) => {
  const response = await api.get(`/hackathons/${hackathonId}/assignments`);
  return response.data;
};

// Get my assignments as a judge
export const getMyAssignments = async (hackathonId) => {
  const response = await api.get(`/hackathons/${hackathonId}/assignments/mine`);
  return response.data;
};

// Get workload summary for all judges
export const getWorkloadSummary = async (hackathonId) => {
  const response = await api.get(`/hackathons/${hackathonId}/assignments/workload`);
  return response.data;
};

// ========== Update/Remove Assignments ==========

// Update teams assigned to a judge (add or remove)
export const updateJudgeTeams = async (hackathonId, judgeId, teamIds, action = 'add') => {
  // action: 'add' | 'remove'
  const response = await api.patch(
    `/hackathons/${hackathonId}/assignments/${judgeId}/teams`,
    { teamIds, action }
  );
  return response.data;
};

// Remove a judge's assignment completely
export const removeJudgeAssignment = async (hackathonId, judgeId) => {
  const response = await api.delete(`/hackathons/${hackathonId}/assignments/${judgeId}`);
  return response.data;
};

// ========== Utility Functions ==========

// Calculate assignment statistics
export const calculateAssignmentStats = (assignments, teams, judges) => {
  const totalTeams = teams?.length || 0;
  const totalJudges = judges?.length || 0;
  
  // Count assignments per judge
  const judgeWorkload = {};
  assignments?.forEach(assignment => {
    const judgeId = assignment.judgeId?._id || assignment.judgeId;
    if (!judgeWorkload[judgeId]) {
      judgeWorkload[judgeId] = {
        judge: assignment.judgeId,
        teamCount: 0,
        teams: [],
        role: assignment.role
      };
    }
    judgeWorkload[judgeId].teamCount += assignment.teamIds?.length || 0;
    judgeWorkload[judgeId].teams.push(...(assignment.teamIds || []));
  });

  // Count teams with assignments
  const assignedTeamIds = new Set();
  assignments?.forEach(a => {
    (a.teamIds || []).forEach(t => {
      const teamId = t._id || t;
      assignedTeamIds.add(teamId);
    });
  });

  const teamsAssigned = assignedTeamIds.size;
  const teamsUnassigned = totalTeams - teamsAssigned;

  // Average workload
  const avgWorkload = totalJudges > 0 
    ? Math.round(Object.values(judgeWorkload).reduce((sum, j) => sum + j.teamCount, 0) / totalJudges * 10) / 10
    : 0;

  return {
    totalTeams,
    totalJudges,
    teamsAssigned,
    teamsUnassigned,
    avgWorkload,
    judgeWorkload: Object.values(judgeWorkload)
  };
};

// Get role display info
export const getRoleDisplay = (role) => {
  const roles = {
    primary: { label: 'Primary', color: 'bg-secondary text-white' },
    secondary: { label: 'Secondary', color: 'bg-info/10 text-info' },
    backup: { label: 'Backup', color: 'bg-muted text-muted-foreground' },
  };
  return roles[role] || roles.primary;
};
