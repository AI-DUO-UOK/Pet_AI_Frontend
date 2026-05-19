'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  AlertCircle,
  Clock,
  CheckCircle2,
  MapPin,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const DEMO_STATS = [
  {
    title: 'Total Pets Treated',
    value: '1,248',
    trend: '+12% this month',
    icon: Users,
    color: 'bg-primary-500',
    bgLight: 'bg-primary-50 dark:bg-primary-500/10',
    textLight: 'text-primary-600 dark:text-primary-400',
  },
  {
    title: "Today's Walk-ins",
    value: '24',
    trend: 'Last 24 hours',
    icon: MapPin,
    color: 'bg-blue-500',
    bgLight: 'bg-blue-50 dark:bg-blue-500/10',
    textLight: 'text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Active Cases',
    value: '8',
    trend: 'In progress',
    icon: Clock,
    color: 'bg-amber-500',
    bgLight: 'bg-amber-50 dark:bg-amber-500/10',
    textLight: 'text-amber-600 dark:text-amber-400',
  },
  {
    title: 'Pending Reviews',
    value: '5',
    trend: 'Needs follow up',
    icon: AlertCircle,
    color: 'bg-purple-500',
    bgLight: 'bg-purple-50 dark:bg-purple-500/10',
    textLight: 'text-purple-600 dark:text-purple-400',
  },
];

export default function ClinicDashboard() {
  const { user } = useAuth();
  const clinicName = user?.clinicName || user?.name || 'Clinic';
  const isVerified = user?.verificationStatus === 'approved';
  const isPending = user?.verificationStatus === 'pending';
  const isRejected = user?.verificationStatus === 'rejected';

  return (
    <div className="space-y-6">
      {/* Verification Banner */}
      {isPending && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 p-4 border rounded-lg bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
        >
          <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 dark:text-amber-200">
              Your clinic is under verification ⏳
            </h3>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
              You will gain full access once approved by admin. Some features are currently disabled.
            </p>
          </div>
        </motion.div>
      )}

      {isRejected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800"
        >
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-200">
              Verification Rejected
            </h3>
            <p className="mt-1 text-sm text-red-800 dark:text-red-300">
              Please contact support or resubmit your clinic information with the required documents.
            </p>
          </div>
        </motion.div>
      )}

      {isVerified && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 p-4 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/20 dark:border-green-800"
        >
          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 dark:text-green-200">
              Verified Clinic ✅
            </h3>
            <p className="mt-1 text-sm text-green-800 dark:text-green-300">
              Your clinic is now visible to pet owners and all features are unlocked.
            </p>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, {clinicName}
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Here's an overview of your clinic activity.
          </p>
        </div>
      </div>

      {/* Verification Status Card - Pending */}
      {isPending && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
                Verification Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span className="text-slate-700 dark:text-slate-300">
                    <strong>Status:</strong> Pending Review
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300">
                    <strong>Submitted:</strong>{' '}
                    {user?.submittedDate
                      ? new Date(user.submittedDate).toLocaleDateString()
                      : 'Today'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300">
                    <strong>Est. Review Time:</strong> 24-48 hours
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Limited Access Notice */}
      {isPending && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 border bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-slate-200 dark:border-slate-700"
        >
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
            Limited Access
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-slate-400" />
              <span className="text-slate-700 dark:text-slate-300">
                Patient management - Available after verification
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-slate-400" />
              <span className="text-slate-700 dark:text-slate-300">
                AI assistant - Available after verification
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-slate-400" />
              <span className="text-slate-700 dark:text-slate-300">
                Public visibility - Available after verification
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid - Visible only if verified or show demo */}
      {!isPending && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEMO_STATS.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bgLight} ${stat.textLight}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1 text-3xl font-bold text-slate-900 dark:text-white">
                    {stat.value}
                  </h3>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {stat.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {stat.trend}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Allowed Features Section - Pending */}
      {isPending && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 rounded-2xl dark:border-blue-800"
        >
          <h3 className="mb-4 font-semibold text-blue-900 dark:text-blue-200">
            You can already:
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-800 dark:text-blue-300">
                View and edit your clinic profile
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-800 dark:text-blue-300">
                Upload additional documents
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-800 dark:text-blue-300">
                View your submission details
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Helper component for Calendar icon (lucide-react might not have this exact one)
function Calendar(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}
