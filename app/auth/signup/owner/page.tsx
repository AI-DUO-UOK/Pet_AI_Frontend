'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { authService } from '@/services/auth.service';
import { supabase } from '@/lib/supabase/client';

export default function OwnerSignupPage() {
  const { isAuthenticated, user, signUp, signInWithGoogle, refreshProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill name and email if already authenticated (Google OAuth)
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
    }
  }, [isAuthenticated, user]);

  const validateForm = () => {
    if (!name.trim()) return 'Full name is required';
    if (!phone.trim()) return 'Phone number is required';
    if (!acceptTerms) return 'You must accept the Terms and Privacy Policy';

    if (!isAuthenticated) {
      if (!email.trim()) return 'Email is required';
      if (password.length < 8) return 'Password must be at least 8 characters';
      if (password !== confirmPassword) return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      let currentEmail = email;
      let accessToken = '';

      if (!isAuthenticated) {
        // 1. New Email/Password Signup
        const { data, error: signUpError } = await signUp(email, password, 'owner', phone);

        if (signUpError) {
          throw signUpError;
        }

        if (!data.user) {
          throw new Error('Signup failed. No user returned.');
        }

        currentEmail = email;

        if (!data.session) {
          setSuccessMsg('Please verify your email. A verification link has been sent.');
          setLoading(false);
          return;
        }

        accessToken = data.session.access_token;
      } else {
        // Already authenticated (e.g. Google OAuth)
        const { data: { session } } = await supabase.auth.getSession();
        accessToken = session?.access_token || '';
        currentEmail = user?.email || email;
      }

      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // 2. Complete Profile in backend
      await authService.registerOwner(
        currentEmail,
        {
          first_name: firstName,
          last_name: lastName,
          phone,
        },
        accessToken
      );

      await refreshProfile();

      // 3. Redirect to onboarding
      router.push('/onboarding/add-pet');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup.');
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google authentication failed.');
      setLoading(false);
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
          <button
            onClick={() => router.push('/auth/select-role')}
            className="flex items-center gap-2 mb-6 font-medium transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <h2 className="mb-2 text-2xl font-bold text-center text-slate-900 dark:text-white">
            {isAuthenticated ? 'Complete Owner Profile' : 'Create Pet Owner Account'}
          </h2>
          <p className="mb-6 text-center text-slate-500 dark:text-slate-400 text-sm">
            {isAuthenticated
              ? 'Please provide your name and phone number to complete your registration.'
              : 'Sign up to track your pet\'s health and get AI-powered insights.'}
          </p>

          {error && (
            <div className="p-3 mb-4 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 mb-4 text-sm text-green-700 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none transition-all dark:text-white"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none transition-all dark:text-white"
                  placeholder="+1 555-555-5555"
                />
              </div>
            </div>

            {!isAuthenticated && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    autoComplete="username email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none transition-all dark:text-white"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            )}

            {!isAuthenticated && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none transition-all dark:text-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute -translate-y-1/2 right-3 top-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {password && <PasswordStrength password={password} />}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none transition-all dark:text-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute -translate-y-1/2 right-3 top-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="terms" className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                I agree to the{' '}
                <Link href="/terms" className="text-primary-600 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary-600 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? 'Submitting...' : 'Complete Profile'}
            </button>
          </form>

          {!isAuthenticated && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                    OR
                  </span>
                </div>
              </div>

              <GoogleButton onClick={handleGoogleSignup} isLoading={loading} />
            </>
          )}

          <div className="mt-6 text-sm text-center">
            <span className="text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Sign in
              </Link>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
