// Environment configuration
const config = {
  // For Vercel deployment, use relative API paths
  apiUrl: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000'),
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD
};

export default config;