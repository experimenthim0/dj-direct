/**
 * Centralized API configuration to handle environment variable fallbacks.
 * In production, VITE_BACKEND_URL must be set in the build environment (e.g., Vercel settings).
 */

const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  
  if (envUrl && envUrl.trim() !== '') {
    return envUrl;
  }

  // Fallback for development if .env is missing or variable is empty
  if (import.meta.env.DEV) {
    console.warn('VITE_BACKEND_URL is missing. Falling back to localhost:5000 for development.');
    return 'http://localhost:5000';
  }

  // In production, if the URL is missing, we log a critical error
  console.error(
    'CRITICAL: VITE_BACKEND_URL is missing in production build! ' +
    'Requests will fail or go to the wrong destination. ' +
    'Please set this environment variable in your deployment platform.'
  );

  return ''; // This will result in relative paths, making the error visible in the network tab
};

export const API_BASE_URL = getBackendUrl();
