'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  // ChevronRight,
  Lock,
  MoreVertical,
  History,
  X as XIcon,
  Star,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Patient {
  id: string;
  petName: string;
  petType: string;
  breed: string;
  petOwner: string;
  diagnosis: string;
  visitType: 'Routine' | 'Emergency' | 'Walk-in';
  date: string;
  status: 'Completed' | 'In Progress' | 'Scheduled' | 'Cancelled';
  isNewcomer?: boolean;
  medicalHistory?: string[];
}

const INITIAL_PATIENTS: Patient[] = [
  {
    id: '1',
    petName: 'Bella',
    petType: 'Dog',
    breed: 'Labrador',
    petOwner: 'Sarah Jenkins',
    diagnosis: 'Annual Checkup & Vaccines',
    visitType: 'Routine',
    date: 'Today, 10:00 AM',
    status: 'Completed',
    isNewcomer: false,
    medicalHistory: ['Vaccination on 2024-02-15', 'Checkup on 2024-01-10'],
  },
  {
    id: '2',
    petName: 'Oliver',
    petType: 'Cat',
    breed: 'Persian',
    petOwner: 'Mike Thompson',
    diagnosis: 'Lethargy, loss of appetite',
    visitType: 'Emergency',
    date: 'Today, 2:30 PM',
    status: 'In Progress',
    isNewcomer: false,
    medicalHistory: ['Vaccination on 2024-03-01', 'Minor injury treatment on 2024-02-20'],
  },
  {
    id: '3',
    petName: 'Charlie',
    petType: 'Dog',
    breed: 'Golden Retriever',
    petOwner: 'Emily Davis',
    diagnosis: 'Post-surgery follow up',
    visitType: 'Walk-in',
    date: 'Tomorrow, 9:00 AM',
    status: 'Scheduled',
    isNewcomer: true,
    medicalHistory: ['Surgery on 2024-03-15'],
  },
];

