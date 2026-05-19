'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
} from 'lucide-react';

const PENDING_CLINICS = [
  {
    id: '1',
    name: 'Happy Paws Clinic',
    location: 'Colombo 3, Western Province',
    submittedDate: '2024-04-26',
    status: 'Pending',
    statusBadge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    documents: ['license.pdf', 'clinic_photo.jpg'],
    email: 'contact@happypaws.lk',
    phone: '+94 71 234 5678',
  },
  {
    id: '2',
    name: 'Elite Animal Hospital',
    location: 'Kandy, Central Province',
    submittedDate: '2024-04-25',
    status: 'Pending',
    statusBadge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    documents: ['registration.pdf', 'facility_photos.zip'],
    email: 'admin@eliteanimal.lk',
    phone: '+94 81 456 7890',
  },
  {
    id: '3',
    name: 'Paws & Whiskers',
    location: 'Galle, Southern Province',
    submittedDate: '2024-04-24',
    status: 'Pending',
    statusBadge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    documents: ['license.pdf'],
    email: 'info@pawswhiskers.lk',
    phone: '+94 91 789 0123',
  },
];

interface SelectedClinic {
  id: string;
  action: 'approve' | 'reject' | 'request-info' | null;
}

interface ClinicDetailsModalProps {
  clinic: (typeof PENDING_CLINICS)[0];
  onClose: () => void;
  onAction: (action: 'approve' | 'reject' | 'request-info', message?: string) => void;
}

function ClinicDetailsModal({
  clinic,
  onClose,
  onAction,
}: ClinicDetailsModalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | 'request-info' | null>(
    null
  );
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onAction(action || 'approve', message);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {clinic.name}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {clinic.location}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Clinic Info */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Email
              </p>
              <p className="text-slate-900 dark:text-white">{clinic.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Phone
              </p>
              <p className="text-slate-900 dark:text-white">{clinic.phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Submitted Date
              </p>
              <p className="text-slate-900 dark:text-white">
                {new Date(clinic.submittedDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Days Pending
              </p>
              <p className="text-slate-900 dark:text-white">
                {Math.floor(
                  (Date.now() - new Date(clinic.submittedDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{' '}
                days
              </p>
            </div>
          </div>

          {/* Documents */}
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Uploaded Documents
            </p>
            <div className="space-y-2">
              {clinic.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <span className="text-slate-700 dark:text-slate-300">{doc}</span>
                  <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Select Action:
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setAction('approve')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  action === 'approve'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setAction('reject')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  action === 'reject'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800'
                }`}
              >
                <XCircle className="w-4 h-4" />
                Reject
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setAction('request-info')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  action === 'request-info'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                Request Info
              </motion.button>
            </div>

            {(action === 'reject' || action === 'request-info') && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Message to Clinic
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide details about the rejection or information requested..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white resize-none"
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!action || isLoading}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Processing...' : 'Confirm Action'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminClinicVerification() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedClinic, setSelectedClinic] = useState<SelectedClinic>({
    id: '',
    action: null,
  });

  const filteredClinics = PENDING_CLINICS.filter((clinic) => {
    const matchesSearch =
      clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && clinic.status === 'Pending');
    return matchesSearch && matchesStatus;
  });

  const handleAction = (action: string, message?: string) => {
    console.log(`Action: ${action} for clinic ${selectedClinic.id}`, message);
    setSelectedClinic({ id: '', action: null });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Clinic Verification
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Review and approve clinic registrations.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clinics by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none dark:text-white placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as 'all' | 'pending' | 'approved' | 'rejected'
                )
              }
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clinics Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Clinic Name
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Submitted Date
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredClinics.map((clinic, idx) => (
                <motion.tr
                  key={clinic.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {clinic.name}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                    {clinic.location}
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300 text-sm">
                    {new Date(clinic.submittedDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${clinic.statusBadge}`}
                    >
                      {clinic.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setSelectedClinic({ id: clinic.id, action: null })
                      }
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClinics.length === 0 && (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">
              No clinics found matching your criteria.
            </p>
          </div>
        )}
      </div>

      {/* Clinic Details Modal */}
      {selectedClinic.id && (
        <ClinicDetailsModal
          clinic={PENDING_CLINICS.find((c) => c.id === selectedClinic.id) || PENDING_CLINICS[0]}
          onClose={() => setSelectedClinic({ id: '', action: null })}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
