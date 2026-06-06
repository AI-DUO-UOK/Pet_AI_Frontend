'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Loader,
} from 'lucide-react';

// Real clinic data will be fetched from backend
type Clinic = {
  id: string;
  clinic_name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  clinic_logo_url?: string | null;
  is_verified: boolean;
  is_rejected?: boolean;
  rejection_reason?: string | null;
  rejected_at?: string | null;
  verification_status?: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_id: string;
};

interface SelectedClinic {
  id: string;
  action: 'approve' | 'reject' | 'request-info' | null;
}

interface ClinicDetailsModalProps {
  clinic: Clinic;
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
    try {
      const adminPassword = localStorage.getItem('admin_password') || '';
      
      if (action === 'approve') {
        const response = await fetch(
          `http://localhost:8000/api/admin/clinics/${clinic.id}/approve`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${adminPassword}`,
            },
          }
        );
        if (!response.ok) throw new Error('Failed to approve clinic');
      } else if (action === 'reject') {
        const response = await fetch(
          `http://localhost:8000/api/admin/clinics/${clinic.id}/reject`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${adminPassword}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reason: message }),
          }
        );
        if (!response.ok) throw new Error('Failed to reject clinic');
      } else if (action === 'request-info') {
        // For now, just log the request info action
        console.log('Request info:', message);
      }
      onAction(action || 'approve', message);
    } catch (error) {
      console.error('Action failed:', error);
      alert('Action failed: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl my-8 bg-white border shadow-2xl dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <img
              src={clinic.clinic_logo_url || 'https://images.unsplash.com/photo-1631217343661-1d1971f5a196?w=160&h=160&fit=crop'}
              alt={clinic.clinic_name}
              className="object-cover w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700"
            />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {clinic.clinic_name}
              </h2>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                {clinic.address} {clinic.city && `${clinic.city},`} {clinic.state}
              </p>
            </div>
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
          <img
            src={clinic.clinic_logo_url || 'https://images.unsplash.com/photo-1631217343661-1d1971f5a196?w=1200&h=600&fit=crop'}
            alt={`${clinic.clinic_name} cover`}
            className="object-cover w-full h-56 rounded-2xl border border-slate-200 dark:border-slate-700"
          />

          {/* Clinic Info */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Email
              </p>
              <p className="text-slate-900 dark:text-white">{clinic.email}</p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Phone
              </p>
              <p className="text-slate-900 dark:text-white">{clinic.phone}</p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Submitted Date
              </p>
              <p className="text-slate-900 dark:text-white">
                {new Date(clinic.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Days Pending
              </p>
              <p className="text-slate-900 dark:text-white">
                {Math.floor(
                  (Date.now() - new Date(clinic.created_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{' '}
                days
              </p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Current Status
              </p>
              <p className="text-slate-900 dark:text-white capitalize">
                {clinic.verification_status || (clinic.is_rejected ? 'rejected' : clinic.is_verified ? 'approved' : 'pending')}
              </p>
            </div>
          </div>
          {clinic.rejection_reason && (
            <div className="p-6 border-t">
              <p className="mb-2 text-sm font-medium text-red-700">Rejection Reason</p>
              <p className="text-slate-900 dark:text-white">{clinic.rejection_reason}</p>
            </div>
          )}
          {clinic.rejected_at && (
            <div className="p-6 border-t border-red-200 bg-red-50/40 dark:bg-red-900/10 rounded-xl">
              <p className="mb-2 text-sm font-medium text-red-700">Rejected At</p>
              <p className="text-slate-900 dark:text-white">
                {new Date(clinic.rejected_at).toLocaleString()}
              </p>
            </div>
          )}

          {/* Documents - Hidden for now as we don't have file upload support yet */}
          {/* 
          <div>
            <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
              Uploaded Documents
            </p>
            <div className="space-y-2">
              {clinic.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                >
                  <span className="text-slate-700 dark:text-slate-300">{doc}</span>
                  <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          */}

          {/* Action Buttons */}
          <div className="pt-4 space-y-3 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Select Action:
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
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
                {clinic.is_rejected ? 'Reject Again' : 'Reject'}
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
                <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
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
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium transition-colors rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!action || isLoading}
            className="px-4 py-2 font-medium text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
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
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch clinics from backend
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setIsLoading(true);
        const adminPassword = localStorage.getItem('admin_password');
        
        if (!adminPassword) {
          setError('Admin password not found. Please log in again.');
          setIsLoading(false);
          return;
        }

        const response = await fetch('http://localhost:8000/api/admin/clinics', {
          headers: {
            'Authorization': `Bearer ${adminPassword}`,
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Backend error:', response.status, errorText);
          throw new Error(`Failed to fetch clinics (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        setClinics(data.clinics || []);
      } catch (err) {
        console.error('Error fetching clinics:', err);
        setError(String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinics();
  }, []);

  const filteredClinics = clinics.filter((clinic) => {
    const location = `${clinic.address} ${clinic.city || ''} ${clinic.state || ''}`.toLowerCase();
    const clinicStatus =
      clinic.verification_status ||
      (clinic.is_rejected ? 'rejected' : clinic.is_verified ? 'approved' : 'pending');
    const matchesSearch =
      clinic.clinic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && clinicStatus === 'pending') ||
      (statusFilter === 'approved' && clinicStatus === 'approved') ||
      (statusFilter === 'rejected' && clinicStatus === 'rejected');
    return matchesSearch && matchesStatus;
  });

  const handleAction = async (_action: string, _message?: string) => {
    // Refresh the clinic list after action
    setSelectedClinic({ id: '', action: null });
    // Re-fetch clinics
    const adminPassword = localStorage.getItem('admin_password');
    try {
      const response = await fetch('http://localhost:8000/api/admin/clinics', {
        headers: {
          'Authorization': `Bearer ${adminPassword}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setClinics(data.clinics || []);
      }
    } catch (err) {
      console.error('Error refreshing clinics:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Clinic Verification
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Review and approve clinic registrations.
        </p>
      </div>

      {/* Filters */}
      <div className="p-6 bg-white border dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center flex-1 gap-2">
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
              className="px-3 py-2 border rounded-lg outline-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-2xl dark:border-red-800">
          <p className="text-red-700 dark:text-red-400">Error loading clinics: {error}</p>
        </div>
      )}

      {/* Clinics Table */}
      {!isLoading && !error && (
        <div className="overflow-hidden bg-white border dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                        Image
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                    Clinic Name
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                    Location
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                    Submitted Date
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-right uppercase text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClinics.map((clinic, idx) => {
                  const clinicStatus =
                    clinic.verification_status ||
                    (clinic.is_rejected ? 'rejected' : clinic.is_verified ? 'approved' : 'pending');
                  const statusBadgeMap: Record<string, string> = {
                    'pending': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                    'approved': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    'rejected': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                  };

                  return (
                    <motion.tr
                      key={clinic.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="transition-colors border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-6 py-4">
                        <img
                          src={clinic.clinic_logo_url || 'https://images.unsplash.com/photo-1631217343661-1d1971f5a196?w=120&h=120&fit=crop'}
                          alt={clinic.clinic_name}
                          className="object-cover w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {clinic.clinic_name}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {clinic.address} {clinic.city && `${clinic.city},`} {clinic.state}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {new Date(clinic.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadgeMap[clinicStatus] || 'bg-slate-100 text-slate-700'}`}
                        >
                          {clinicStatus === 'approved' ? 'Approved' : clinicStatus === 'rejected' ? 'Rejected' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            setSelectedClinic({ id: clinic.id, action: null })
                          }
                          className="flex items-center gap-1 ml-auto font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredClinics.length === 0 && (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400">
                No clinics found matching your criteria.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Clinic Details Modal */}
      {selectedClinic.id && clinics.length > 0 && (
        <ClinicDetailsModal
          clinic={clinics.find((c) => c.id === selectedClinic.id) || clinics[0]}
          onClose={() => setSelectedClinic({ id: '', action: null })}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