const STATUS_OPTIONS = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
const STATUS_COLORS: Record<string, string> = {
  'Completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Scheduled': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Cancelled': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function ClinicPatients() {
  const { user } = useAuth();
  const isPending = user?.verificationStatus === 'pending';
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('clinicPatients');
    if (saved) {
      try {
        setPatients(JSON.parse(saved));
      } catch (e) {
        // Keep initial patients
      }
    }
  }, []);

  // Save to localStorage whenever patients change
  useEffect(() => {
    localStorage.setItem('clinicPatients', JSON.stringify(patients));
  }, [patients]);

  const displayPatients = isPending
    ? []
    : patients.filter(
        (p) =>
          p.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.petOwner.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const updateStatus = (patientId: string, newStatus: string) => {
    setPatients(
      patients.map((p) =>
        p.id === patientId ? { ...p, status: newStatus as any } : p
      )
    );
    setShowStatusDropdown(null);
  };

  const cancelAppointment = (patientId: string) => {
    updateStatus(patientId, 'Cancelled');
    setOpenMenu(null);
  };

  const toggleNewcomer = (patientId: string) => {
    setPatients(
      patients.map((p) =>
        p.id === patientId ? { ...p, isNewcomer: !p.isNewcomer } : p
      )
    );
    setOpenMenu(null);
  };

  const viewHistory = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowHistoryModal(true);
    setOpenMenu(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Clinic Patients
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Manage your patient records and medical history.
        </p>
      </div>

      {isPending && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 p-6 border rounded-lg bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
        >
          <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-200">
              Feature Unavailable During Verification
            </h3>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
              Patient management will be available once your clinic is verified by our admin team.
            </p>
          </div>
        </motion.div>
      )}

      {!isPending && (
        <>
          <div className="overflow-hidden bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800">
            <div className="flex flex-col justify-between gap-4 p-6 border-b border-slate-200 dark:border-slate-800 sm:flex-row sm:items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Recent & Upcoming Cases
              </h2>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="py-2 pr-4 text-sm border rounded-lg outline-none pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white"
                  />
                </div>
                <button className="p-2 transition-colors border rounded-lg border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                      Pet Name
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                      Pet Owner
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                      Diagnosis / Reason
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                      Visit Type
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-right uppercase text-slate-500 dark:text-slate-400">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayPatients.map((patient, idx) => (
                    <motion.tr
                      key={patient.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="transition-colors border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {patient.petName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {patient.petType} • {patient.breed}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {patient.petOwner}
                      </td>
                      <td className="max-w-xs px-6 py-4 truncate text-slate-700 dark:text-slate-300">
                        {patient.diagnosis}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            patient.visitType === 'Emergency'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : patient.visitType === 'Walk-in'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}
                        >
                          {patient.visitType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {patient.date}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowStatusDropdown(
                                showStatusDropdown === patient.id ? null : patient.id
                              )
                            }
                            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                              STATUS_COLORS[patient.status]
                            }`}
                          >
                            {patient.status}
                          </button>

                          <AnimatePresence>
                            {showStatusDropdown === patient.id && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute z-10 mt-2 bg-white border rounded-lg shadow-lg top-full dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                              >
                                {STATUS_OPTIONS.map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => updateStatus(patient.id, status)}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                                      patient.status === status
                                        ? 'font-semibold text-primary-600 dark:text-primary-400'
                                        : 'text-slate-700 dark:text-slate-300'
                                    } first:rounded-t-lg last:rounded-b-lg`}
                                  >
                                    {status}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {patient.isNewcomer && (
                            <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                              <Star className="w-3 h-3" /> New
                            </span>
                          )}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenu(openMenu === patient.id ? null : patient.id)
                              }
                              className="p-2 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            <AnimatePresence>
                              {openMenu === patient.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute right-0 z-10 mt-2 bg-white border rounded-lg shadow-lg top-full dark:bg-slate-800 border-slate-200 dark:border-slate-700 min-w-48"
                                >
                                  <button
                                    onClick={() => viewHistory(patient)}
                                    className="flex items-center w-full gap-2 px-4 py-3 text-sm text-left transition-colors border-b text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700"
                                  >
                                    <History className="w-4 h-4" />
                                    View History
                                  </button>
                                  <button
                                    onClick={() => toggleNewcomer(patient.id)}
                                    className="flex items-center w-full gap-2 px-4 py-3 text-sm text-left transition-colors border-b text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700"
                                  >
                                    <Star className="w-4 h-4" />
                                    {patient.isNewcomer ? 'Remove Newcomer' : 'Mark as Newcomer'}
                                  </button>
                                  <button
                                    onClick={() => cancelAppointment(patient.id)}
                                    className="flex items-center w-full gap-2 px-4 py-3 text-sm text-left text-red-600 transition-colors rounded-b-lg dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <XIcon className="w-4 h-4" />
                                    Cancel Appointment
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {displayPatients.length === 0 && !isPending && (
              <div className="p-12 text-center">
                <p className="text-slate-500 dark:text-slate-400">
                  No patients found. Patients will appear here as they visit your clinic.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Patient History Modal */}
      <AnimatePresence>
        {showHistoryModal && selectedPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowHistoryModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 flex items-center justify-between p-6 bg-white border-b border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedPatient.petName}'s Medical History
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Owner: {selectedPatient.petOwner}
                  </p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <XIcon className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Patient Info */}
                <div className="grid gap-4 p-4 rounded-lg sm:grid-cols-2 bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                      Pet Type
                    </p>
                    <p className="mt-1 font-medium text-slate-900 dark:text-white">
                      {selectedPatient.petType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                      Breed
                    </p>
                    <p className="mt-1 font-medium text-slate-900 dark:text-white">
                      {selectedPatient.breed}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                      Current Status
                    </p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selectedPatient.status]}`}>
                      {selectedPatient.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                      Last Visit
                    </p>
                    <p className="mt-1 font-medium text-slate-900 dark:text-white">
                      {selectedPatient.date}
                    </p>
                  </div>
                </div>

                {/* Current Diagnosis */}
                <div>
                  <h3 className="flex items-center gap-2 mb-3 font-semibold text-slate-900 dark:text-white">
                    <AlertCircle className="w-5 h-5 text-primary-600" />
                    Current Diagnosis
                  </h3>
                  <p className="p-4 border rounded-lg text-slate-700 dark:text-slate-300 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
                    {selectedPatient.diagnosis}
                  </p>
                </div>

                {/* Medical History */}
                <div>
                  <h3 className="flex items-center gap-2 mb-3 font-semibold text-slate-900 dark:text-white">
                    <History className="w-5 h-5 text-primary-600" />
                    Medical History
                  </h3>
                  <div className="space-y-2">
                    {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 ? (
                      selectedPatient.medicalHistory.map((record, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                        >
                          <p className="text-sm text-slate-900 dark:text-white">
                            • {record}
                          </p>
                        </motion.div>
                      ))
                    ) : (
                      <p className="italic text-slate-500 dark:text-slate-400">
                        No previous medical history recorded.
                      </p>
                    )}
                  </div>
                </div>

                {/* Newcomer Status */}
                {selectedPatient.isNewcomer && (
                  <div className="flex items-start gap-3 p-4 border rounded-lg bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <Star className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-200">
                        New Patient
                      </p>
                      <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                        This is the patient's first visit to your clinic.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 font-medium transition-colors rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
