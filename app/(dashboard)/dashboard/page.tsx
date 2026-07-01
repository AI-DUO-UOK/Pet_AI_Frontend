'use client';
import { apiFetch } from '@/lib/api';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Dog,
  Syringe,
  Calendar,
  Plus,
  Activity,
  Search,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// default/placeholder summary; will be updated from API when available
const DEFAULT_SUMMARY = {
  totalPets: 2,
  dogs: 1,
  cats: 1,
  upcomingVaccines: 1,
  upcomingAppointments: 0,
  vetVisits: 3,
  lastVisit: '',
};

// Recent activity will be populated from appointments; start empty.

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';
  const [stats, setStats] = useState(() => ({ ...DEFAULT_SUMMARY }));
  const [recentActivityState, setRecentActivityState] = useState<any[]>([]);

  useEffect(() => {
    const userId = user?.id || localStorage.getItem('user_id');
    if (!userId) return;

    const fetchSummary = async () => {
      try {
        // Fetch pets
        const petsRes = await apiFetch(`/api/pets?user_id=${encodeURIComponent(userId)}`);
        let petsData = [];
        if (petsRes.ok) {
          const pjson = await petsRes.json();
          petsData = pjson.pets || [];
        }

        const dogs = petsData.filter((p: any) => (p.type || '').toLowerCase() === 'dog').length;
        const cats = petsData.filter((p: any) => (p.type || '').toLowerCase() === 'cat').length;

        // Fetch appointments (vet visits) using owner-specific endpoint
        let appointments: any[] = [];
        try {
          const apptRes = await apiFetch(`/api/appointments/owner?owner_id=${encodeURIComponent(userId)}`);
          if (apptRes.ok) {
            const ajson = await apptRes.json();
            appointments = ajson.appointments || [];
          }
        } catch (e) {
          // ignore and keep fallback
        }

        // Separate past vs upcoming appointments by date (treat appointments on or before today as past)
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const pastAppointments = (appointments || []).filter((a: any) => {
          const d = a.appointment_date ? new Date(a.appointment_date) : a.created_at ? new Date(a.created_at) : null;
          return d && !Number.isNaN(d.getTime()) && d <= today;
        });

        const upcomingAppointmentsList = (appointments || []).filter((a: any) => {
          const d = a.appointment_date ? new Date(a.appointment_date) : a.created_at ? new Date(a.created_at) : null;
          return d && !Number.isNaN(d.getTime()) && d > today;
        });

        // Count vet visits as past appointments that were completed
        const completedPast = pastAppointments.filter((a: any) => (a.status || '').toLowerCase() === 'completed');
        const vetVisits = completedPast.length;
        // lastVisit should be the most recent completed appointment date
        const lastVisit = completedPast.length
          ? completedPast
              .map((a: any) => new Date(a.appointment_date || a.created_at || ''))
              .filter((dt: any) => !Number.isNaN(dt.getTime()))
              .sort((a: any, b: any) => b.getTime() - a.getTime())[0]
              .toLocaleDateString()
          : '';

        // Aggregate upcoming vaccines by querying vaccine records per pet (backend expects pet_id)
        let upcomingVaccines = DEFAULT_SUMMARY.upcomingVaccines;
        try {
          const now = new Date();
          const in30 = new Date();
          in30.setDate(now.getDate() + 30);
          let totalUpcoming = 0;
          for (const pet of petsData) {
            try {
              const vacRes = await apiFetch(`/api/vaccine-records?pet_id=${encodeURIComponent(pet.id)}`);
              if (!vacRes.ok) continue;
              const vjson = await vacRes.json();
              const records = vjson.records || [];
              totalUpcoming += records.filter((r: any) => {
                const d = new Date(r.next_due || r.date || null);
                return !Number.isNaN(d.getTime()) && d >= now && d <= in30;
              }).length;
            } catch (e) {
              continue;
            }
          }
          upcomingVaccines = totalUpcoming;
        } catch (e) {
          // ignore
        }

        setStats({
          totalPets: petsData.length,
          dogs,
          cats,
          upcomingVaccines,
          upcomingAppointments: upcomingAppointmentsList.length,
          vetVisits,
          lastVisit,
        });

        // Build recent activity from appointments (most recent first)
        try {
          // Build recent activity only from past appointments (so upcoming channels are not shown as past visits)
          if (completedPast && completedPast.length) {
            const items = completedPast
              .slice()
              .sort((a: any, b: any) => {
                const da = new Date(a.appointment_date || a.created_at || null).getTime() || 0;
                const db = new Date(b.appointment_date || b.created_at || null).getTime() || 0;
                return db - da;
              })
              .slice(0, 5)
                .map((a: any, idx: number) => {
                  const petRecord = (petsData || []).find((p: any) => p.id === a.pet_id) || null;
                  const petName = petRecord?.name || a.pet_id || 'Unknown Pet';
                  const petType = petRecord?.type || 'Dog';
                  return {
                    id: `appt-${a.id}-${idx}`,
                    pet: petName,
                    type: petType,
                    action: a.reason || 'Vet Visit',
                    detail: a.notes || '',
                    date: a.appointment_date || a.created_at || '',
                    icon: Calendar,
                    iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
                  };
                });

            if (items.length) setRecentActivityState(items as any);
          }
        } catch (e) {
          // keep fallback
        }
      } catch (err) {
        console.warn('Failed to fetch dashboard summary', err);
      }
    };

    fetchSummary();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Good morning, {firstName}! 
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Here's what's happening with your furry friends today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/ai-assistant"
            className="flex items-center gap-2 px-4 py-2 font-medium transition-colors bg-white border rounded-lg dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Activity className="w-4 h-4" />
            AI Check
          </Link>
          <Link
            href="/my-pets"
            className="flex items-center gap-2 px-4 py-2 font-medium text-white transition-colors rounded-lg shadow-sm bg-primary-600 hover:bg-primary-700 shadow-primary-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Pet
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Pets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="p-6 bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${'bg-blue-50 dark:bg-blue-500/10'} ${'text-blue-600 dark:text-blue-400'}`}>
              <Dog className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="mb-1 text-3xl font-bold text-slate-900 dark:text-white">
              {stats.totalPets}
            </h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Pets</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stats.dogs} Dog(s), {stats.cats} Cat(s)</p>
          </div>
        </motion.div>

        {/* Upcoming Vaccines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${'bg-amber-50 dark:bg-amber-500/10'} ${'text-amber-600 dark:text-amber-400'}`}>
              <Syringe className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="mb-1 text-3xl font-bold text-slate-900 dark:text-white">{stats.upcomingVaccines}</h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Upcoming Vaccines</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Next 30 days</p>
          </div>
        </motion.div>

        {/* Upcoming Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${'bg-emerald-50 dark:bg-emerald-500/10'} ${'text-emerald-600 dark:text-emerald-400'}`}>
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="mb-1 text-3xl font-bold text-slate-900 dark:text-white">{stats.upcomingAppointments}</h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Upcoming Appointments</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Scheduled sessions</p>
          </div>
        </motion.div>

        {/* Vet Visits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${'bg-purple-50 dark:bg-purple-500/10'} ${'text-purple-600 dark:text-purple-400'}`}>
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="mb-1 text-3xl font-bold text-slate-900 dark:text-white">{stats.vetVisits}</h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Vet Visits</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stats.lastVisit ? `Last visit: ${stats.lastVisit}` : '—'}</p>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Feed */}
        <div className="overflow-hidden bg-white border shadow-sm lg:col-span-2 dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent Activity
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {recentActivityState.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity</p>
              ) : (
                recentActivityState.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="relative flex gap-4">
                      {index !== recentActivityState.length - 1 && (
                        <div className="absolute left-5 top-10 bottom-[-24px] w-px bg-slate-200 dark:bg-slate-800" />
                      )}
                      <div
                        className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${activity.iconBg}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {activity.pet}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {activity.type === 'Dog' ? '🐶' : '🐱'} {activity.type}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-0.5">
                          {activity.action}
                        </p>
                        <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">
                          {activity.detail}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {activity.date}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions / Promo */}
        <div className="space-y-6">
          <div className="relative p-6 overflow-hidden text-white shadow-md bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Dog className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <h3 className="mb-2 text-lg font-bold">Try AI Pet Health Assistant</h3>
              <p className="mb-4 text-sm leading-relaxed text-primary-100">
                Ask questions about your pet's health, symptoms, vaccinations, nutrition and general care. Get AI-powered guidance based on trusted veterinary knowledge.
              </p>
              <Link
                href="/ai-assistant"
                className="inline-block px-4 py-2 text-sm font-medium transition-colors bg-white rounded-lg text-primary-600 hover:bg-primary-50"
              >
                Start Chat
              </Link>
            </div>
          </div>

          <div className="p-6 bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800">
            <h3 className="mb-4 font-bold text-slate-900 dark:text-white">
              Quick Links
            </h3>
            <div className="space-y-2">
              <Link
                href="/find-vets"
                className="flex items-center justify-between p-3 transition-colors rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 transition-colors rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Find a Vet Nearby
                  </span>
                </div>
              </Link>
              <Link
                href="/my-pets"
                className="flex items-center justify-between p-3 transition-colors rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 transition-colors rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    View Vaccination Schedule
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}