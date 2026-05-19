'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Dog,
  Syringe,
  AlertTriangle,
  Calendar,
  Plus,
  Activity,
  Search,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SUMMARY_CARDS = [
  {
    title: 'Total Pets',
    value: '2',
    subtitle: '1 Dog 🐶, 1 Cat 🐱',
    icon: Dog,
    color: 'bg-blue-500',
    bgLight: 'bg-blue-50 dark:bg-blue-500/10',
    textLight: 'text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Upcoming Vaccines',
    value: '1',
    subtitle: 'Rabies due in 7 days',
    icon: Syringe,
    color: 'bg-amber-500',
    bgLight: 'bg-amber-50 dark:bg-amber-500/10',
    textLight: 'text-amber-600 dark:text-amber-400',
  },
  {
    title: 'Health Alerts',
    value: '0',
    subtitle: 'All pets are healthy',
    icon: AlertTriangle,
    color: 'bg-green-500',
    bgLight: 'bg-green-50 dark:bg-green-500/10',
    textLight: 'text-green-600 dark:text-green-400',
  },
  {
    title: 'Vet Visits',
    value: '3',
    subtitle: 'Last visit: Oct 12',
    icon: Calendar,
    color: 'bg-purple-500',
    bgLight: 'bg-purple-50 dark:bg-purple-500/10',
    textLight: 'text-purple-600 dark:text-purple-400',
  },
];

const RECENT_ACTIVITY = [
  {
    id: 1,
    pet: 'Max',
    type: 'Dog',
    action: 'Vaccination completed',
    detail: 'DHPP booster administered by Dr. Smith',
    date: '2 days ago',
    icon: Syringe,
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    id: 2,
    pet: 'Luna',
    type: 'Cat',
    action: 'AI Health Check',
    detail: 'Checked for lethargy. Recommended rest and hydration.',
    date: '1 week ago',
    icon: Activity,
    iconBg: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
  },
  {
    id: 3,
    pet: 'Max',
    type: 'Dog',
    action: 'Annual Checkup',
    detail: 'Weight: 24kg. Overall health excellent.',
    date: '1 month ago',
    icon: Calendar,
    iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Good morning, {firstName}! 🐾
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening with your furry friends today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/ai-assistant"
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            AI Check
          </Link>
          <Link
            href="/my-pets"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm shadow-primary-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Pet
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SUMMARY_CARDS.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bgLight} ${card.textLight}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {card.value}
                </h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {card.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {card.subtitle}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent Activity
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {RECENT_ACTIVITY.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex gap-4 relative">
                    {index !== RECENT_ACTIVITY.length - 1 && (
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
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                        {activity.detail}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {activity.date}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions / Promo */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Dog className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Try AI Health Check</h3>
              <p className="text-primary-100 text-sm mb-4 leading-relaxed">
                Describe your pet's symptoms or upload a photo for instant AI-powered health insights.
              </p>
              <Link
                href="/ai-assistant"
                className="inline-block bg-white text-primary-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors"
              >
                Start Checkup
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">
              Quick Links
            </h3>
            <div className="space-y-2">
              <Link
                href="/find-vets"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    <Search className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Find a Vet Nearby
                  </span>
                </div>
              </Link>
              <Link
                href="/my-pets"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
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
