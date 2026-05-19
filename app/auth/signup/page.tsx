'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dog, Mail, Lock, User, ArrowRight, ArrowLeft, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { PetOwnerSignupForm, type PetOwnerFormData } from './pet-owner-form';
import { ClinicSignupForm, type ClinicFormData } from './clinic-form';
import { ClinicVerificationModal } from './verification-modal';

type SignupStep = 'basic' | 'role' | 'owner-details' | 'clinic-details';

export default function SignupPage() {
  const [step, setStep] = useState<SignupStep>('role');
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleBasicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('role');
  };

  const handleRoleSelect = (role: 'owner' | 'clinic') => {
    if (role === 'owner') {
      setStep('owner-details');
    } else {
      setStep('clinic-details');
    }
  };

  const handlePetOwnerSignup = async (formData: PetOwnerFormData) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Store owner data in auth context
      login('owner', {
        id: 'new-owner',
        name: formData.name,
        email: formData.email,
      });

      // Redirect to pet onboarding
      router.push('/onboarding/add-pet');
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClinicSignup = async (formData: ClinicFormData) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setClinicName(formData.clinicName);

      // Store clinic data in auth context
      login('clinic', {
        id: 'new-clinic',
        name: formData.clinicName,
        email: basicInfo.email,
        clinicName: formData.clinicName,
        verificationStatus: 'pending',
        submittedDate: new Date().toISOString(),
      });

      setShowVerificationModal(true);
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationModalClose = () => {
    setShowVerificationModal(false);
    router.push('/clinic/dashboard');
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 dark:bg-slate-950">
      {/* Basic Info Step */}
      {step === 'basic' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md overflow-hidden bg-white border shadow-xl dark:bg-slate-900 rounded-2xl border-slate-100 dark:border-slate-800"
        >
          <div className="p-8">
            <div className="flex justify-center mb-8">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl text-primary-600 dark:text-primary-400">
                <Dog className="w-8 h-8" />
              </div>
            </div>

            <h2 className="mb-2 text-2xl font-bold text-center text-slate-900 dark:text-white">
              Create an account
            </h2>
            <p className="mb-8 text-center text-slate-500 dark:text-slate-400">
              Join Dr. Paw to manage your pet's health or clinic.
            </p>

            <form onSubmit={handleBasicSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={basicInfo.name}
                    onChange={(e) =>
                      setBasicInfo((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={basicInfo.email}
                    onChange={(e) =>
                      setBasicInfo((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={basicInfo.password}
                    onChange={(e) =>
                      setBasicInfo((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 text-sm text-center">
              <span className="text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <a
                  href="/auth/login"
                  className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Sign in
                </a>
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Role Selection Step */}
      {step === 'role' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl"
        >
          <button
            onClick={() => router.push('/auth/login')}
            className="flex items-center gap-2 mb-6 font-medium transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>

          <div>
            <h1 className="mb-4 text-3xl font-bold md:text-4xl text-slate-900 dark:text-white">
              How will you use Dr. Paw?
            </h1>
            <p className="mb-8 text-lg text-slate-500 dark:text-slate-400">
              Choose your account type to personalize your experience.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Pet Owner */}
            <motion.button
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect('owner')}
              className="relative p-8 overflow-hidden text-left transition-all bg-white border-2 border-transparent shadow-sm group dark:bg-slate-900 rounded-2xl hover:shadow-xl hover:border-primary-500 dark:border-slate-800 dark:hover:border-primary-500"
            >
              <div className="absolute top-0 right-0 p-6 transition-opacity opacity-10 group-hover:opacity-20">
                <Dog className="w-32 h-32 text-primary-500" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-center w-16 h-16 mb-6 bg-primary-100 dark:bg-primary-900/30 rounded-2xl text-primary-600 dark:text-primary-400">
                  <Dog className="w-8 h-8" />
                </div>
                <h2 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
                  Pet Owner
                </h2>
                <p className="leading-relaxed text-slate-500 dark:text-slate-400">
                  I am a pet owner looking to manage my dog or cat's health records, track vaccinations, and get AI-powered health recommendations.
                </p>
              </div>
            </motion.button>

            {/* Veterinary Clinic */}
            <motion.button
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect('clinic')}
              className="relative p-8 overflow-hidden text-left transition-all bg-white border-2 border-transparent shadow-sm group dark:bg-slate-900 rounded-2xl hover:shadow-xl hover:border-secondary-500 dark:border-slate-800 dark:hover:border-secondary-500"
            >
              <div className="absolute top-0 right-0 p-6 transition-opacity opacity-10 group-hover:opacity-20">
                <Stethoscope className="w-32 h-32 text-secondary-500" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-center w-16 h-16 mb-6 bg-secondary-100 dark:bg-secondary-900/30 rounded-2xl text-secondary-600 dark:text-secondary-400">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <h2 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
                  Veterinary Clinic
                </h2>
                <p className="leading-relaxed text-slate-500 dark:text-slate-400">
                  I represent a veterinary clinic providing care for dogs and cats. I want to manage patient records, upload reports, and connect with pet owners.
                </p>
              </div>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Pet Owner Details Step */}
      {step === 'owner-details' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md overflow-hidden bg-white border shadow-xl dark:bg-slate-900 rounded-2xl border-slate-100 dark:border-slate-800"
        >
          <div className="p-8">
            <button
              onClick={() => setStep('role')}
              className="flex items-center gap-2 mb-6 font-medium transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex justify-center mb-8">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl text-primary-600 dark:text-primary-400">
                <Dog className="w-8 h-8" />
              </div>
            </div>

            <h2 className="mb-2 text-2xl font-bold text-center text-slate-900 dark:text-white">
              Pet Owner Account
            </h2>
            <p className="mb-8 text-center text-slate-500 dark:text-slate-400">
              Set up your account to manage your pet's health.
            </p>

            <PetOwnerSignupForm
              onSubmit={handlePetOwnerSignup}
              isLoading={isLoading}
              initialName={basicInfo.name}
              initialEmail={basicInfo.email}
            />
          </div>
        </motion.div>
      )}

      {/* Clinic Details Step */}
      {step === 'clinic-details' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <button
            onClick={() => setStep('role')}
            className="flex items-center gap-2 mb-6 font-medium transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
              Register Your Clinic
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              Provide your clinic details for verification and listing.
            </p>
          </div>

          <ClinicSignupForm
            onSubmit={handleClinicSignup}
            isLoading={isLoading}
          />
        </motion.div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && (
        <ClinicVerificationModal
          clinicName={clinicName}
          email={basicInfo.email}
          onClose={handleVerificationModalClose}
        />
      )}
    </div>
  );
}
