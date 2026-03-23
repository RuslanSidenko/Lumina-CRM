
export const API_BASE = typeof window === 'undefined'
  ? (process.env.BACKEND_URL || 'http://backend:8090')
  : ''; // Empty string means use relative path on client browser
