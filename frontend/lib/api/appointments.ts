/**
 * Appointment API endpoints
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

export interface Appointment {
  id: string;
  pet_id: string;
  clinic_id: string;
  owner_id: string;
  appointment_date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  reason: string;
  notes?: string;
  diagnosis?: string;
  prescription?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentRequest {
  pet_id: string;
  clinic_id: string;
  appointment_date: string;
  reason: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  diagnosis?: string;
  notes?: string;
  prescription?: string;
}

/**
 * Get all appointments for current user (owner)
 */
export async function getMyAppointments() {
  return apiGet<Appointment[]>('/appointments/my');
}

/**
 * Get single appointment
 */
export async function getAppointment(appointmentId: string) {
  return apiGet<Appointment>(`/appointments/${appointmentId}`);
}

/**
 * Create new appointment
 */
export async function createAppointment(data: CreateAppointmentRequest) {
  return apiPost<Appointment>('/appointments', data);
}

/**
 * Update appointment (clinic only)
 */
export async function updateAppointment(
  appointmentId: string,
  data: UpdateAppointmentRequest
) {
  return apiPut<Appointment>(`/appointments/${appointmentId}`, data);
}

/**
 * Cancel appointment (owner only)
 */
export async function cancelAppointment(appointmentId: string) {
  return apiDelete<void>(`/appointments/${appointmentId}`);
}

/**
 * Get clinic appointments
 */
export async function getClinicAppointments(clinicId: string) {
  return apiGet<Appointment[]>(`/appointments/clinic?clinic_id=${clinicId}`);
}
