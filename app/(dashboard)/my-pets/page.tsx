'use client';

import React, { useEffect, useState } from 'react';
import { Plus, X, Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { PetCard } from '@/components/ui/PetCard';

type PetRecord = {
  id: string;
  name: string;
  type: string;
  breed: string;
  date_of_birth: string;
  weight?: number | string | null;
  weight_unit?: string | null;
  profile_image_url?: string | null;
  notes?: string | null;
};

type PetCardModel = {
  id: string;
  name: string;
  type: 'Dog' | 'Cat';
  breed: string;
  age: string;
  imageUrl: string;
  nextVaccine?: string;
};

const FALLBACK_IMAGE_BY_TYPE: Record<'Dog' | 'Cat', string> = {
  Dog: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&h=400&fit=crop',
  Cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&h=400&fit=crop',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DOG_BREEDS = [
  'Sinhala Hound(Street Dog)',
  'Labrador Retriever',
  'German Shepherd',
  'Golden Retriever',
  'Rottweiler',
  'Beagle',
  'Shih Tzu',
  'Pomeranian',
  'Dachshund',
  'Other Mixed Breed',
  'Other Pure Breed',
  'Unknown'
];

const CAT_BREEDS = [
  'Domestic Shorthair (Mixed Breed)',
  'Persian',
  'Siamese',
  'British Shorthair',
  'Bengal',
  'Maine Coon',
  'Ceylon Cat',
  'Other Pure Breed',
  'Unknown'
];

const DOG_BLOOD_TYPES = [
  'DEA 1 Positive',
  'DEA 1 Negative',
  'Unknown'
];

const CAT_BLOOD_TYPES = [
  'Type A',
  'Type B',
  'Type AB',
  'Unknown'
];

export default function MyPets() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [petPhoto, setPetPhoto] = useState<string | null>(null);
  const [petPhotoFile, setPetPhotoFile] = useState<File | null>(null);
  const [petForm, setPetForm] = useState({
    name: '',
    type: 'Dog',
    gender: 'Male',
    breed: 'Unknown',
    dateOfBirth: '',
    weight: '',
    weightUnit: 'kg',
    bloodType: 'Unknown',
    allergies: '',
    medicalConditions: '',
    notes: '',
  });
  const [vaccineRecords, setVaccineRecords] = useState<File[]>([]);
  const [pets, setPets] = useState<PetCardModel[]>([]);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [petsError, setPetsError] = useState<string | null>(null);

  const getCurrentUserId = () => {
    const userId = user?.id || localStorage.getItem('user_id') || '';
    return UUID_PATTERN.test(userId) ? userId : '';
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '';
    const birthDate = new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? `${age} years` : 'Less than 1 year';
  };

  const mapPetRecord = (pet: PetRecord): PetCardModel => {
    const normalizedType = pet.type?.toLowerCase() === 'cat' ? 'Cat' : 'Dog';
    return {
      id: pet.id,
      name: pet.name,
      type: normalizedType,
      breed: pet.breed,
      age: calculateAge(pet.date_of_birth),
      imageUrl: pet.profile_image_url || FALLBACK_IMAGE_BY_TYPE[normalizedType],
    };
  };

  const fetchPets = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setPetsError('Please log in again to load your pets.');
      setIsLoadingPets(false);
      return;
    }

    try {
      setIsLoadingPets(true);
      setPetsError(null);
      const response = await fetch(
        `http://localhost:8000/api/pets?user_id=${encodeURIComponent(userId)}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch pets (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const records: PetRecord[] = data.pets || [];
      setPets(records.map(mapPetRecord));
    } catch (error) {
      console.error('Error fetching pets:', error);
      setPetsError(error instanceof Error ? error.message : 'Failed to load pets');
    } finally {
      setIsLoadingPets(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [user?.id]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPetPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPetPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'type') {
      setPetForm((prev) => ({
        ...prev,
        type: value,
        breed: 'Unknown',
        bloodType: 'Unknown',
      }));
    } else {
      setPetForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleVaccineRecordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setVaccineRecords((prev) => [...prev, ...files]);
  };

  const removeVaccineRecord = (index: number) => {
    setVaccineRecords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userId = getCurrentUserId();
    if (!userId) {
      alert('Please log in again to add a pet.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/pets', {
        method: 'POST',
        body: (() => {
          const formData = new FormData();
          formData.append('user_id', userId);
          formData.append('name', petForm.name.trim());
          formData.append('pet_type', petForm.type.toLowerCase());
          formData.append('breed', petForm.breed.trim());
          formData.append('date_of_birth', petForm.dateOfBirth);
          formData.append('weight', petForm.weight);
          formData.append('weight_unit', petForm.weightUnit);
          formData.append('gender', petForm.gender);
          formData.append('blood_type', petForm.bloodType);
          formData.append('allergies', petForm.allergies);
          formData.append('medical_conditions', petForm.medicalConditions);
          formData.append('notes', petForm.notes);
          if (petPhotoFile) {
            formData.append('photo', petPhotoFile);
          }
          return formData;
        })(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add pet (${response.status}): ${errorText}`);
      }

      await fetchPets();
      setPetForm({
        name: '',
        type: 'Dog',
        gender: 'Male',
        breed: '',
        dateOfBirth: '',
        weight: '',
        weightUnit: 'kg',
        bloodType: '',
        allergies: '',
        medicalConditions: '',
        notes: '',
      });
      setPetPhoto(null);
      setPetPhotoFile(null);
      setVaccineRecords([]);
      setIsAddModalOpen(false);
      alert('Pet added successfully!');
    } catch (error) {
      console.error('Error adding pet:', error);
      alert(error instanceof Error ? error.message : 'Failed to add pet');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            My Pets
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage your dogs and cats profiles.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 font-medium text-white transition-colors rounded-lg shadow-sm bg-primary-600 hover:bg-primary-700 shadow-primary-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Pet
        </button>
      </div>

      {isLoadingPets && (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
          Loading your pets...
        </div>
      )}

      {petsError && !isLoadingPets && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-300">
          {petsError}
        </div>
      )}

      {!isLoadingPets && !petsError && pets.length === 0 && (
        <div className="p-8 text-center border border-dashed rounded-2xl border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400">
          No pets yet. Add your first pet to see it here.
        </div>
      )}

      {!isLoadingPets && pets.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pets.map((pet) => (
            <PetCard key={pet.id} {...pet} />
          ))}
        </div>
      )}

      {/* Add Pet Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg overflow-hidden bg-white border shadow-xl dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Add New Pet
                </h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[80vh]">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Photo Upload */}
                  <div className="flex justify-center">
                    <label className="relative flex flex-col items-center justify-center w-40 h-40 overflow-hidden transition-colors border-2 border-dashed rounded-full cursor-pointer border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      {petPhoto ? (
                        <>
                          <img src={petPhoto} alt="Pet" className="object-cover w-full h-full" />
                          <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-slate-900/60 group-hover:opacity-100">
                            <ImageIcon className="w-6 h-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-2" />
                          <span className="px-2 text-xs font-medium text-center">Upload Pet Photo</span>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Basic Info */}
                  <div className="p-4 space-y-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Basic Information</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Pet Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={petForm.name}
                          onChange={handleInputChange}
                          required
                          placeholder="e.g., Max, Luna"
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Type *
                        </label>
                        <select
                          name="type"
                          value={petForm.type}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                        >
                          <option>Dog</option>
                          <option>Cat</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Gender *
                        </label>
                        <select
                          name="gender"
                          value={petForm.gender}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                        >
                          <option>Male</option>
                          <option>Female</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Breed *
                        </label>
                        <select
                          name="breed"
                          value={petForm.breed}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                        >
                          {(petForm.type.toLowerCase() === 'cat' ? CAT_BREEDS : DOG_BREEDS).map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Date of Birth *
                        </label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={petForm.dateOfBirth}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                        />
                        {petForm.dateOfBirth && (
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Age: {calculateAge(petForm.dateOfBirth)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Health Info */}
                  <div className="p-4 space-y-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Health Information</h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Weight *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.1"
                            name="weight"
                            value={petForm.weight}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g., 25"
                            className="flex-1 min-w-0 px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                          />
                          <select
                            name="weightUnit"
                            value={petForm.weightUnit}
                            onChange={handleInputChange}
                            className="w-20 px-2 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white text-sm"
                          >
                            <option>kg</option>
                            <option>lbs</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Blood Type
                        </label>
                        <select
                          name="bloodType"
                          value={petForm.bloodType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                        >
                          {(petForm.type.toLowerCase() === 'cat' ? CAT_BLOOD_TYPES : DOG_BLOOD_TYPES).map((bt) => (
                            <option key={bt} value={bt}>{bt}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Vaccine Records (Images/PDFs)
                        </label>
                        <div className="space-y-2">
                          <label className="flex flex-col items-center justify-center w-full px-4 py-3 transition-colors border-2 border-dashed rounded-lg cursor-pointer border-slate-300 dark:border-slate-600 hover:border-primary-500 dark:hover:border-primary-400 bg-slate-50 dark:bg-slate-700/50">
                            <div className="flex flex-col items-center justify-center">
                              <Upload className="w-5 h-5 mb-1 text-slate-400" />
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                Click to upload vaccine records
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                PNG, JPG, PDF (max 5MB each)
                              </p>
                            </div>
                            <input
                              type="file"
                              multiple
                              accept="image/*,.pdf"
                              onChange={handleVaccineRecordsChange}
                              className="hidden"
                            />
                          </label>
                          {vaccineRecords.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                {vaccineRecords.length} file(s) selected:
                              </p>
                              {vaccineRecords.map((file, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2 text-sm border rounded bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800"
                                >
                                  <span className="truncate text-slate-700 dark:text-slate-200">
                                    {file.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeVaccineRecord(idx)}
                                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Known Allergies
                        </label>
                        <textarea
                          name="allergies"
                          value={petForm.allergies}
                          onChange={handleInputChange}
                          placeholder="e.g., Chicken, Dairy"
                          rows={2}
                          maxLength={200}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white resize-none text-sm"
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {petForm.allergies.length}/200
                        </p>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Medical Conditions / Special Needs
                        </label>
                        <textarea
                          name="medicalConditions"
                          value={petForm.medicalConditions}
                          onChange={handleInputChange}
                          placeholder="e.g., Diabetes, Heart condition"
                          rows={2}
                          maxLength={300}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white resize-none text-sm"
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {petForm.medicalConditions.length}/300
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Additional Notes
                    </label>
                    <textarea
                      name="notes"
                      value={petForm.notes}
                      onChange={handleInputChange}
                      placeholder="Any other important information about your pet..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white resize-none"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {petForm.notes.length}/500
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setPetPhoto(null);
                        setVaccineRecords([]);
                        setPetForm({
                          name: '',
                          type: 'Dog',
                          gender: 'Male',
                          breed: '',
                          dateOfBirth: '',
                          weight: '',
                          weightUnit: 'kg',
                          bloodType: '',
                          allergies: '',
                          medicalConditions: '',
                          notes: '',
                        });
                      }}
                      className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!petForm.name || !petForm.breed || !petForm.dateOfBirth || !petForm.weight}
                      className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      Add Pet
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
