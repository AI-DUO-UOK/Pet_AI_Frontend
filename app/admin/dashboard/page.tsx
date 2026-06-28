'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  Loader,
  X,
  BarChart3,
} from 'lucide-react';

type AdminStats = {
  total_clinics: number;
  pending_verifications: number;
  approved_clinics: number;
  rejected: number;
};

type RecentVerification = {
  clinic: string;
  action: string;
  time: string;
  badge: string;
};

const STAT_META = [
  {
    key: 'total_clinics',
    title: 'Total Clinics',
    icon: Building2,
    bgLight: 'bg-primary-50 dark:bg-primary-500/10',
    textLight: 'text-primary-600 dark:text-primary-400',
    trend: 'All registered clinics',
  },
  {
    key: 'pending_verifications',
    title: 'Pending Verifications',
    icon: AlertCircle,
    bgLight: 'bg-amber-50 dark:bg-amber-500/10',
    textLight: 'text-amber-600 dark:text-amber-400',
    trend: 'Needs review',
  },
  {
    key: 'approved_clinics',
    title: 'Approved Clinics',
    icon: CheckCircle2,
    bgLight: 'bg-green-50 dark:bg-green-500/10',
    textLight: 'text-green-600 dark:text-green-400',
    trend: 'Verified clinics',
  },
  {
    key: 'rejected',
    title: 'Rejected',
    icon: XCircle,
    bgLight: 'bg-red-50 dark:bg-red-500/10',
    textLight: 'text-red-600 dark:text-red-400',
    trend: 'Currently unavailable',
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recent, setRecent] = useState<RecentVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Session not found. Please log in again.');
        }

        const response = await fetch('http://localhost:8000/api/admin/stats');

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to load admin stats (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        setStats(data.stats);
        setRecent(data.recent_verifications || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load admin dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage clinic verifications and platform control.
        </p>
      </div>

      {/* Stats Grid */}
      {loading && (
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <Loader className="w-5 h-5 animate-spin" />
          Loading dashboard data...
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_META.map((stat, index) => {
          const Icon = stat.icon;
          const value = stats ? stats[stat.key as keyof AdminStats] : 0;
          const getStatusQuery = (key: string) => {
            if (key === 'total_clinics') return 'all';
            if (key === 'pending_verifications') return 'pending';
            if (key === 'approved_clinics') return 'approved';
            if (key === 'rejected') return 'rejected';
            return 'all';
          };

          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, scale: 1.01 }}
              onClick={() => router.push(`/admin/clinics?status=${getStatusQuery(stat.key)}`)}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgLight} ${stat.textLight}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {value}
                </h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {stat.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {stat.trend}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6"
      >
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/admin/clinics?status=pending')}
            className="px-4 py-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-amber-200 dark:border-amber-800"
          >
            <AlertCircle className="w-5 h-5" />
            Review Pending
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/admin/clinics?status=approved')}
            className="px-4 py-3 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-green-200 dark:border-green-800"
          >
            <CheckCircle2 className="w-5 h-5" />
            View Approved
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAnalytics(true)}
            className="px-4 py-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-800"
          >
            <TrendingUp className="w-5 h-5" />
            Analytics
          </motion.button>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Recent Verifications
          </h2>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {recent.map((item, idx) => (
            <div key={idx} className="p-6 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {item.clinic}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {item.time ? new Date(item.time).toLocaleString() : 'Recently'}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${item.badge}`}
              >
                {item.action}
              </span>
            </div>
          ))}
          {!recent.length && !loading && (
            <div className="p-6 text-slate-500 dark:text-slate-400">
              No recent verification activity yet.
            </div>
          )}
        </div>
      </motion.div>

      {/* Analytics Modal */}
      <AnimatePresence>
        {showAnalytics && stats && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Platform Verification Analytics
                  </h2>
                </div>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Rates breakdown */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Verification Ratios
                  </h3>
                  <div className="space-y-4">
                    {/* Approved progress bar */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-green-600 dark:text-green-400">Approved Clinics</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {stats.total_clinics ? ((stats.approved_clinics / stats.total_clinics) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${stats.total_clinics ? (stats.approved_clinics / stats.total_clinics) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Pending progress bar */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-amber-600 dark:text-amber-400">Pending Review</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {stats.total_clinics ? ((stats.pending_verifications / stats.total_clinics) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${stats.total_clinics ? (stats.pending_verifications / stats.total_clinics) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Rejected progress bar */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-red-600 dark:text-red-400">Rejected Applications</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {stats.total_clinics ? ((stats.rejected / stats.total_clinics) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${stats.total_clinics ? (stats.rejected / stats.total_clinics) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Verification Rate</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {stats.total_clinics ? ((stats.approved_clinics / stats.total_clinics) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Action Required</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                      {stats.pending_verifications} pending
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-primary-600/10"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
