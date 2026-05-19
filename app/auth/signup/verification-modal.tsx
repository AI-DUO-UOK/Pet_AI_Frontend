'use client';

import React from 'react';
import { Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface VerificationModalProps {
  clinicName: string;
  email: string;
  onClose: () => void;
  onEditDetails?: () => void;
}

export function ClinicVerificationModal({
  clinicName,
  email,
  onClose,
  onEditDetails,
}: VerificationModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Icon Section */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 p-8 flex flex-col items-center border-b border-slate-200 dark:border-slate-800">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4"
          >
            <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white text-center">
            Verification Required ⏳
          </h1>
        </div>

        {/* Content Section */}
        <div className="p-8">
          <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
            Your clinic registration has been submitted successfully. Our admin team will review your details and verify your clinic before activation.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
            <p className="text-center text-sm font-medium text-blue-700 dark:text-blue-400">
              ℹ️ This process usually takes 24–48 hours.
            </p>
          </div>

          {/* Status Info */}
          <div className="space-y-4 mb-8 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-lg border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Status
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Pending Verification
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Clinic Name
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {clinicName}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Submitted Email
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {email}
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-yellow-800 dark:text-yellow-400 font-medium">
                <Shield className="w-3 h-3 inline mr-1" />
                Temporary access is limited until approval
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
            >
              OK, Got it
            </motion.button>

            {onEditDetails && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onEditDetails}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
              >
                Edit Details
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
