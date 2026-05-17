/**
 * Pet API endpoints
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: 'dog' | 'cat' | 'rabbit' | 'bird' | 'other';
  breed: string;
  age: number;
  weight: number;
  medical_history?: string;
  created_at: string;
}

export interface CreatePetRequest {
  name: string;
  species: 'dog' | 'cat' | 'rabbit' | 'bird' | 'other';
  breed: string;
  age: number;
  weight: number;
  medical_history?: string;
}

/**
 * Get all pets for current user
 */
export async function getPets() {
  return apiGet<Pet[]>('/pets');
}

/**
 * Get single pet by ID
 */
export async function getPet(petId: string) {
  return apiGet<Pet>(`/pets/${petId}`);
}

/**
 * Create new pet
 */
export async function createPet(data: CreatePetRequest) {
  return apiPost<Pet>('/pets', data);
}

/**
 * Update pet
 */
export async function updatePet(petId: string, data: Partial<CreatePetRequest>) {
  return apiPut<Pet>(`/pets/${petId}`, data);
}

/**
 * Delete pet
 */
export async function deletePet(petId: string) {
  return apiDelete(`/pets/${petId}`);
}
