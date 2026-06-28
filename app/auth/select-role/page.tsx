'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dog, Stethoscope, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

export default function RoleSelectionPage() {
  const { user, refreshProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const roleSubmittedRef = React.useRef(false);

  // Redirect if user already has a role (and we didn't just submit it in this session)
  React.useEffect(() => {
    if (!authLoading && user && user.role && !roleSubmittedRef.current) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'clinic') {
        if (user.hasProfile) {
          router.push('/clinic/dashboard');
        } else {
          router.push('/auth/signup/clinic');
        }
      } else if (user.role === 'owner') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const isBtnDisabled = loading || authLoading;

  const handleSelectRole = async (role: 'owner' | 'clinic') => {
    roleSubmittedRef.current = true;
    setLoading(true);
    try {
      // If user is already logged in (e.g. via Google OAuth for the first time)
      if (user && user.id) {
        const { error } = await supabase
          .from('users')
          .update({ role })
          .eq('id', user.id);

        if (error) {
          throw error;
        }

        await refreshProfile();

        // Redirect to the appropriate profile completion form
        if (role === 'clinic') {
          router.push('/auth/signup/clinic');
        } else {
          // For Pet Owners: Automatically create their profile in the backend using their Google name,
          // and send them straight to the dashboard/onboarding to avoid blocking them with extra forms!
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token || '';

          const nameParts = (user.name || '').trim().split(' ');
          const firstName = nameParts[0] || 'Owner';
          const lastName = nameParts.slice(1).join(' ') || '';

          const { authService } = await import('@/services/auth.service');
          await authService.registerOwner(
            user.email,
            {
              first_name: firstName,
              last_name: lastName,
              phone: '', // Can be updated in the profile settings page later
            },
            token
          );

          await refreshProfile();
          router.push('/dashboard');
        }
      } else {
        // If not logged in, navigate to the signup form directly
        router.push(role === 'clinic' ? '/auth/signup/clinic' : '/auth/signup/owner');
      }
    } catch (err: any) {
      console.error('Error setting user role:', err);
      const errorMsg = err?.message || err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      console.error('Detailed error:', errorMsg);
      alert(`Failed to select role: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-3xl w-full">
        <button
          onClick={() => router.push('/auth/login')}
          className="flex items-center gap-2 mb-6 font-medium transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

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
            disabled={isBtnDisabled}
            onClick={() => handleSelectRole('owner')}
            className="group relative bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm hover:shadow-xl border-2 border-transparent hover:border-primary-500 dark:border-slate-800 dark:hover:border-primary-500 transition-all text-left overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={isBtnDisabled}
            onClick={() => handleSelectRole('clinic')}
            className="group relative bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm hover:shadow-xl border-2 border-transparent hover:border-secondary-500 dark:border-slate-800 dark:hover:border-secondary-500 transition-all text-left overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
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
