'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerMessage(null);

    try {
      const { error } = await resetPassword(email.trim());
      if (error) {
        setServerMessage(error.message);
      } else {
        setServerMessage('If that email is registered, a password reset link has been sent.');
      }
    } catch (err: any) {
      setServerMessage(err?.message || 'Network error');
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
          <Link href="/auth/login" className="inline-flex items-center gap-2 mb-6 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl text-primary-600 dark:text-primary-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
          </div>

          <h2 className="mb-2 text-2xl font-bold text-center text-slate-900 dark:text-white">
            Reset your password
          </h2>
          <p className="mb-8 text-center text-slate-500 dark:text-slate-400">
            Enter your email and we’ll send you a recovery link.
          </p>

          {submitted && (
            <div className="p-3 mb-5 text-sm border rounded-lg bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300">
              {serverMessage || 'If your email is registered, a reset link has been sent.'}
            </div>
          )}

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
                  placeholder="Enter your account email"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-medium transition-colors"
            >
              Send reset link
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
