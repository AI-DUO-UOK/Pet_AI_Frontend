'use client';
import { apiFetch } from '@/lib/api';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  AlertCircle,
  Clock,
  CheckCircle2,
  MapPin,
  Lock,
  Star,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Appointment {
  id: string;
  pet_id: string;
  clinic_id: string;
  owner_id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: string;
  notes?: string;
  pet_name?: string;
  owner_name?: string;
  reviewed?: boolean;
  review?: any;
}

interface Review {
  id: string;
  reviewer: string;
  pet: string;
  rating: number;
  comment: string;
  date: string;
  treatment?: string;
}

export default function ClinicDashboard() {
  const { user } = useAuth();
  const clinicName = user?.clinicName || user?.name || 'Clinic';
  const isPending = user?.verificationStatus === 'pending';
  const isRejected = user?.verificationStatus === 'rejected';

  // State hooks
  const [clinic, setClinic] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'completed'>('today');
  const [updatingApptId, setUpdatingApptId] = useState<string | null>(null);

  // Get local date formatted as YYYY-MM-DD
  const localTodayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch clinic profile
      const clinicRes = await apiFetch(`/api/clinic/profile?user_id=${encodeURIComponent(user.id)}`
      );
      if (!clinicRes.ok) {
        throw new Error('Failed to load clinic profile');
      }
      const clinicData = await clinicRes.json();
      const clinicProfile = clinicData.clinic;
      setClinic(clinicProfile);

      if (clinicProfile?.id) {
        // 2. Fetch appointments and reviews in parallel
        const [apptsRes, reviewsRes] = await Promise.all([
          apiFetch(`/api/clinic/patients?clinic_id=${encodeURIComponent(clinicProfile.id)}`
          ),
          apiFetch(`/api/reviews/clinic?clinic_id=${encodeURIComponent(clinicProfile.id)}`
          ),
        ]);

        if (apptsRes.ok) {
          const apptsData = await apptsRes.json();
          setAppointments(apptsData.appointments || []);
        }
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData.reviews || []);
        }
      }
    } catch (err) {
      console.error('Error loading clinic dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const handleUpdateStatus = async (apptId: string, newStatus: string) => {
    try {
      setUpdatingApptId(apptId);
      const formData = new FormData();
      formData.append('status', newStatus);

      const response = await apiFetch(`/api/appointments/${apptId}/status`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to update status: ${errText}`);
      }

      await fetchDashboardData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error updating status');
    } finally {
      setUpdatingApptId(null);
    }
  };

  // Filter appointments depending on chosen queue tab
  const filteredAppointments = useMemo(() => {
    if (activeTab === 'today') {
      return appointments.filter((a) => a.appointment_date === localTodayStr);
    }
    if (activeTab === 'completed') {
      return appointments.filter((a) => a.status === 'completed');
    }
    return appointments; // 'all'
  }, [appointments, activeTab, localTodayStr]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  // Stats definition based on fetched database collections
  const stats = useMemo(() => {
    return [
      {
        title: 'Total Pets Treated',
        value: appointments.filter((a) => a.status === 'completed').length.toLocaleString(),
        trend: 'Completed treatments',
        icon: Users,
        bgLight: 'bg-primary-50 dark:bg-primary-500/10',
        textLight: 'text-primary-600 dark:text-primary-400',
      },
      {
        title: "Today's Channels",
        value: appointments.filter((a) => a.appointment_date === localTodayStr).length.toLocaleString(),
        trend: 'Scheduled for today',
        icon: MapPin,
        bgLight: 'bg-blue-50 dark:bg-blue-500/10',
        textLight: 'text-blue-600 dark:text-blue-400',
      },
      {
        title: 'Active Cases',
        value: appointments.filter((a) => a.status === 'in_progress').length.toLocaleString(),
        trend: 'Currently in treatment',
        icon: Clock,
        bgLight: 'bg-amber-50 dark:bg-amber-500/10',
        textLight: 'text-amber-600 dark:text-amber-400',
      },
      {
        title: 'Pending Reviews',
        value: appointments.filter((a) => a.status === 'completed' && !a.reviewed).length.toLocaleString(),
        trend: 'Feedback awaited',
        icon: AlertCircle,
        bgLight: 'bg-purple-50 dark:bg-purple-500/10',
        textLight: 'text-purple-600 dark:text-purple-400',
      },
    ];
  }, [appointments, localTodayStr]);

  if (isLoading && !clinic) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-slate-500 dark:text-slate-400">Loading clinic dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Verification Banner - Info only, no feature restrictions */}
      {isPending && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
        >
          <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200">
              Verification in Progress ⏳
            </h3>
            <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
              Your clinic is under review by admin. You have full access to all features while we verify your details.
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

      {error && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

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

      {/* Limited Access Notice - Pending clinics have LIMITED features */}
      {isPending && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 border bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-slate-200 dark:border-slate-700"
        >
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
            Limited Access - Pending Verification
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

      {/* Stats Grid - Visible only if verified */}
      {!isPending && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
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

      {/* Interactive Panels */}
      {!isPending && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Appointment Queue Panel (2/3 width) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Appointment Queue
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Track and manage patient status in real-time.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-slate-50 dark:bg-slate-800">
                <button
                  onClick={() => setActiveTab('today')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === 'today'
                      ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === 'all'
                      ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  All Queue
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === 'completed'
                      ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3 flex-1 min-h-[300px]">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-primary-500/30 transition-all flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-500 dark:text-slate-400">Pet:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {appt.pet_name}
                        </span>
                        <span className="mx-1 text-slate-300 dark:text-slate-700">•</span>
                        <span className="font-semibold text-slate-500 dark:text-slate-400">Owner:</span>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {appt.owner_name}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ml-1 ${getStatusStyle(appt.status)}`}>
                          {appt.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Reason: <strong>{appt.reason}</strong>
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {new Date(appt.appointment_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {appt.appointment_time}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {appt.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(appt.id, 'in_progress')}
                            disabled={!!updatingApptId}
                            className="px-3 py-1.5 text-xs font-medium bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white rounded-lg transition-colors flex items-center gap-1"
                          >
                            Start Session
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                            disabled={!!updatingApptId}
                            className="px-3 py-1.5 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {appt.status === 'in_progress' && (
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'completed')}
                          disabled={!!updatingApptId}
                          className="px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white rounded-lg transition-colors"
                        >
                          Complete Treatment
                        </button>
                      )}
                      {appt.status === 'completed' && (
                        <span className="text-green-600 dark:text-green-400 font-medium text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Ready / Discharged
                        </span>
                      )}
                      {appt.status === 'cancelled' && (
                        <span className="text-red-500 dark:text-red-400 font-medium text-xs">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                  <Clock className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No appointments found for this view.</p>
                </div>
              )}
            </div>
          </div>

          {/* Client Feedback Panel (1/3 width) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col max-h-[500px]">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              Recent Feedback
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Hear what pet owners are saying about your clinic.
            </p>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              {reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          Reviewed by: {rev.reviewer}
                        </span>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          Pet: <strong>{rev.pet}</strong>
                        </p>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {rev.treatment && (
                      <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1">
                        Treatment quality: {rev.treatment}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      "{rev.comment || 'No comment provided'}"
                    </p>
                    <p className="text-[9px] text-slate-400 mt-2 text-right">
                      {rev.date ? new Date(rev.date).toLocaleDateString() : ''}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                  <Star className="w-8 h-8 mb-2 opacity-50 text-slate-300" />
                  <p className="text-xs text-center">No review feedback available yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Section - Pending */}
      {isPending && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 rounded-2xl dark:border-blue-800"
        >
          <h3 className="mb-4 font-semibold text-blue-900 dark:text-blue-200">
            What you can do while pending:
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
                View your submission status
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}