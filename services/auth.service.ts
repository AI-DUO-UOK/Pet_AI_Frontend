const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/register/owner`, {
      method: 'POST',
      headers,
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to register owner profile');
    }

    return response.json();
  },

  /**
   * Register a clinic profile in the backend (multipart/form-data)
   */
  async registerClinic(formData: FormData, token?: string) {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/register/clinic`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to register clinic profile');
    }

    return response.json();
  },
};
export default authService;
