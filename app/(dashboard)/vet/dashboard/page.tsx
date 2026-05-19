'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Dog,
  Cat,
  Clock,
  Search,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const STATS = [
  {
    title: 'Total Patients',
    value: '1,248',
    trend: '+12% this month',
    icon: Users,
    color: 'bg-primary-500',
    bgLight: 'bg-primary-50 dark:bg-primary-500/10',
    textLight: 'text-primary-600 dark:text-primary-400',
  },
  {
    title: 'Dogs Treated',
    value: '842',
    trend: '67% of total',
    icon: Dog,
    color: 'bg-blue-500',
    bgLight: 'bg-blue-50 dark:bg-blue-500/10',
    textLight: 'text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Cats Treated',
    value: '406',
    trend: '33% of total',
    icon: Cat,
    color: 'bg-purple-500',
    bgLight: 'bg-purple-50 dark:bg-purple-500/10',
    textLight: 'text-purple-600 dark:text-purple-400',
  },
  {
    title: 'Pending Cases',
    value: '14',
    trend: 'Needs review',
    icon: Clock,
    color: 'bg-amber-500',
    bgLight: 'bg-amber-50 dark:bg-amber-500/10',
    textLight: 'text-amber-600 dark:text-amber-400',
  },
];

const RECENT_CASES = [
  {
    id: '1',
    petName: 'Bella',
    ownerName: 'Sarah Jenkins',
    type: 'Dog',
    breed: 'Labrador',
    condition: 'Annual Checkup & Vaccines',
    date: 'Today, 10:00 AM',
    status: 'Completed',
    statusColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    id: '2',
    petName: 'Oliver',
    ownerName: 'Mike Thompson',
    type: 'Cat',
    breed: 'Persian',
    condition: 'Lethargy, loss of appetite',
    date: 'Today, 2:30 PM',
    status: 'In Progress',
    statusColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    id: '3',
    petName: 'Charlie',
    ownerName: 'Emily Davis',
    type: 'Dog',
    breed: 'Golden Retriever',
    condition: 'Post-surgery follow up',
    date: 'Tomorrow, 9:00 AM',
    status: 'Scheduled',
    statusColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    id: '4',
    petName: 'Luna',
    ownerName: 'David Wilson',
    type: 'Cat',
    breed: 'Siamese',
    condition: 'Dental cleaning',
    date: 'Tomorrow, 11:15 AM',
    status: 'Scheduled',
    statusColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
];

export default function VetDashboard() {
  const { user } = useAuth();
  const lastName = user?.name?.split(' ').pop() || 'Doctor';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, Dr. {lastName}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Here's an overview of your clinic today.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            View Schedule
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgLight} ${stat.textLight}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {stat.value}
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

      {/* Recent Cases List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Recent & Upcoming Cases
          </h2>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients..."
                className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none dark:text-white"
              />
            </div>
            <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Condition / Reason
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {RECENT_CASES.map((caseItem) => (
                <tr
                  key={caseItem.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg">
                        {caseItem.type === 'Dog' ? '🐶' : '🐱'}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {caseItem.petName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {caseItem.breed}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {caseItem.ownerName}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    {caseItem.condition}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {caseItem.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${caseItem.statusColor}`}
                    >
                      {caseItem.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
