// API Configuration
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5007',
  timeout: 10000,
};

export default API_CONFIG;
