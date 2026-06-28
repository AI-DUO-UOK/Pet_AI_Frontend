import { apiFetch } from '@/lib/api';

export interface OwnerProfileData {
  first_name: string;
  last_name: string;
  phone: string;
  address?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  bio?: string;
}

export const authService = {
  /**
   * Register a pet owner profile in the backend
   */
  async registerOwner(email: string, profileData: OwnerProfileData, token?: string) {
    void email;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return apiFetch('/api/auth/register/owner', {
      method: 'POST',
      headers,
      body: JSON.stringify(profileData),
    });
  },

  /**
   * Register a clinic profile in the backend (multipart/form-data)
   */
  async registerClinic(formData: FormData, token?: string) {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return apiFetch('/api/auth/register/clinic', {
      method: 'POST',
      headers,
      body: formData,
    });
  },
};
export default authService;
