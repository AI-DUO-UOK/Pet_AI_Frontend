/**
 * Clinic API endpoints
 */

import { apiGet, apiPost, apiPut } from './client';

export interface Clinic {
  id: string;
  owner_id: string;
  clinic_name: string;
  email: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  specializations: string[];
  operating_hours?: string;
  rating: number;
  reviews_count: number;
  is_approved: boolean;
  created_at: string;
}

export interface CreateClinicRequest {
  clinic_name: string;
  email: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  specializations?: string[];
  operating_hours?: string;
}

export interface UpdateClinicRequest {
  clinic_name?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  specializations?: string[];
  operating_hours?: string;
}

/**
 * Get all approved clinics (public)
 */
export async function getApprovedClinics() {
  return apiGet<Clinic[]>('/clinics');
}

/**
 * Get single clinic
 */
export async function getClinic(clinicId: string) {
  return apiGet<Clinic>(`/clinics/${clinicId}`);
}

/**
 * Get clinics by location
 */
export async function getClinicsByLocation(
  latitude: number,
  longitude: number,
  radiusKm: number = 10
) {
  return apiGet<Clinic[]>(
    `/clinics/search/location?latitude=${latitude}&longitude=${longitude}&radius_km=${radiusKm}`
  );
}

/**
 * Create clinic (clinic staff)
 */
export async function createClinic(data: CreateClinicRequest) {
  return apiPost<Clinic>('/clinics', data);
}

/**
 * Update clinic (owner only)
 */
export async function updateClinic(clinicId: string, data: UpdateClinicRequest) {
  return apiPut<Clinic>(`/clinics/${clinicId}`, data);
}

/**
 * Get clinic dashboard (owner only)
 */
export async function getClinicDashboard(clinicId: string) {
  return apiGet<Clinic>(`/clinics/${clinicId}/dashboard`);
}
