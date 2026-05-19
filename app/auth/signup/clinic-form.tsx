'use client';

import React, { useState } from 'react';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Upload,
  CheckCircle,
  Stethoscope,
  Plus,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface ClinicFormData {
  clinicName: string;
  contactNumber: string;
  email: string;
  address: string;
  description: string;
  operatingHours: string;
  mainVeterinarianName: string;
  specialties: string;
  otherDoctors: string[];
  licenseFile: File | null;
  clinicPhoto: File | null;
}

interface ClinicSignupFormProps {
  onSubmit: (data: ClinicFormData) => void;
  isLoading: boolean;
}

export function ClinicSignupForm({ onSubmit, isLoading }: ClinicSignupFormProps) {
  const [formData, setFormData] = useState<ClinicFormData>({
    clinicName: '',
    contactNumber: '',
    email: '',
    address: '',
    description: '',
    operatingHours: '',
    mainVeterinarianName: '',
    specialties: '',
    otherDoctors: [],
    licenseFile: null,
    clinicPhoto: null,
  });

  const [tempDoctorName, setTempDoctorName] = useState('');

  const [uploadStates, setUploadStates] = useState({
    license: false,
    photo: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: 'license' | 'photo'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [fileType === 'license' ? 'licenseFile' : 'clinicPhoto']: file,
      }));
      setUploadStates((prev) => ({ ...prev, [fileType]: true }));
    }
  };

  const handleAddDoctor = () => {
    if (tempDoctorName.trim()) {
      setFormData((prev) => ({
        ...prev,
        otherDoctors: [...prev.otherDoctors, tempDoctorName.trim()],
      }));
      setTempDoctorName('');
    }
  };

  const handleRemoveDoctor = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      otherDoctors: prev.otherDoctors.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isFormValid =
    formData.clinicName &&
    formData.contactNumber &&
    formData.email &&
    formData.address &&
    formData.description &&
    formData.operatingHours &&
    formData.mainVeterinarianName &&
    formData.specialties &&
    formData.licenseFile;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Clinic Information Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 border bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Clinic Information
          </h3>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Clinic Name *
            </label>
            <input
              type="text"
              name="clinicName"
              value={formData.clinicName}
              onChange={handleInputChange}
              required
              placeholder="Enter clinic name"
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Contact Number *
            </label>
            <div className="relative">
              <Phone className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                required
                placeholder="+94 7X XXX XXXX"
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="clinic@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Address *
            </label>
            <div className="relative">
              <MapPin className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                placeholder="Street, City, Province"
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Operating Hours *
            </label>
            <input
              type="text"
              name="operatingHours"
              value={formData.operatingHours}
              onChange={handleInputChange}
              required
              placeholder="e.g., Mon-Sat 9AM-6PM, Sun 10AM-4PM"
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 mt-5">
            Description / Services *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            placeholder="Brief description of your clinic and services offered"
            rows={3}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white resize-none"
          />
        </div>
      </motion.div>

      {/* Veterinarian & Team Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 border bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
            <Stethoscope className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Veterinarian & Team
          </h3>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Main Veterinarian / Doctor Name *
            </label>
            <input
              type="text"
              name="mainVeterinarianName"
              value={formData.mainVeterinarianName}
              onChange={handleInputChange}
              required
              placeholder="e.g., Dr. Sarah Jenkins"
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Specialties *
            </label>
            <input
              type="text"
              name="specialties"
              value={formData.specialties}
              onChange={handleInputChange}
              required
              placeholder="e.g., Dogs, Cats, Surgery, Internal Medicine"
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-600">
          <label className="block mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            Other Doctors / Team Members
          </label>

          {/* Add Doctor Input */}
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={tempDoctorName}
              onChange={(e) => setTempDoctorName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddDoctor()}
              placeholder="e.g., Dr. Michael Chen"
              className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
            />
            <motion.button
              type="button"
              onClick={handleAddDoctor}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add
            </motion.button>
          </div>

          {/* Added Doctors List */}
          {formData.otherDoctors.length > 0 && (
            <div className="space-y-2">
              {formData.otherDoctors.map((doctor, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between px-4 py-3 bg-white border rounded-lg dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {doctor}
                    </span>
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => handleRemoveDoctor(index)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Verification Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 border bg-amber-50 dark:bg-amber-900/20 rounded-2xl border-amber-200 dark:border-amber-800"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
            <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Verification Documents
          </h3>
        </div>

        <div className="space-y-5">
          {/* License Upload */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              License / Registration Document *
            </label>
            <div className="relative">
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'license')}
                accept=".pdf,.jpg,.jpeg,.png"
                required
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center gap-3 px-4 py-3 transition-colors bg-white border-2 border-dashed rounded-lg dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-primary-500">
                {uploadStates.license ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        {formData.licenseFile?.name}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        File uploaded successfully
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Click to upload license
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        PDF, JPG, or PNG
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Clinic Photo Upload */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Clinic Photo
            </label>
            <div className="relative">
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'photo')}
                accept=".jpg,.jpeg,.png"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center gap-3 px-4 py-3 transition-colors bg-white border-2 border-dashed rounded-lg dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-primary-500">
                {uploadStates.photo ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        {formData.clinicPhoto?.name}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        File uploaded successfully
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Click to upload clinic photo
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        JPG or PNG (optional)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border rounded-lg dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-900 dark:text-white">
                ℹ️ Your clinic will be reviewed by our admin team before being visible to pet owners.
              </span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={!isFormValid || isLoading}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="flex items-center justify-center w-full gap-2 py-3 font-semibold text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" />
            Creating clinic account...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            Create Clinic Account
          </>
        )}
      </motion.button>
    </form>
  );
}
