'use client';

import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Chrome,
  Facebook,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PetOwnerSignupFormProps {
  onSubmit: (data: PetOwnerFormData) => void;
  isLoading: boolean;
  initialEmail?: string;
  initialName?: string;
}

export interface PetOwnerFormData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  location?: string;
}

export function PetOwnerSignupForm({
  onSubmit,
  isLoading,
  initialEmail = '',
  initialName = '',
}: PetOwnerSignupFormProps) {
  const [formData, setFormData] = useState<PetOwnerFormData>({
    name: initialName,
    email: initialEmail,
    password: '',
    phone: '',
    location: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof PetOwnerFormData, string>>>({});

  // Password strength checker
  const checkPasswordStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;
    return strength;
  };

  const getPasswordRequirements = () => {
    const pwd = formData.password;
    return {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[^a-zA-Z\d]/.test(pwd),
    };
  };

  const passwordReqs = getPasswordRequirements();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof PetOwnerFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Validation
    const newErrors = { ...errors };
    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Full name is required';
        } else if (value.trim().length < 2) {
          newErrors.name = 'Name must be at least 2 characters';
        } else {
          delete newErrors.name;
        }
        break;
      case 'email':
        if (!value) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Please enter a valid email';
        } else {
          delete newErrors.email;
        }
        break;
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (value.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        } else {
          delete newErrors.password;
        }
        break;
      case 'phone':
        if (value && !/^\+?[\d\s\-()]{10,}$/.test(value)) {
          newErrors.phone = 'Please enter a valid phone number';
        } else {
          delete newErrors.phone;
        }
        break;
    }
    setErrors(newErrors);
  };

  const isFormValid =
    formData.name &&
    formData.email &&
    formData.password &&
    !errors.name &&
    !errors.email &&
    !errors.password;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onSubmit(formData);
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 2) return 'bg-amber-500';
    if (strength === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 1) return 'Weak';
    if (strength <= 2) return 'Fair';
    if (strength === 3) return 'Good';
    return 'Strong';
  };

  return (
    <>
      {/* Trust Message */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6"
      >
        <p className="text-sm text-green-800 dark:text-green-400 font-medium text-center">
          ✓ Manage your pet's health, track vaccinations, and get smart AI recommendations — all in one place.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Full Name *
          </label>
          <div className="relative">
            <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="John Doe"
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:outline-none transition-all dark:text-white ${
                errors.name
                  ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500/20 focus:border-primary-500'
              }`}
            />
          </div>
          {errors.name && (
            <div className="flex items-center gap-1 text-red-500 text-xs mt-1.5">
              <AlertCircle className="w-3 h-3" />
              {errors.name}
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="you@example.com"
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:outline-none transition-all dark:text-white ${
                errors.email
                  ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500/20 focus:border-primary-500'
              }`}
            />
          </div>
          {errors.email && (
            <div className="flex items-center gap-1 text-red-500 text-xs mt-1.5">
              <AlertCircle className="w-3 h-3" />
              {errors.email}
            </div>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Password *
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="••••••••"
              className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:outline-none transition-all dark:text-white ${
                errors.password
                  ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500/20 focus:border-primary-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <div className="flex items-center gap-1 text-red-500 text-xs mt-1.5">
              <AlertCircle className="w-3 h-3" />
              {errors.password}
            </div>
          )}

          {/* Password Strength */}
          {formData.password && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                    style={{ width: `${(passwordStrength / 4) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {getStrengthText(passwordStrength)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div
                  className={`flex items-center gap-1 ${
                    passwordReqs.length
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {passwordReqs.length ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <div className="w-3 h-3 border border-current rounded-full" />
                  )}
                  At least 8 characters
                </div>
                <div
                  className={`flex items-center gap-1 ${
                    passwordReqs.uppercase
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {passwordReqs.uppercase ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <div className="w-3 h-3 border border-current rounded-full" />
                  )}
                  Uppercase letter
                </div>
                <div
                  className={`flex items-center gap-1 ${
                    passwordReqs.number
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {passwordReqs.number ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <div className="w-3 h-3 border border-current rounded-full" />
                  )}
                  Number
                </div>
                <div
                  className={`flex items-center gap-1 ${
                    passwordReqs.special
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {passwordReqs.special ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <div className="w-3 h-3 border border-current rounded-full" />
                  )}
                  Special character
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Phone (Optional) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Phone Number <span className="text-xs text-slate-500 dark:text-slate-400">(optional)</span>
          </label>
          <div className="relative">
            <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="+94 7X XXX XXXX"
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:outline-none transition-all dark:text-white ${
                errors.phone
                  ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-primary-500/20 focus:border-primary-500'
              }`}
            />
          </div>
          {errors.phone && (
            <div className="flex items-center gap-1 text-red-500 text-xs mt-1.5">
              <AlertCircle className="w-3 h-3" />
              {errors.phone}
            </div>
          )}
        </div>

        {/* Location (Optional) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            City/Location <span className="text-xs text-slate-500 dark:text-slate-400">(optional)</span>
          </label>
          <div className="relative">
            <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Colombo, Sri Lanka"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>

        {/* Create Account Button */}
        <motion.button
          type="submit"
          disabled={!isFormValid || isLoading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </motion.button>
      </form>

      {/* Social Login */}
      <div className="mt-6">
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 font-medium text-slate-700 dark:text-slate-300"
          >
            <Chrome className="w-5 h-5" />
            Google
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 font-medium text-slate-700 dark:text-slate-300"
          >
            <Facebook className="w-5 h-5" />
            Facebook
          </motion.button>
        </div>
      </div>

      {/* Login Link */}
      <div className="mt-6 text-center text-sm">
        <span className="text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <a href="/auth/login" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
            Sign in
          </a>
        </span>
      </div>
    </>
  );
}
