'use client';

import React, { useState } from 'react';
import { Plus, X, Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PetCard } from '@/components/ui/PetCard';

const MOCK_PETS = [
  {
    id: '1',
    name: 'Max',
    type: 'Dog' as const,
    breed: 'Golden Retriever',
    age: '3 years',
    imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&h=400&fit=crop',
    nextVaccine: 'Oct 25, 2023',
  },
  {
    id: '2',
    name: 'Luna',
    type: 'Cat' as const,
    breed: 'British Shorthair',
    age: '2 years',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&h=400&fit=crop',
  },
];

export default function MyPets() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [petPhoto, setPetPhoto] = useState<string | null>(null);
  const [petForm, setPetForm] = useState({
    name: '',
    type: 'Dog',
    gender: 'Male',
    breed: '',
    dateOfBirth: '',
    weight: '',
    weightUnit: 'kg',
    bloodType: '',
    microchipId: '',
    allergies: '',
    medicalConditions: '',
    notes: '',
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    setPetForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Pet added:', { ...petForm, photo: petPhoto });
    // Reset form
    setPetForm({
      name: '',
      type: 'Dog',
      gender: 'Male',
      breed: '',
      dateOfBirth: '',
      weight: '',
      weightUnit: 'kg',
      bloodType: '',
      microchipId: '',
      allergies: '',
      medicalConditions: '',
      notes: '',
    });
    setPetPhoto(null);
    setIsAddModalOpen(false);
    alert('Pet added successfully!');
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? `${age} years` : 'Less than 1 year';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            My Pets
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your dogs and cats profiles.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm shadow-primary-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Pet
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MOCK_PETS.map((pet) => (
          <PetCard key={pet.id} {...pet} />
        ))}
      </div>

      {/* Add Pet Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
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
                    <label className="w-40 h-40 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative overflow-hidden group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      {petPhoto ? (
                        <>
                          <img src={petPhoto} alt="Pet" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-2" />
                          <span className="text-xs font-medium text-center px-2">Upload Pet Photo</span>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Basic Information</h3>

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
                        <input
                          type="text"
                          name="breed"
                          value={petForm.breed}
                          onChange={handleInputChange}
                          required
                          placeholder="e.g., Golden Retriever"
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                        />
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
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Age: {calculateAge(petForm.dateOfBirth)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Health Info */}
                  <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Health Information</h3>

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
                            value={petForm.weight}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g., 25"
                            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                          />
                          <select
                            name="weightUnit"
                            value={petForm.weightUnit}
                            onChange={handleInputChange}
                            className="px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white text-sm"
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
                        <input
                          type="text"
                          name="bloodType"
                          value={petForm.bloodType}
                          onChange={handleInputChange}
                          placeholder="e.g., Type A, Type B"
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Microchip ID
                        </label>
                        <input
                          type="text"
                          name="microchipId"
                          value={petForm.microchipId}
                          onChange={handleInputChange}
                          placeholder="e.g., ABC123456789"
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white font-mono text-sm"
                        />
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
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {petForm.notes.length}/500
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setPetPhoto(null);
                        setPetForm({
                          name: '',
                          type: 'Dog',
                          gender: 'Male',
                          breed: '',
                          dateOfBirth: '',
                          weight: '',
                          weightUnit: 'kg',
                          bloodType: '',
                          microchipId: '',
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
