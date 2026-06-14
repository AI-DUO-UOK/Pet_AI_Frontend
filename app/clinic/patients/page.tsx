'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Lock,
  MoreVertical,
  History,
  X as XIcon,
  Star,
  AlertCircle,
  Syringe,
  Shield,
  ChevronDown,
  ChevronUp,
  Calendar,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Patient {
  id: string;
  petId: string;
  petName: string;
  petType: string;
  breed: string;
  petOwner: string;
  diagnosis: string;
  visitType: 'Routine' | 'Emergency' | 'Walk-in';
  date: string;
  appointmentDate: string;
  appointmentTime?: string;
  status: 'Completed' | 'In Progress' | 'Scheduled' | 'Cancelled';
  isNewcomer?: boolean;
  medicalHistory?: string[];
  lastVisit?: string;
}

interface VaccineRecord {
  id: string;
  pet_id: string;
  vaccine_name: string;
  vaccine_type?: string;
  vaccination_date: string;
  next_due_date?: string;
  batch_number?: string;
  veterinarian_name?: string;
  clinic_name?: string;
  clinic_id?: string;
  notes?: string;
  source: string;
  created_at: string;
}

const formatAppointmentDate = (dateStr?: string, timeStr?: string) => {
  if (!dateStr) return '';
  const dateParts = dateStr.split('-');
  if (dateParts.length === 3) {
    const year = dateParts[0];
    const month = dateParts[1];
    const day = dateParts[2];
    const formattedDate = `${day}/${month}/${year}`;
    if (timeStr) {
      const timeParts = timeStr.split(':');
      if (timeParts.length >= 2) {
        let hours = parseInt(timeParts[0], 10);
        const minutes = timeParts[1];
        let seconds = timeParts[2] ? timeParts[2].split('.')[0] : '00';
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        return `${formattedDate}, ${hours}:${minutes}:${seconds} ${ampm}`;
      }
      return `${formattedDate}, ${timeStr}`;
    }
    return formattedDate;
  }
  
  try {
    const d = new Date(dateStr);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString();
    }
  } catch (e) {}
  return dateStr;
};

