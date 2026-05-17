/**
 * Auth API endpoints
 */

import { apiGet } from './client';

export interface AuthUser {
  user_id: string;
  email: string;
  role: 'owner' | 'clinic' | 'admin';
}

export interface AuthResponse extends AuthUser {
  access_token: string;
}

/**
 * Verify JWT token with backend
 */
export async function verifyToken() {
  return apiGet<AuthResponse>('/auth/verify');
}

/**
 * Get current user info
 */
export async function getCurrentUser() {
  return apiGet<AuthUser>('/auth/me');
}

/**
 * Health check
 */
export async function healthCheck() {
  return apiGet<{ status: string; timestamp: string }>('/health');
}
