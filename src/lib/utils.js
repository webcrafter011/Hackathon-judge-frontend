/**
 * Utility function to conditionally join class names
 * @param  {...string} classes - Class names to join
 * @returns {string} - Joined class names
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  return new Date(date).toLocaleDateString('en-US', defaultOptions);
}

/**
 * Format date with time
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date time string
 */
export function formatDateTime(date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} - Truncated text
 */
export function truncate(text, length = 100) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} - Initials
 */
export function getInitials(name) {
  if (!name) return '';
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get error message from API error response
 * @param {Error} error - Error object
 * @returns {string} - Error message
 */
export function getErrorMessage(error) {
  if (error.response?.data?.errors) {
    // Validation errors array
    return error.response.data.errors.map((e) => e.msg).join(', ');
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
