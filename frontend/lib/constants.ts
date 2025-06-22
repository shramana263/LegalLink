export const API_CONFIG = {
  FASTAPI_HOST_ADDRESS: process.env.NEXT_PUBLIC_FASTAPI_HOST_ADDRESS || 'http://localhost:8000',
} as const;
