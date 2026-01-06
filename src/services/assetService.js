import api from '../lib/api';

/**
 * Asset API Service
 * Handles file uploads and asset management
 */

// ========== General Uploads ==========

/**
 * Upload a single file
 * @param {File} file - The file to upload
 * @param {Object} options - Optional { purpose, entityType, entityId }
 * @returns {Promise<{ asset: Object }>}
 */
export const uploadFile = async (file, options = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  if (options.purpose) formData.append('purpose', options.purpose);
  if (options.entityType) formData.append('entityType', options.entityType);
  if (options.entityId) formData.append('entityId', options.entityId);

  // Don't set Content-Type header - browser will set it automatically with boundary
  const response = await api.post('/assets/upload', formData);
  return response.data;
};

/**
 * Upload multiple files
 * @param {File[]} files - Array of files to upload
 * @param {Object} options - Optional { purpose, entityType, entityId }
 * @returns {Promise<{ assets: Object[], count: number }>}
 */
export const uploadMultipleFiles = async (files, options = {}) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  if (options.purpose) formData.append('purpose', options.purpose);
  if (options.entityType) formData.append('entityType', options.entityType);
  if (options.entityId) formData.append('entityId', options.entityId);

  // Don't set Content-Type header - browser will set it automatically with boundary
  const response = await api.post('/assets/upload/multiple', formData);
  return response.data;
};

// ========== Specific Uploads ==========

/**
 * Upload hackathon banner
 * @param {string} hackathonId - Hackathon ID
 * @param {File} bannerFile - The banner image file
 * @returns {Promise<{ asset: Object }>}
 */
export const uploadHackathonBanner = async (hackathonId, bannerFile) => {
  const formData = new FormData();
  formData.append('banner', bannerFile);

  // Don't set Content-Type header - browser will set it automatically with boundary
  const response = await api.post(`/assets/hackathons/${hackathonId}/banner`, formData);
  return response.data;
};

/**
 * Upload submission assets
 * @param {string} submissionId - Submission ID
 * @param {File[]} files - Array of files to upload
 * @returns {Promise<{ assets: Object[], count: number }>}
 */
export const uploadSubmissionAssets = async (submissionId, files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  // Don't set Content-Type header - browser will set it automatically with boundary
  const response = await api.post(`/assets/submissions/${submissionId}/assets`, formData);
  return response.data;
};

/**
 * Upload user avatar
 * @param {File} avatarFile - The avatar image file
 * @returns {Promise<{ asset: Object }>}
 */
export const uploadAvatar = async (avatarFile) => {
  const formData = new FormData();
  formData.append('avatar', avatarFile);

  // Don't set Content-Type header - browser will set it automatically with boundary
  const response = await api.post('/assets/avatar', formData);
  return response.data;
};

// ========== Azure Blob Direct Upload (for large files) ==========

/**
 * Get presigned URL for direct Azure Blob upload
 * @param {Object} params - { filename, contentType, purpose }
 * @returns {Promise<{ uploadUrl: string, blobName: string }>}
 */
export const getPresignedUploadUrl = async ({ filename, contentType, purpose }) => {
  const response = await api.post('/assets/presigned-url', {
    filename,
    contentType,
    purpose,
  });
  return response.data;
};

/**
 * Confirm direct upload after uploading to Azure Blob Storage
 * @param {Object} params - { blobName, filename, mimeType, sizeBytes, purpose, entityType, entityId }
 * @returns {Promise<{ asset: Object }>}
 */
export const confirmDirectUpload = async (params) => {
  const response = await api.post('/assets/confirm-upload', params);
  return response.data;
};

// ========== Asset Management ==========

/**
 * Get current user's assets
 * @param {Object} params - { page, limit, purpose, category }
 * @returns {Promise<{ assets: Object[], pagination: Object }>}
 */
export const getMyAssets = async (params = {}) => {
  const response = await api.get('/assets/my', { params });
  return response.data;
};

/**
 * Get assets for a specific entity
 * @param {string} entityType - 'Submission', 'Hackathon', 'Team', 'User'
 * @param {string} entityId - Entity ID
 * @returns {Promise<{ assets: Object[] }>}
 */
export const getEntityAssets = async (entityType, entityId) => {
  const response = await api.get(`/assets/entity/${entityType}/${entityId}`);
  return response.data;
};

/**
 * Get asset by ID
 * @param {string} assetId - Asset ID
 * @returns {Promise<{ asset: Object }>}
 */
export const getAssetById = async (assetId) => {
  const response = await api.get(`/assets/${assetId}`);
  return response.data;
};

/**
 * Get asset download URL
 * @param {string} assetId - Asset ID
 * @returns {string} - Download URL
 */
export const getAssetDownloadUrl = (assetId) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  return `${baseUrl}/assets/${assetId}/download`;
};

/**
 * Delete asset
 * @param {string} assetId - Asset ID
 * @returns {Promise<{ message: string }>}
 */
export const deleteAsset = async (assetId) => {
  const response = await api.delete(`/assets/${assetId}`);
  return response.data;
};

// ========== Utility Functions ==========

/**
 * Get file icon based on category
 */
export const getFileIcon = (category) => {
  const icons = {
    image: '🖼️',
    document: '📄',
    video: '🎬',
    archive: '📦',
    code: '💻',
    other: '📎',
  };
  return icons[category] || icons.other;
};

/**
 * Get file category from mime type
 */
export const getCategoryFromMimeType = (mimeType) => {
  if (!mimeType) return 'other';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) return 'archive';
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html')) return 'code';
  return 'other';
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
};

/**
 * Validate file type
 */
export const validateFileType = (file, allowedTypes) => {
  if (!allowedTypes || allowedTypes.length === 0) return true;
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.replace('/*', '/'));
    }
    return file.type === type;
  });
};

/**
 * Validate file size
 */
export const validateFileSize = (file, maxSizeMB) => {
  if (!maxSizeMB) return true;
  return file.size <= maxSizeMB * 1024 * 1024;
};

// Allowed types for different purposes
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'text/markdown'];
export const ALLOWED_SUBMISSION_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
  'application/zip',
  'application/x-rar-compressed',
  'video/mp4',
  'video/webm',
];

// Max file sizes
export const MAX_AVATAR_SIZE_MB = 5;
export const MAX_BANNER_SIZE_MB = 10;
export const MAX_SUBMISSION_FILE_SIZE_MB = 50;
