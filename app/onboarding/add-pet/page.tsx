'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dog, Upload, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface PetData {
  name: string;
  type: 'dog' | 'cat';
  breed: string;
  age: string;
  photo?: File;
}

export default function AddPetPage() {
  const [petData, setPetData] = useState<PetData>({
    name: '',
    type: 'dog',
    breed: '',
    age: '',
  });
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const { user } = useAuth();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setPetData((prev) => ({ ...prev, [name]: value }));
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

    if (!petData.age.trim()) {
      newErrors.age = 'Age is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // TODO: Save pet to backend
      console.log('Pet data:', petData);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error adding pet:', error);
      setErrors({ submit: 'Failed to add pet. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
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
              Let's get {user?.name?.split(' ')[0]}'s furry friend set up!
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

            {/* Pet Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Pet Name *
              </label>
              <input
                type="text"
                name="name"
                value={petData.name}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white ${
                  touched.name && errors.name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
                placeholder="Max, Bella, etc."
              />
              {touched.name && errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Pet Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Pet Type *
              </label>
              <select
                name="type"
                value={petData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
              >
                <option value="dog">🐕 Dog</option>
                <option value="cat">🐱 Cat</option>
              </select>
            </div>

            {/* Breed */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Breed *
              </label>
              <input
                type="text"
                name="breed"
                value={petData.breed}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white ${
                  touched.breed && errors.breed
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
                placeholder="Labrador Retriever, Persian, etc."
              />
              {touched.breed && errors.breed && (
                <p className="text-sm text-red-500 mt-1">{errors.breed}</p>
              )}
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Age *
              </label>
              <input
                type="text"
                name="age"
                value={petData.age}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white ${
                  touched.age && errors.age
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
                placeholder="2 years, 8 months, etc."
              />
              {touched.age && errors.age && (
                <p className="text-sm text-red-500 mt-1">{errors.age}</p>
              )}
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
