'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dog, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  // Admin credentials
  const ADMIN_EMAIL = 'admin@drpaw.com';
  const ADMIN_PASSWORD = 'admin123';

  // Clinic credentials
  const CLINIC_EMAIL = 'clinic@mavi.com';
  const CLINIC_PASSWORD = '123';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    
    if (normalizedEmail === ADMIN_EMAIL.toLowerCase() && normalizedPassword === ADMIN_PASSWORD) {
      login('admin', {
        id: 'admin-1',
        name: 'Admin User',
        email: email,
      });
      router.push('/admin/dashboard');
    } else if (normalizedEmail === CLINIC_EMAIL.toLowerCase() && normalizedPassword === CLINIC_PASSWORD) {
      // Clinic with full access
      login('clinic', {
        id: 'clinic-1',
        name: 'Mavi Clinic',
        email: email,
        clinicName: 'Mavi',
        verificationStatus: 'approved',
        role: 'clinic',
      });
      router.push('/clinic/dashboard');
    } else {
      // Default owner role
      login('owner', {
        id: '1',
        name: 'Sarah Jenkins',
        email: email,
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces&q=80',
      });
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 dark:bg-slate-950">
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
            Welcome back to Dr. Paw
          </h2>
          <p className="mb-8 text-center text-slate-500 dark:text-slate-400">
            Enter your details to access your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-slate-600 dark:text-slate-400">Remember me</span>
              </label>
              <Link href="#" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-medium transition-colors"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-sm text-center">
            <span className="text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link
                href="/auth/signup"
                className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Sign up
              </Link>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
