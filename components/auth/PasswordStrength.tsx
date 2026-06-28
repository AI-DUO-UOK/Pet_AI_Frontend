'use client';

import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const checkPasswordStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;
    return strength;
  };

  const getRequirements = () => {
    return {
      length: password.length >= 8,
      case: /[A-Z]/.test(password) && /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^a-zA-Z\d]/.test(password),
    };
  };

  const strength = checkPasswordStrength(password);
  const reqs = getRequirements();

  const getStrengthColor = (s: number) => {
    if (s <= 1) return 'bg-red-500';
    if (s <= 2) return 'bg-amber-500';
    if (s === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (s: number) => {
    if (s <= 1) return 'Weak';
    if (s <= 2) return 'Fair';
    if (s === 3) return 'Good';
    return 'Strong';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 space-y-2"
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor(strength)}`}
            style={{ width: `${(strength / 4) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
          {getStrengthText(strength)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div
          className={`flex items-center gap-1.5 ${
            reqs.length ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {reqs.length ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <div className="w-3.5 h-3.5 border border-current rounded-full" />
          )}
          At least 8 characters
        </div>
        <div
          className={`flex items-center gap-1.5 ${
            reqs.case ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {reqs.case ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <div className="w-3.5 h-3.5 border border-current rounded-full" />
          )}
          Upper & Lowercase
        </div>
        <div
          className={`flex items-center gap-1.5 ${
            reqs.number ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {reqs.number ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <div className="w-3.5 h-3.5 border border-current rounded-full" />
          )}
          At least one number
        </div>
        <div
          className={`flex items-center gap-1.5 ${
            reqs.special ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {reqs.special ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <div className="w-3.5 h-3.5 border border-current rounded-full" />
          )}
          Special character
        </div>
      </div>
    </motion.div>
  );
}

export default PasswordStrength;
