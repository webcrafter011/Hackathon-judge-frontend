import api from '../lib/api';

/**
 * Submission API Service
 * Handles team submissions for hackathons
 */

// ========== Submission CRUD ==========

// Create or update a submission
export const saveSubmission = async (data) => {
  // data: { teamId, title, description, repoUrl, demoUrl, isFinal }
  const response = await api.post('/submissions', data);
  return response.data;
};

// Get submission by ID
export const getSubmissionById = async (submissionId) => {
  const response = await api.get(`/submissions/${submissionId}`);
  return response.data;
};

// Get submission by team ID
export const getTeamSubmission = async (teamId) => {
  const response = await api.get(`/teams/${teamId}/submission`);
  return response.data;
};

// Get my submission for a hackathon
export const getMySubmission = async (hackathonId) => {
  const response = await api.get(`/hackathons/${hackathonId}/my-submission`);
  return response.data;
};

// Mark submission as final
export const markSubmissionFinal = async (submissionId) => {
  const response = await api.patch(`/submissions/${submissionId}/final`);
  return response.data;
};

// Delete submission
export const deleteSubmission = async (submissionId) => {
  const response = await api.delete(`/submissions/${submissionId}`);
  return response.data;
};

// ========== Hackathon Submissions (Organizer/Judge) ==========

// List all submissions for a hackathon
export const getHackathonSubmissions = async (hackathonId, params = {}) => {
  const response = await api.get(`/hackathons/${hackathonId}/submissions`, { params });
  return response.data;
};

// ========== Assets ==========

// Add asset to submission
export const addAssetToSubmission = async (submissionId, assetId) => {
  const response = await api.post(`/submissions/${submissionId}/assets`, { assetId });
  return response.data;
};

// Remove asset from submission
export const removeAssetFromSubmission = async (submissionId, assetId) => {
  const response = await api.delete(`/submissions/${submissionId}/assets/${assetId}`);
  return response.data;
};

// Upload submission assets (files)
export const uploadSubmissionAssets = async (submissionId, files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  
  const response = await api.post(`/assets/submissions/${submissionId}/assets`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// ========== Utility Functions ==========

// Get submission status display
export const getSubmissionStatus = (submission) => {
  if (!submission) {
    return { label: 'Not Started', color: 'bg-muted text-muted-foreground', icon: '📝' };
  }
  if (submission.isFinal) {
    return { label: 'Final', color: 'bg-success/10 text-success', icon: '✅' };
  }
  return { label: 'Draft', color: 'bg-warning/10 text-warning', icon: '⏳' };
};

// Check if submission deadline has passed
export const isDeadlinePassed = (hackathon) => {
  if (!hackathon) return false;
  const deadline = hackathon.submissionDeadline || hackathon.endAt;
  return new Date(deadline) < new Date();
};

// Validate submission data
export const validateSubmission = (data) => {
  const errors = {};
  
  if (!data.title?.trim()) {
    errors.title = 'Title is required';
  }
  
  if (!data.description?.trim()) {
    errors.description = 'Description is required';
  } else if (data.description.length < 50) {
    errors.description = 'Description must be at least 50 characters';
  }
  
  if (data.repoUrl && !isValidUrl(data.repoUrl)) {
    errors.repoUrl = 'Invalid repository URL';
  }
  
  if (data.demoUrl && !isValidUrl(data.demoUrl)) {
    errors.demoUrl = 'Invalid demo URL';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// URL validation helper
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};
