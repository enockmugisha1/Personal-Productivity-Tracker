// API Configuration
const getApiUrl = () => {
  // In development, ALWAYS use localhost unless explicitly overridden
  if (import.meta.env.DEV) {
    // Check for explicit override in development
    if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.includes('localhost')) {
      return import.meta.env.VITE_API_URL;
    }
    // Force localhost for development
    return 'http://localhost:5007';
  }
  
  // In production, use environment variable or default to Render URL
  return import.meta.env.VITE_API_URL || 'https://personal-productivity-tracker.onrender.com';
};

export const API_CONFIG = {
  baseURL: getApiUrl(),
  timeout: 10000,
};

// Log the API URL for debugging
console.log('🌐 API URL:', API_CONFIG.baseURL);
console.log('🔧 Environment:', import.meta.env.DEV ? 'development' : 'production');

export default API_CONFIG;
