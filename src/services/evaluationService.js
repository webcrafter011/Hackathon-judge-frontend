import api from '../lib/api';

/**
 * Evaluation & Criteria API Service
 * Handles judge evaluations and scoring criteria
 */

// ========== Criteria Management ==========

// Get criteria for a hackathon
export const getCriteria = async (hackathonId) => {
  const response = await api.get(`/hackathons/${hackathonId}/criteria`);
  return response.data;
};

// Create or update criteria (organizer)
export const setCriteria = async (hackathonId, items) => {
  const response = await api.post(`/hackathons/${hackathonId}/criteria`, { items });
  return response.data;
};

// Delete criteria (organizer)
export const deleteCriteria = async (hackathonId) => {
  const response = await api.delete(`/hackathons/${hackathonId}/criteria`);
  return response.data;
};

// ========== Evaluations ==========

// Create or update an evaluation
export const saveEvaluation = async (data) => {
  // data: { submissionId, scores: [{ key, score, comment }], status: 'draft' | 'submitted' }
  const response = await api.post('/evaluations', data);
  return response.data;
};

// Get evaluation by ID
export const getEvaluationById = async (evaluationId) => {
  const response = await api.get(`/evaluations/${evaluationId}`);
  return response.data;
};

// Get my evaluation for a submission
export const getMyEvaluationForSubmission = async (submissionId) => {
  const response = await api.get(`/evaluations/submission/${submissionId}/mine`);
  return response.data;
};

// Get all evaluations for a submission (organizer view)
export const getSubmissionEvaluations = async (submissionId) => {
  const response = await api.get(`/evaluations/submission/${submissionId}`);
  return response.data;
};

// Get my evaluations for a hackathon (judge dashboard)
export const getMyHackathonEvaluations = async (hackathonId) => {
  const response = await api.get(`/evaluations/hackathon/${hackathonId}/mine`);
  return response.data;
};

// Get assigned submissions for judging
export const getAssignedSubmissions = async (hackathonId) => {
  const response = await api.get(`/evaluations/hackathon/${hackathonId}/assigned`);
  return response.data;
};

// Get leaderboard
export const getLeaderboard = async (hackathonId) => {
  const response = await api.get(`/evaluations/hackathon/${hackathonId}/leaderboard`);
  return response.data;
};

// Submit/finalize an evaluation
export const submitEvaluation = async (evaluationId) => {
  const response = await api.patch(`/evaluations/${evaluationId}/submit`);
  return response.data;
};

// Lock evaluation (organizer)
export const lockEvaluation = async (evaluationId) => {
  const response = await api.patch(`/evaluations/${evaluationId}/lock`);
  return response.data;
};

// Delete evaluation
export const deleteEvaluation = async (evaluationId) => {
  const response = await api.delete(`/evaluations/${evaluationId}`);
  return response.data;
};

// ========== Utility Functions ==========

// Calculate weighted total score
export const calculateTotalScore = (scores, criteria) => {
  if (!scores || !criteria?.items) return 0;
  
  let totalWeighted = 0;
  let totalWeight = 0;
  
  criteria.items.forEach(item => {
    const scoreEntry = scores.find(s => s.key === item.key);
    if (scoreEntry) {
      totalWeighted += (scoreEntry.score / item.maxScore) * item.weight;
      totalWeight += item.weight;
    }
  });
  
  return totalWeight > 0 ? (totalWeighted / totalWeight) * 100 : 0;
};

// Get evaluation status display
export const getEvaluationStatus = (evaluation) => {
  if (!evaluation) {
    return { label: 'Not Started', color: 'bg-muted text-muted-foreground' };
  }
  switch (evaluation.status) {
    case 'submitted':
      return { label: 'Submitted', color: 'bg-success/10 text-success' };
    case 'locked':
      return { label: 'Locked', color: 'bg-info/10 text-info' };
    case 'draft':
    default:
      return { label: 'Draft', color: 'bg-warning/10 text-warning' };
  }
};
