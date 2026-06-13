'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dog, Upload, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface PetData {
  name: string;
  type: 'dog' | 'cat';
  gender: string;
  breed: string;
  dateOfBirth: string;
  weight: string;
  weightUnit: string;
  bloodType: string;
  allergies: string;
  medicalConditions: string;
  notes: string;
  photo?: File;
}

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

export default function AddPetPage() {
  const [petData, setPetData] = useState<PetData>({
    name: '',
    type: 'dog',
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

  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const { user } = useAuth();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'type') {
      setPetData((prev) => ({
        ...prev,
        type: value as 'dog' | 'cat',
        breed: 'Unknown',
        bloodType: 'Unknown',
      }));
    } else {
      setPetData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPetData((prev) => ({ ...prev, photo: file }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!petData.name.trim()) {
      newErrors.name = 'Pet name is required';
    }

    if (!petData.breed.trim()) {
      newErrors.breed = 'Breed is required';
    }

    if (!petData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (!petData.weight || isNaN(Number(petData.weight)) || Number(petData.weight) <= 0) {
      newErrors.weight = 'Please enter a valid weight';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const calculateAge = (dobString: string) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? `${age} years` : 'Less than 1 year';
  };

  const getCurrentUserId = () => {
    const userId = user?.id || localStorage.getItem('user_id') || '';
    const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return UUID_PATTERN.test(userId) ? userId : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const userId = getCurrentUserId();
    if (!userId) {
      setErrors({ submit: 'User session not found. Please log in again.' });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('name', petData.name.trim());
      formData.append('pet_type', petData.type.toLowerCase());
      formData.append('breed', petData.breed.trim());
      formData.append('date_of_birth', petData.dateOfBirth);
      formData.append('weight', petData.weight);
      formData.append('weight_unit', petData.weightUnit);
      formData.append('gender', petData.gender);
      formData.append('blood_type', petData.bloodType);
      formData.append('allergies', petData.allergies);
      formData.append('medical_conditions', petData.medicalConditions);
      formData.append('notes', petData.notes);

      if (petData.photo) {
        formData.append('photo', petData.photo);
      }

      const response = await fetch('http://localhost:8000/api/pets', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add pet (${response.status}): ${errorText}`);
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error adding pet:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to add pet. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
      >
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                <Dog className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Add Your First Pet
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Let's get {user?.name?.split(' ')[0]}'s furry friend set up with their medical records.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pet Photo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Pet Photo (Optional)
              </label>
              <div className="relative">
                {photoPreview ? (
                  <div className="relative group">
                    <img
                      src={photoPreview}
                      alt="Pet preview"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview('');
                        setPetData((prev) => ({ ...prev, photo: undefined }));
                      }}
                      className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <span className="text-white font-medium">Change</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Click to upload
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Basic Information Section */}
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
                    value={petData.name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    required
                    className={`w-full px-4 py-2.5 bg-white dark:bg-slate-700 border rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white ${
                      touched.name && errors.name
                        ? 'border-red-500 dark:border-red-500'
                        : 'border-slate-200 dark:border-slate-600'
                    }`}
                    placeholder="e.g., Max, Luna"
                  />
                  {touched.name && errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Type *
                  </label>
                  <select
                    name="type"
                    value={petData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={petData.gender}
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
                    value={petData.breed}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                  >
                    {(petData.type.toLowerCase() === 'cat' ? CAT_BREEDS : DOG_BREEDS).map((b) => (
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
                    value={petData.dateOfBirth}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    required
                    className={`w-full px-4 py-2.5 bg-white dark:bg-slate-700 border rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white ${
                      touched.dateOfBirth && errors.dateOfBirth
                        ? 'border-red-500 dark:border-red-500'
                        : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {touched.dateOfBirth && errors.dateOfBirth && (
                    <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth}</p>
                  )}
                  {petData.dateOfBirth && (
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      Age: <strong>{calculateAge(petData.dateOfBirth)}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Health Information Section */}
            <div className="p-4 space-y-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Health Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Weight *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      name="weight"
                      value={petData.weight}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      placeholder="e.g., 25"
                      className={`flex-1 min-w-0 px-4 py-2.5 bg-white dark:bg-slate-700 border rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white ${
                        touched.weight && errors.weight
                          ? 'border-red-500 dark:border-red-500'
                          : 'border-slate-200 dark:border-slate-600'
                      }`}
                    />
                    <select
                      name="weightUnit"
                      value={petData.weightUnit}
                      onChange={handleInputChange}
                      className="w-20 px-2 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white text-sm"
                    >
                      <option>kg</option>
                      <option>lbs</option>
                    </select>
                  </div>
                  {touched.weight && errors.weight && (
                    <p className="text-sm text-red-500 mt-1">{errors.weight}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Blood Type
                  </label>
                  <select
                    name="bloodType"
                    value={petData.bloodType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                  >
                    {(petData.type.toLowerCase() === 'cat' ? CAT_BLOOD_TYPES : DOG_BLOOD_TYPES).map((bt) => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Known Allergies
                  </label>
                  <textarea
                    name="allergies"
                    value={petData.allergies}
                    onChange={handleInputChange}
                    placeholder="e.g., Chicken, Dairy"
                    rows={2}
                    maxLength={200}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white resize-none text-sm"
                  />
                  <p className="mt-1 text-right text-xs text-slate-500 dark:text-slate-400">
                    {petData.allergies.length}/200
                  </p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Medical Conditions / Special Needs
                  </label>
                  <textarea
                    name="medicalConditions"
                    value={petData.medicalConditions}
                    onChange={handleInputChange}
                    placeholder="e.g., Diabetes, Heart condition"
                    rows={2}
                    maxLength={300}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white resize-none text-sm"
                  />
                  <p className="mt-1 text-right text-xs text-slate-500 dark:text-slate-400">
                    {petData.medicalConditions.length}/300
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Notes Section */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={petData.notes}
                onChange={handleInputChange}
                placeholder="Any other important information about your pet..."
                rows={3}
                maxLength={500}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white resize-none"
              />
              <p className="mt-1 text-right text-xs text-slate-500 dark:text-slate-400">
                {petData.notes.length}/500
              </p>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  Add Pet
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Skip Option */}
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-2 font-medium transition-colors"
            >
              Skip for now
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-lg">
            <p className="text-sm text-primary-900 dark:text-primary-200 leading-relaxed">
              💡 You can add more pets and update details anytime from your dashboard.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