const isFutureAppointmentDate = (patient: Patient) => {
  if (!patient.appointmentDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateParts = patient.appointmentDate.split('-');
  if (dateParts.length === 3) {
    const apptDate = new Date(
      parseInt(dateParts[0], 10),
      parseInt(dateParts[1], 10) - 1,
      parseInt(dateParts[2], 10)
    );
    return apptDate > today;
  }
  return false;
};

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
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null);

  // Clinic context
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState<string | null>(null);

  // Vaccine modal states
  const [showVaccineFormModal, setShowVaccineFormModal] = useState(false);
  const [showVaccineTimelineModal, setShowVaccineTimelineModal] = useState(false);
  const [vaccinePatient, setVaccinePatient] = useState<Patient | null>(null);
  const [isSubmittingVaccine, setIsSubmittingVaccine] = useState(false);
  const [vaccineSubmitMessage, setVaccineSubmitMessage] = useState<string | null>(null);
  const [vaccineForm, setVaccineForm] = useState({
    vaccine_name: '',
    vaccination_date: new Date().toISOString().split('T')[0],
    next_due_date: '',
    batch_number: '',
    notes: '',
  });

  // Vaccine timeline states
  const [vaccineRecords, setVaccineRecords] = useState<VaccineRecord[]>([]);
  const [isLoadingVaccines, setIsLoadingVaccines] = useState(false);
  const [expandedVaccineId, setExpandedVaccineId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchPatients = async () => {
      try {
        if (!user) return;

        // Get clinic profile for this user to obtain clinic id
        const clinicRes = await fetch(`http://localhost:8000/api/clinic/profile?user_id=${encodeURIComponent(user.id)}`);
        if (!clinicRes.ok) return;
        const clinicJson = await clinicRes.json();
        const clinic = clinicJson.clinic;
        if (!clinic || !clinic.id) return;

        // Store clinic context for vaccine entry
        if (mounted) {
          setClinicId(clinic.id);
          setClinicName(clinic.clinic_name || 'Clinic');
        }

        const resp = await fetch(`http://localhost:8000/api/clinic/patients?clinic_id=${encodeURIComponent(clinic.id)}`);
        if (!resp.ok) return;
        const j = await resp.json();
        const appts = j.appointments || [];

        // Map appointments to Patient shape
        const mapped = appts.map((a: any) => {
          const statusMapDisplay: Record<string, Patient['status']> = {
            scheduled: 'Scheduled',
            completed: 'Completed',
            cancelled: 'Cancelled',
            in_progress: 'In Progress',
          };

          const visitType = a.reason && a.reason.toLowerCase().includes('vaccine')
            ? 'Routine'
            : a.reason && a.reason.toLowerCase().includes('emergency')
              ? 'Emergency'
              : 'Routine';

          const dateStr = formatAppointmentDate(a.appointment_date, a.appointment_time || a.time);

          return {
            id: a.id,
            petId: a.pet_id,
            petName: a.pet_name || a.pet_id,
            petType: a.pet_type || 'Pet',
            breed: a.breed || '',
            petOwner: a.owner_name || a.owner_id,
            diagnosis: a.reason || a.notes || '',
            visitType,
            date: dateStr,
            appointmentDate: a.appointment_date || '',
            appointmentTime: a.appointment_time || '',
            status: statusMapDisplay[(a.status || 'scheduled').toLowerCase()] || 'Scheduled',
            isNewcomer: false,
            medicalHistory: [],
          } as Patient;
        });

        if (mounted) setPatients(mapped);
      } catch (e) {
        // keep empty state on error
      } finally {
        if (mounted) setIsLoadingPatients(false);
      }
    };

    fetchPatients();

    return () => { mounted = false; };
  }, [user]);

  const displayPatients = isPending
    ? []
    : patients.filter(
        (p) =>
          p.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.petOwner.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const updateStatus = (patientId: string, newStatus: string) => {
    // Map display status back to backend token
    const toBackend: Record<string, string> = {
      'Scheduled': 'scheduled',
      'In Progress': 'in_progress',
      'Completed': 'completed',
      'Cancelled': 'cancelled',
    };
    const backendStatus = toBackend[newStatus] || 'scheduled';

    // Optimistic UI update
    setPatients(patients.map((p) => (p.id === patientId ? { ...p, status: newStatus as any } : p)));
    setShowStatusDropdown(null);

    // Persist to backend
    (async () => {
      try {
        const form = new FormData();
        form.append('status', backendStatus);
        const res = await fetch(`http://localhost:8000/api/appointments/${encodeURIComponent(patientId)}/status`, {
          method: 'POST',
          body: form,
        });
        if (!res.ok) {
          // Revert on failure
          setPatients(patients.map((p) => (p.id === patientId ? { ...p, status: (p.status as any) } : p)));
        }
      } catch (e) {
        // network error — revert
        setPatients(patients.map((p) => (p.id === patientId ? { ...p, status: (p.status as any) } : p)));
      }
    })();
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

  const viewHistory = async (patient: Patient) => {
    setSelectedPatient({
      ...patient,
      lastVisit: 'Loading last visit details...',
      medicalHistory: ['Loading medical history records...'],
    });
    setShowHistoryModal(true);
    setOpenMenu(null);

    try {
      // Fetch appointments for this pet
      const apptsRes = await fetch(`http://localhost:8000/api/appointments/pet?pet_id=${encodeURIComponent(patient.petId)}`);
      let pastApptDates: Date[] = [];
      let historyItems: string[] = [];

      if (apptsRes.ok) {
        const apptsData = await apptsRes.json();
        const petAppts = apptsData.appointments || [];

        const completedAppts = petAppts.filter((appt: any) => {
          const status = (appt.status || '').toLowerCase();
          return status === 'completed';
        });

        completedAppts.forEach((appt: any) => {
          const d = appt.appointment_date ? new Date(`${appt.appointment_date}T${appt.appointment_time || '00:00:00'}`) : null;
          if (d && !Number.isNaN(d.getTime())) {
            pastApptDates.push(d);
            const formatted = formatAppointmentDate(appt.appointment_date, appt.appointment_time);
            const reason = appt.reason || 'General Checkup';
            const notes = appt.notes ? ` (Notes: ${appt.notes})` : '';
            historyItems.push(`${formatted} - Completed Visit for ${reason}${notes}`);
          }
        });
      }

      // Fetch medical records for this pet
      const medRes = await fetch(`http://localhost:8000/api/pet/medical-records?pet_id=${encodeURIComponent(patient.petId)}`);
      if (medRes.ok) {
        const medData = await medRes.json();
        const records = medData.records || [];
        records.forEach((rec: any) => {
          const d = rec.visit_date ? new Date(rec.visit_date) : null;
          if (d && !Number.isNaN(d.getTime())) {
            pastApptDates.push(d);
          }
          const formatted = rec.visit_date ? formatAppointmentDate(rec.visit_date) : 'Unknown Date';
          const diagnosis = rec.diagnosis || 'No diagnosis recorded';
          const treatment = rec.treatment ? `, Treatment: ${rec.treatment}` : '';
          const notes = rec.notes ? ` (Notes: ${rec.notes})` : '';
          historyItems.push(`${formatted} - Diagnosis: ${diagnosis}${treatment}${notes}`);
        });
      }

      // Determine newcomer and last visit date
      const today = new Date();
      const pastVisits = pastApptDates.filter((d) => d < today);
      
      let lastVisitStr = 'Newcomer (No previous visits)';
      let isNewcomer = true;

      if (pastVisits.length > 0) {
        pastVisits.sort((a, b) => b.getTime() - a.getTime());
        const lastVisitDate = pastVisits[0];
        lastVisitStr = formatAppointmentDate(
          lastVisitDate.toISOString().split('T')[0],
          lastVisitDate.toTimeString().split(' ')[0]
        );
        isNewcomer = false;
      }

      const newcomerStatus = patient.isNewcomer || isNewcomer;

      setSelectedPatient((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lastVisit: lastVisitStr,
          isNewcomer: newcomerStatus,
          medicalHistory: historyItems.length > 0 ? historyItems : [],
        };
      });
    } catch (err) {
      console.warn("Failed to fetch pet medical history:", err);
      setSelectedPatient((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lastVisit: 'N/A',
          medicalHistory: ['No medical history records could be loaded.'],
        };
      });
    }
  };

  // ---- Vaccine Management Functions ----

  const formatDateForDisplay = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getVaccineStatus = (record: VaccineRecord): { label: string; color: string; icon: string } => {
    if (!record.next_due_date) return { label: 'Given', color: 'text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20', icon: '✅' };

    const now = new Date();
    const dueDate = new Date(record.next_due_date);
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: `Overdue by ${Math.abs(diffDays)} days`, color: 'text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20', icon: '🔴' };
    if (diffDays <= 7) return { label: `Due in ${diffDays} days`, color: 'text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20', icon: '🟡' };
    if (diffDays <= 30) return { label: `Due in ${diffDays} days`, color: 'text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20', icon: '🔵' };
    return { label: `Due ${formatDateForDisplay(record.next_due_date)}`, color: 'text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50', icon: '📅' };
  };

  const buildVaccineTimeline = () => {
    const grouped: Record<string, VaccineRecord[]> = {};
    for (const record of vaccineRecords) {
      const date = new Date(record.vaccination_date);
      const year = date.getFullYear().toString();
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(record);
    }
    const sortedYears = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));
    return sortedYears.map(year => ({
      year,
      records: grouped[year].sort((a, b) =>
        new Date(b.vaccination_date).getTime() - new Date(a.vaccination_date).getTime()
      ),
    }));
  };

  const openRecordVaccine = (patient: Patient) => {
    setVaccinePatient(patient);
    setVaccineForm({
      vaccine_name: '',
      vaccination_date: new Date().toISOString().split('T')[0],
      next_due_date: '',
      batch_number: '',
      notes: '',
    });
    setVaccineSubmitMessage(null);
    setShowVaccineFormModal(true);
    setOpenMenu(null);
  };

  const handleVaccineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaccinePatient) return;

    setIsSubmittingVaccine(true);
    setVaccineSubmitMessage(null);

    try {
      const formData = new FormData();
      formData.append('pet_id', vaccinePatient.petId);
      formData.append('vaccine_name', vaccineForm.vaccine_name);
      formData.append('vaccination_date', vaccineForm.vaccination_date);
      if (vaccineForm.next_due_date) formData.append('next_due_date', vaccineForm.next_due_date);
      if (vaccineForm.batch_number) formData.append('batch_number', vaccineForm.batch_number);
      if (vaccineForm.notes) formData.append('notes', vaccineForm.notes);
      formData.append('veterinarian_name', user?.name || 'Veterinarian');
      if (clinicName) formData.append('clinic_name', clinicName);
      if (clinicId) formData.append('clinic_id', clinicId);
      formData.append('source', 'vet_entry');

      const response = await fetch('http://localhost:8000/api/vaccines/manual-entry', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.detail || data.error || 'Failed to record vaccine');
      }

      setVaccineSubmitMessage('✅ Vaccine record added successfully!');
      setVaccineForm({
        vaccine_name: '',
        vaccination_date: new Date().toISOString().split('T')[0],
        next_due_date: '',
        batch_number: '',
        notes: '',
      });

      // Auto-close after a brief delay
      setTimeout(() => {
        setShowVaccineFormModal(false);
        setVaccinePatient(null);
        setVaccineSubmitMessage(null);
      }, 1500);
    } catch (err) {
      setVaccineSubmitMessage(`❌ ${err instanceof Error ? err.message : 'Failed to record vaccine'}`);
    } finally {
      setIsSubmittingVaccine(false);
    }
  };

  const openVaccineTimeline = async (patient: Patient) => {
    setVaccinePatient(patient);
    setVaccineRecords([]);
    setExpandedVaccineId(null);
    setIsLoadingVaccines(true);
    setShowVaccineTimelineModal(true);
    setOpenMenu(null);

    try {
      const response = await fetch(`http://localhost:8000/api/vaccines/${encodeURIComponent(patient.petId)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.records) {
          setVaccineRecords(data.records);
        }
      }
    } catch (err) {
      console.error('Error fetching vaccines:', err);
    } finally {
      setIsLoadingVaccines(false);
    }
  };

  const vaccineTimeline = buildVaccineTimeline();

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
                                {STATUS_OPTIONS.map((status) => {
                                  const isFuture = isFutureAppointmentDate(patient);
                                  const isDisabled = isFuture && (status === 'Completed' || status === 'In Progress');
                                  return (
                                    <button
                                      key={status}
                                      disabled={isDisabled}
                                      onClick={() => !isDisabled && updateStatus(patient.id, status)}
                                      title={isDisabled ? "Cannot set future appointments to Completed or In Progress" : ""}
                                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                        isDisabled
                                          ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'
                                          : patient.status === status
                                            ? 'font-semibold text-primary-600 dark:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                      } first:rounded-t-lg last:rounded-b-lg`}
                                    >
                                      {status}
                                    </button>
                                  );
                                })}
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
                                    onClick={() => openRecordVaccine(patient)}
                                    className="flex items-center w-full gap-2 px-4 py-3 text-sm text-left transition-colors border-b text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 border-slate-200 dark:border-slate-700"
                                  >
                                    <Syringe className="w-4 h-4" />
                                    Record Vaccine
                                  </button>
                                  <button
                                    onClick={() => openVaccineTimeline(patient)}
                                    className="flex items-center w-full gap-2 px-4 py-3 text-sm text-left transition-colors border-b text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-slate-200 dark:border-slate-700"
                                  >
                                    <Shield className="w-4 h-4" />
                                    Vaccine Timeline
                                  </button>
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

            {isLoadingPatients ? (
              <div className="p-12 text-center">
                <p className="text-slate-500 dark:text-slate-400">Loading real clinic cases...</p>
              </div>
            ) : displayPatients.length === 0 && !isPending && (
              <div className="p-12 text-center">
                <p className="text-slate-500 dark:text-slate-400">
                  No clinic appointments found yet.
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
                      {selectedPatient.lastVisit || 'Newcomer (No previous visits)'}
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

      {/* Record Vaccine Modal */}
      <AnimatePresence>
        {showVaccineFormModal && vaccinePatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowVaccineFormModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 flex items-center justify-between p-6 bg-white border-b border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-t-2xl">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                    <Syringe className="w-5 h-5 text-green-600" />
                    Record Vaccine
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    For <strong>{vaccinePatient.petName}</strong> • Owner: {vaccinePatient.petOwner}
                  </p>
                </div>
                <button
                  onClick={() => setShowVaccineFormModal(false)}
                  className="p-2 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <XIcon className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleVaccineSubmit} className="p-6 space-y-5">
                {/* Auto-filled info */}
                <div className="grid gap-3 p-4 rounded-lg sm:grid-cols-2 bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Veterinarian</p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{user?.name || 'Veterinarian'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Clinic</p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{clinicName || 'Clinic'}</p>
                  </div>
                </div>

                {/* Vaccine Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Vaccine Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Rabies, DHPP, Bordetella"
                    value={vaccineForm.vaccine_name}
                    onChange={(e) => setVaccineForm({ ...vaccineForm, vaccine_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all dark:text-white"
                  />
                </div>

                {/* Date Given + Next Due Date */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Date Given <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={vaccineForm.vaccination_date}
                      onChange={(e) => setVaccineForm({ ...vaccineForm, vaccination_date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Next Due Date
                    </label>
                    <input
                      type="date"
                      value={vaccineForm.next_due_date}
                      onChange={(e) => setVaccineForm({ ...vaccineForm, next_due_date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>

                {/* Batch Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Batch / Lot Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., LOT-2025-A123"
                    value={vaccineForm.batch_number}
                    onChange={(e) => setVaccineForm({ ...vaccineForm, batch_number: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all dark:text-white"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    placeholder="Additional notes about this vaccination..."
                    value={vaccineForm.notes}
                    onChange={(e) => setVaccineForm({ ...vaccineForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all dark:text-white resize-none"
                  />
                </div>

                {/* Submit message */}
                {vaccineSubmitMessage && (
                  <div className={`text-sm p-3 rounded-lg border ${
                    vaccineSubmitMessage.startsWith('✅')
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
                  }`}>
                    {vaccineSubmitMessage}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowVaccineFormModal(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingVaccine}
                    className="flex items-center justify-center flex-1 gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {isSubmittingVaccine ? 'Recording...' : 'Record Vaccine'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vaccine Timeline Modal */}
      <AnimatePresence>
        {showVaccineTimelineModal && vaccinePatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowVaccineTimelineModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 flex items-center justify-between p-6 bg-white border-b border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-t-2xl">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                    <Shield className="w-5 h-5 text-green-600" />
                    Vaccination History & Timeline
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    <strong>{vaccinePatient.petName}</strong> • Owner: {vaccinePatient.petOwner}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowVaccineTimelineModal(false);
                      openRecordVaccine(vaccinePatient);
                    }}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Vaccine
                  </button>
                  <button
                    onClick={() => setShowVaccineTimelineModal(false)}
                    className="p-2 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <XIcon className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {isLoadingVaccines ? (
                  <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                    Loading vaccination records...
                  </div>
                ) : vaccineRecords.length === 0 ? (
                  <div className="py-12 space-y-4 text-center">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800">
                      <Syringe className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">No Vaccine Records</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        No vaccination records found for this pet yet.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowVaccineTimelineModal(false);
                        openRecordVaccine(vaccinePatient);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" />
                      Record First Vaccine
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Stats summary */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="p-3 text-center border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{vaccineRecords.length}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Vaccines</p>
                      </div>
                      <div className="p-3 text-center border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                          {vaccineRecords.filter(r => !r.next_due_date || new Date(r.next_due_date) >= new Date()).length}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-500">Up to Date</p>
                      </div>
                      <div className="p-3 text-center border rounded-lg bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700">
                        <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                          {vaccineRecords.filter(r => {
                            if (!r.next_due_date) return false;
                            const diff = Math.ceil((new Date(r.next_due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            return diff > 0 && diff <= 30;
                          }).length}
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-500">Due Soon</p>
                      </div>
                      <div className="p-3 text-center border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
                        <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                          {vaccineRecords.filter(r => r.next_due_date && new Date(r.next_due_date) < new Date()).length}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-500">Overdue</p>
                      </div>
                    </div>

                    {/* Timeline by year */}
                    <div className="relative pl-8 space-y-6 border-l-2 border-green-300 dark:border-green-700">
                      {vaccineTimeline.map(({ year, records }) => (
                        <div key={year}>
                          {/* Year header */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="absolute left-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 -translate-x-1/2" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{year}</h3>
                          </div>

                          {/* Records for this year */}
                          <div className="ml-2 space-y-2">
                            {records.map((record) => {
                              const status = getVaccineStatus(record);
                              const isExpanded = expandedVaccineId === record.id;

                              return (
                                <motion.div
                                  key={record.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className={`rounded-lg border p-3 cursor-pointer transition-all ${status.color}`}
                                  onClick={() => setExpandedVaccineId(isExpanded ? null : record.id)}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2 min-w-0">
                                      <Syringe className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-600 dark:text-slate-400" />
                                      <div className="min-w-0">
                                        <p className="font-semibold truncate text-slate-900 dark:text-white">
                                          {record.vaccine_name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          Given: {formatDateForDisplay(record.vaccination_date)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center flex-shrink-0 gap-2">
                                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 whitespace-nowrap">
                                        {status.icon} {status.label}
                                      </span>
                                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </div>
                                  </div>

                                  {/* Expanded details */}
                                  {isExpanded && (
                                    <div className="mt-3 pt-3 border-t border-current/20 space-y-2 text-sm">
                                      {record.vaccine_type && (
                                        <p><span className="font-medium text-slate-600 dark:text-slate-400">Type:</span> {record.vaccine_type}</p>
                                      )}
                                      {record.batch_number && (
                                        <p><span className="font-medium text-slate-600 dark:text-slate-400">Batch:</span> {record.batch_number}</p>
                                      )}
                                      {record.veterinarian_name && (
                                        <p><span className="font-medium text-slate-600 dark:text-slate-400">Vet:</span> {record.veterinarian_name}</p>
                                      )}
                                      {record.clinic_name && (
                                        <p><span className="font-medium text-slate-600 dark:text-slate-400">Clinic:</span> {record.clinic_name}</p>
                                      )}
                                      {record.next_due_date && (
                                        <p><span className="font-medium text-slate-600 dark:text-slate-400">Next Due:</span> {formatDateForDisplay(record.next_due_date)}</p>
                                      )}
                                      {record.notes && (
                                        <p><span className="font-medium text-slate-600 dark:text-slate-400">Notes:</span> {record.notes}</p>
                                      )}
                                      <p className="text-xs text-slate-400 dark:text-slate-500">
                                        Source: {record.source === 'vlm_extracted' ? 'Document Upload' : record.source === 'vet_entry' ? 'Veterinarian' : 'Manual'}
                                      </p>
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setShowVaccineTimelineModal(false)}
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
