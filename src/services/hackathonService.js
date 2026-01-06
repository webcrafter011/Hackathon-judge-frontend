import api from '../lib/api';
import { getAssetById } from './assetService';

/**
 * Hackathon API Service
 * Handles all hackathon-related API calls
 */

// Helper to enrich hackathon with banner URL
const enrichWithBannerUrl = async (hackathon) => {
  if (!hackathon) return hackathon;
  
  // If already has bannerUrl, return as is
  if (hackathon.bannerUrl) return hackathon;
  
  // If has bannerAssetId, fetch the asset to get storageUrl
  if (hackathon.bannerAssetId) {
    try {
      const assetData = await getAssetById(hackathon.bannerAssetId);
      const asset = assetData?.asset || assetData;
      if (asset?.storageUrl || asset?.url) {
        return {
          ...hackathon,
          bannerUrl: asset.storageUrl || asset.url
        };
      }
    } catch (e) {
      // Asset might not exist or user doesn't have access
      console.warn('Could not fetch banner asset:', e);
    }
  }
  
  return hackathon;
};

// Enrich multiple hackathons with banner URLs
const enrichHackathonsWithBanners = async (hackathons) => {
  if (!hackathons || !Array.isArray(hackathons)) return hackathons;
  
  // Get all unique bannerAssetIds
  const assetIds = [...new Set(
    hackathons
      .filter(h => h.bannerAssetId && !h.bannerUrl)
      .map(h => h.bannerAssetId)
  )];
  
  if (assetIds.length === 0) return hackathons;
  
  // Fetch all assets in parallel
  const assetPromises = assetIds.map(id => 
    getAssetById(id).catch(() => null)
  );
  const assetResults = await Promise.all(assetPromises);
  
  // Create a map of assetId -> storageUrl
  const assetUrlMap = {};
  assetResults.forEach((result, index) => {
    if (result) {
      const asset = result.asset || result;
      assetUrlMap[assetIds[index]] = asset.storageUrl || asset.url;
    }
  });
  
  // Enrich hackathons with banner URLs
  return hackathons.map(h => ({
    ...h,
    bannerUrl: h.bannerUrl || assetUrlMap[h.bannerAssetId] || null
  }));
};

// List hackathons with filters and pagination
export const getHackathons = async (params = {}) => {
  const { page = 1, limit = 10, status, visibility, search, tag } = params;
  const queryParams = new URLSearchParams();
  
  queryParams.append('page', page);
  queryParams.append('limit', limit);
  if (status) queryParams.append('status', status);
  if (visibility) queryParams.append('visibility', visibility);
  if (search) queryParams.append('q', search);
  if (tag) queryParams.append('tag', tag);
  
  const response = await api.get(`/hackathons?${queryParams.toString()}`);
  const data = response.data;
  
  // Enrich hackathons with banner URLs
  if (data.hackathons) {
    data.hackathons = await enrichHackathonsWithBanners(data.hackathons);
  }
  
  return data;
};

// Get single hackathon by ID
export const getHackathonById = async (id) => {
  const response = await api.get(`/hackathons/${id}`);
  const data = response.data;
  
  // Enrich hackathon with banner URL
  if (data.hackathon) {
    data.hackathon = await enrichWithBannerUrl(data.hackathon);
  }
  
  return data;
};

// Get hackathon by slug
export const getHackathonBySlug = async (slug) => {
  const response = await api.get(`/hackathons/${slug}`);
  const data = response.data;
  
  // Enrich hackathon with banner URL
  if (data.hackathon) {
    data.hackathon = await enrichWithBannerUrl(data.hackathon);
  }
  
  return data;
};

// Create new hackathon (organizer/admin)
export const createHackathon = async (data) => {
  const response = await api.post('/hackathons', data);
  return response.data;
};

// Update hackathon
export const updateHackathon = async (id, data) => {
  const response = await api.put(`/hackathons/${id}`, data);
  return response.data;
};

// Change hackathon status
export const updateHackathonStatus = async (id, status) => {
  const response = await api.patch(`/hackathons/${id}/status`, { status });
  return response.data;
};

// Assign judges to hackathon
export const assignJudges = async (id, judgeIds) => {
  const response = await api.patch(`/hackathons/${id}/judges`, { judgeIds });
  return response.data;
};

// Remove judge from hackathon
export const removeJudge = async (hackathonId, judgeId) => {
  const response = await api.delete(`/hackathons/${hackathonId}/judges/${judgeId}`);
  return response.data;
};

// Get teams for a hackathon
export const getHackathonTeams = async (hackathonId, params = {}) => {
  const { page = 1 } = params;
  const response = await api.get(`/hackathons/${hackathonId}/teams?page=${page}`);
  return response.data;
};

// Get submissions for a hackathon
export const getHackathonSubmissions = async (hackathonId) => {
  const response = await api.get(`/hackathons/${hackathonId}/submissions`);
  return response.data;
};

// Delete/Archive hackathon (admin only)
export const deleteHackathon = async (id) => {
  const response = await api.delete(`/hackathons/${id}`);
  return response.data;
};

// Get my organized hackathons
export const getMyHackathons = async () => {
  const response = await api.get('/me/hackathons');
  const data = response.data;
  
  // Enrich hackathons with banner URLs
  if (data.hackathons) {
    data.hackathons = await enrichHackathonsWithBanners(data.hackathons);
  }
  
  return data;
};

// Get hackathons I'm judging
export const getMyJudgingHackathons = async () => {
  const response = await api.get('/me/judging');
  const data = response.data;
  
  // Enrich hackathons with banner URLs
  if (data.hackathons) {
    data.hackathons = await enrichHackathonsWithBanners(data.hackathons);
  }
  
  return data;
};

// Status transition helpers
export const HACKATHON_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  RUNNING: 'running',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
};

export const HACKATHON_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  UNLISTED: 'unlisted',
};

// Valid status transitions
export const STATUS_TRANSITIONS = {
  draft: ['open'],
  open: ['running', 'draft'],
  running: ['closed'],
  closed: ['archived'],
  archived: [],
};

// Status display config
export const getStatusConfig = (status) => {
  const config = {
    draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', icon: '📝' },
    open: { label: 'Open', color: 'bg-success/10 text-success', icon: '🟢' },
    running: { label: 'Running', color: 'bg-info/10 text-info', icon: '🚀' },
    closed: { label: 'Closed', color: 'bg-warning/10 text-warning', icon: '🔒' },
    archived: { label: 'Archived', color: 'bg-muted text-muted-foreground', icon: '📦' },
  };
  return config[status] || config.draft;
};

export default {
  getHackathons,
  getHackathonById,
  getHackathonBySlug,
  createHackathon,
  updateHackathon,
  updateHackathonStatus,
  assignJudges,
  removeJudge,
  getHackathonTeams,
  getHackathonSubmissions,
  deleteHackathon,
  getMyHackathons,
  getMyJudgingHackathons,
};
