
export const API_BASE = typeof window === 'undefined'
  ? (process.env.BACKEND_URL || 'http://backend:8090')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090');
