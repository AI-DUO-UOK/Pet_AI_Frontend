'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Dog, Stethoscope } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export default function RoleSelectionPage() {
  const { login } = useAuth();
  const router = useRouter();

  const handleSelectRole = (role: 'owner' | 'clinic') => {
    login(role, {
      id: 'new-user',
      name: 'New User',
      email: 'user@example.com',
    });
    router.push(role === 'clinic' ? '/clinic/dashboard' : '/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            How will you use Dr. Paw?
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            Choose your account type to personalize your experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.button
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectRole('owner')}
            className="group relative bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm hover:shadow-xl border-2 border-transparent hover:border-primary-500 dark:border-slate-800 dark:hover:border-primary-500 transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Dog className="w-32 h-32 text-primary-500" />
            </div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6">
                <Dog className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Pet Owner
              </h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                I want to manage my dogs and cats' health records, track vaccinations, and use the AI assistant.
              </p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectRole('clinic')}
            className="group relative bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm hover:shadow-xl border-2 border-transparent hover:border-secondary-500 dark:border-slate-800 dark:hover:border-secondary-500 transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Stethoscope className="w-32 h-32 text-secondary-500" />
            </div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900/30 rounded-2xl flex items-center justify-center text-secondary-600 dark:text-secondary-400 mb-6">
                <Stethoscope className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Veterinary Clinic
              </h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                I represent a veterinary clinic providing care for dogs and cats. I want to manage patient records, upload reports, and connect with pet owners.
              </p>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
