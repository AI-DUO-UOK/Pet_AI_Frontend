'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Star,
  CheckCircle,
  X,
  Send,
  Syringe,
  Bot,
  Upload,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Appointment {
  id: string;
  clinic: string;
  doctor: string;
  date: string;
  time: string;
  type: string;
  status: string;
  address: string;
  notes?: string;
  reviewed?: boolean;
  review?: {
    rating: number;
    treatment: string;
    comment: string;
  };
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

interface PetDetails {
  id: string;
  name: string;
  type: string;
  breed: string;
  date_of_birth: string;
  weight?: number | string | null;
  weight_unit?: string | null;
  blood_type?: string | null;
  profile_image_url?: string | null;
  microchip_id?: string | null;
}

const MOCK_APPOINTMENTS: Record<string, Appointment[]> = {
  '1': [
    {
      id: '1',
      clinic: 'Paws & Claws Veterinary Clinic',
      doctor: 'Dr. Sarah Jenkins',
      date: 'May 15, 2024',
      time: '10:30 AM',
      type: 'Regular Checkup',
      status: 'upcoming',
      address: '123 Pet Street, New York, NY',
    },
    {
      id: '2',
      clinic: 'City Center Animal Hospital',
      doctor: 'Dr. Michael Chen',
      date: 'June 2, 2024',
      time: '2:00 PM',
      type: 'Vaccination',
      status: 'upcoming',
      address: '456 Animal Ave, New York, NY',
    },
    {
      id: '3',
      clinic: 'Happy Tails Vet Care',
      doctor: 'Dr. Emily Rodriguez',
      date: 'April 10, 2024',
      time: '3:15 PM',
      type: 'Annual Checkup',
      status: 'completed',
      address: '789 Vet Lane, New York, NY',
      notes: 'Very healthy, no issues found. Continue regular exercise and diet.',
      reviewed: false,
    },
    {
      id: '4',
      clinic: 'Paws & Claws Veterinary Clinic',
      doctor: 'Dr. Sarah Jenkins',
      date: 'March 5, 2024',
      time: '11:00 AM',
      type: 'Dental Cleaning',
      status: 'completed',
      address: '123 Pet Street, New York, NY',
      notes: 'Dental cleaning successful. No cavities detected.',
      reviewed: true,
      review: {
        rating: 5,
        treatment: 'Excellent care and gentle handling',
        comment: 'Dr. Jenkins was very professional and Max was comfortable throughout the procedure.',
      },
    },
  ],
  '2': [
    {
      id: '5',
      clinic: 'City Center Animal Hospital',
      doctor: 'Dr. Michael Chen',
      date: 'May 20, 2024',
      time: '9:00 AM',
      type: 'Feline Health Check',
      status: 'upcoming',
      address: '456 Animal Ave, New York, NY',
    },
    {
      id: '6',
      clinic: 'Happy Tails Vet Care',
      doctor: 'Dr. Emily Rodriguez',
      date: 'April 1, 2024',
      time: '1:30 PM',
      type: 'Vaccination Update',
      status: 'completed',
      address: '789 Vet Lane, New York, NY',
      notes: 'All vaccinations up to date. Luna is in perfect health.',
      reviewed: false,
    },
  ],
};

export default function PetProfile() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [petDetails, setPetDetails] = useState<PetDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vaccine state
  const [vaccineRecords, setVaccineRecords] = useState<VaccineRecord[]>([]);
  const [isLoadingVaccines, setIsLoadingVaccines] = useState(false);
  const [hasUploadedDocument, setHasUploadedDocument] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [expandedVaccineId, setExpandedVaccineId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:8000/api/pets/${petId}`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to load pet (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        setPetDetails(data.pet);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pet profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (petId) fetchPet();
  }, [petId]);

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '';
    const birthDate = new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? `${age} years` : 'Less than 1 year';
  };

  const formatDateOfBirth = (dateOfBirth: string) => {
    if (!dateOfBirth) return '';
    const parsed = new Date(dateOfBirth);
    if (Number.isNaN(parsed.getTime())) return dateOfBirth;
    return parsed.toLocaleDateString();
  };

  const petImageUrl = petDetails?.profile_image_url ||
    (petDetails?.type?.toLowerCase() === 'cat'
      ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&h=400&fit=crop'
      : 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&h=400&fit=crop');

  const [appointments, setAppointments] = useState<any[]>(
    MOCK_APPOINTMENTS[petId as keyof typeof MOCK_APPOINTMENTS] || []
  );

  const formatDateShort = (d?: string) => {
    if (!d) return '';
    const parsed = new Date(d);
    if (Number.isNaN(parsed.getTime())) return d;
    return parsed.toLocaleDateString();
  };

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

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    treatment: '',
    comment: '',
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const getStatusMeta = (status?: string) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'cancelled') {
      return { label: 'Cancelled', className: 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400' };
    }
    if (normalized === 'in_progress') {
      return { label: 'In Progress', className: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' };
    }
    if (normalized === 'scheduled' || normalized === 'upcoming') {
      return { label: 'Scheduled', className: 'text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' };
    }
    return { label: 'Completed', className: 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400' };
  };

  const canReviewAppointment = (appointment: Appointment) => {
    const status = (appointment.status || '').toLowerCase();
    return status === 'completed' && !appointment.reviewed;
  };

  const getAppointmentDate = (appointment: any) => {
    const rawDate = appointment.appointment_date || appointment.date || appointment.created_at || '';
    const rawTime = appointment.appointment_time || appointment.time || '';
    const combined = rawTime ? `${rawDate} ${rawTime}` : rawDate;
    const parsed = new Date(combined);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const normalizeAppointment = (appointment: any, clinicNameMap: Record<string, string>) => {
    const appointmentDate = getAppointmentDate(appointment);
    const clinicId = appointment.clinic_id || '';
    const clinicName =
      appointment.clinic_name ||
      clinicNameMap[clinicId] ||
      appointment.clinic ||
      clinicId ||
      'Clinic';

    const rawStatus = (appointment.status || '').toLowerCase();
    let statusDisplay = 'scheduled';
    if (rawStatus === 'completed') {
      statusDisplay = 'completed';
    } else if (rawStatus === 'cancelled') {
      statusDisplay = 'cancelled';
    } else if (rawStatus === 'in_progress') {
      statusDisplay = 'in_progress';
    } else if (appointmentDate && appointmentDate <= new Date()) {
      statusDisplay = 'completed';
    } else {
      statusDisplay = 'upcoming';
    }

    let doctorName = appointment.doctor_name || appointment.doctor || '';
    if (!doctorName) {
      doctorName = 'Dr. Sarah Jenkins';
    }

    return {
      id: String(appointment.id),
      clinic: clinicName,
      doctor: doctorName,
      date: appointment.appointment_date || appointment.date || '',
      time: appointment.appointment_time || appointment.time || '',
      type: appointment.reason || appointment.type || 'Appointment',
      status: statusDisplay,
      address: appointment.address || appointment.location || '',
      notes: appointment.notes || '',
      reviewed: appointment.reviewed || false,
      review: appointment.review,
    } as Appointment;
  };

  // Fetch vaccine records
  const fetchVaccines = async () => {
    if (!petId) return;
    try {
      setIsLoadingVaccines(true);
      const response = await fetch(`http://localhost:8000/api/vaccines/${petId}`);
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

  // Check if document already uploaded
  const checkDocuments = async () => {
    if (!petId) return;
    try {
      const response = await fetch(`http://localhost:8000/api/vaccines/${petId}/documents`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.documents && data.documents.length > 0) {
          setHasUploadedDocument(true);
        }
      }
    } catch (err) {
      console.error('Error checking vaccine documents:', err);
    }
  };

  useEffect(() => {
    if (petId) {
      fetchVaccines();
      checkDocuments();
    }
  }, [petId]);

  // Upload vaccine document
  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !petId) return;

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const formData = new FormData();
      formData.append('pet_id', petId);
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/vaccines/upload-document', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setUploadMessage(`✅ Successfully extracted ${data.records_count} vaccine records!`);
        setHasUploadedDocument(true);
        await fetchVaccines();
      } else {
        setUploadMessage(`❌ ${data.detail || 'Failed to process document'}`);
      }
    } catch (err) {
      setUploadMessage(`❌ Error: ${err instanceof Error ? err.message : 'Upload failed'}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const fetchRemote = async () => {
      try {
        const clinicNameMap: Record<string, string> = {};

        try {
          const clinicsRes = await fetch('http://localhost:8000/api/clinics');
          if (clinicsRes.ok) {
            const clinicsJson = await clinicsRes.json();
            const clinics = clinicsJson.clinics || [];
            for (const clinic of clinics) {
              clinicNameMap[String(clinic.id)] = clinic.clinic_name || clinic.name || clinic.business_name || 'Clinic';
            }
          }
        } catch (e) {
          // ignore
        }

        try {
          const apptRes = await fetch(
            `http://localhost:8000/api/appointments/pet?pet_id=${encodeURIComponent(petId)}`
          );
          if (apptRes.ok) {
            const aj = await apptRes.json();
            const all = aj.appointments || [];
            if (all.length) {
              setAppointments(all.map((a: any) => normalizeAppointment(a, clinicNameMap)));
            }
          }
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore
      }
    };

    if (petDetails) fetchRemote();
  }, [petDetails, petId]);

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const upcomingAppointments = appointments.filter((a) => {
    const d = getAppointmentDate(a);
    const status = (a.status || '').toLowerCase();
    return d && d > today && status !== 'cancelled' && status !== 'completed';
  });
  const pastAppointments = appointments.filter((a) => {
    const d = getAppointmentDate(a);
    const status = (a.status || '').toLowerCase();
    return d && (d <= today || status === 'completed' || status === 'cancelled');
  });

  // Build vaccine timeline grouped by year
  const buildVaccineTimeline = () => {
    const grouped: Record<string, VaccineRecord[]> = {};
    for (const record of vaccineRecords) {
      const date = new Date(record.vaccination_date);
      const year = date.getFullYear().toString();
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(record);
    }

    // Sort years descending
    const sortedYears = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));
    
    return sortedYears.map(year => ({
      year,
      records: grouped[year].sort((a, b) => 
        new Date(b.vaccination_date).getTime() - new Date(a.vaccination_date).getTime()
      ),
    }));
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

  const vaccineTimeline = buildVaccineTimeline();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500 dark:text-slate-400">Loading pet profile...</p>
      </div>
    );
  }

  if (error || !petDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500 dark:text-slate-400">{error || 'Pet not found'}</p>
      </div>
    );
  }
  
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    try {
      setIsSubmittingReview(true);
      const response = await fetch('http://localhost:8000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: selectedAppointment.id,
          rating: reviewForm.rating,
          treatment: reviewForm.treatment,
          comment: reviewForm.comment,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.detail || data.error || 'Failed to submit review');
      }

      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === selectedAppointment.id
            ? { ...appointment, reviewed: true, review: data.review }
            : appointment
        )
      );
      setShowReviewModal(false);
      setSelectedAppointment(null);
      setReviewForm({ rating: 5, treatment: '', comment: '' });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {petDetails.name}'s Profile
        </h1>
      </div>

      {/* Pet Details Card */}
      <div className="overflow-hidden bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
          <div className="flex justify-center md:col-span-1">
            <div className="relative">
              <img
                src={petImageUrl}
                alt={petDetails.name}
                className="object-cover w-48 h-48 border-4 rounded-2xl border-primary-500/20"
              />
              <div className="absolute top-4 right-4 bg-white dark:bg-slate-900 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold shadow-md">
                {petDetails.type === 'Dog' ? '🐶' : '🐱'} {petDetails.type}
              </div>
            </div>
          </div>

          <div className="space-y-4 md:col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">Breed</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{petDetails.breed}</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">Age</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{calculateAge(petDetails.date_of_birth)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">Weight</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {petDetails.weight ? `${petDetails.weight}${petDetails.weight_unit ? ` ${petDetails.weight_unit}` : ''}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">Blood Type</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{petDetails.blood_type || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">Date of Birth</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{formatDateOfBirth(petDetails.date_of_birth)}</p>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={`/ai-assistant?pet_id=${petDetails.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-primary-600/20"
              >
                <Bot className="w-5 h-5" />
                AI Health Assistant
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="p-6 bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800">
        <h2 className="flex items-center gap-2 mb-4 text-2xl font-bold text-slate-900 dark:text-white">
          <Calendar className="w-6 h-6 text-primary-600" />
          Upcoming Appointments
        </h2>

        {upcomingAppointments.length > 0 ? (
          <div className="space-y-3">
            {upcomingAppointments.map((appointment, idx) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start gap-4 p-4 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800"
              >
                <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/40">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {appointment.type || appointment.reason}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    <strong>{appointment.clinic || appointment.clinic_name || appointment.clinic_id || 'Clinic'}</strong>
                    {appointment.doctor || appointment.doctor_name ? (
                      <> • Dr. {(appointment.doctor || appointment.doctor_name).split(' ').slice(-1).join(' ')}</>
                    ) : null}
                  </p>
                  <p className="flex items-center gap-1 mt-2 text-sm text-slate-500 dark:text-slate-400">
                    <Calendar className="w-4 h-4" /> {formatDateShort(appointment.appointment_date || appointment.date)} at {appointment.appointment_time || appointment.time || ''}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-slate-500 dark:text-slate-400">No upcoming appointments scheduled</p>
        )}
      </div>

      {/* Past Appointments & Channelling */}
      <div className="p-6 bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800">
        <h2 className="flex items-center gap-2 mb-4 text-2xl font-bold text-slate-900 dark:text-white">
          <CheckCircle className="w-6 h-6 text-primary-600" />
          Channelling History
        </h2>

        {pastAppointments.length > 0 ? (
          <div className="space-y-3">
            {pastAppointments.map((appointment, idx) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{appointment.type}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusMeta(appointment.status).className}`}>
                        {getStatusMeta(appointment.status).label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      <strong>{appointment.clinic || appointment.clinic_name || appointment.clinic_id || 'Clinic'}</strong> • {appointment.doctor || appointment.doctor_name || ''}
                    </p>
                    <p className="flex items-center gap-1 mt-2 text-sm text-slate-500 dark:text-slate-400">
                      <Calendar className="w-4 h-4" /> {formatDateShort(appointment.appointment_date || appointment.date)} at {appointment.appointment_time || appointment.time || ''}
                    </p>
                    {appointment.notes && (
                      <p className="p-3 mt-3 text-sm italic bg-white rounded-lg text-slate-600 dark:text-slate-300 dark:bg-slate-900">
                        "{appointment.notes}"
                      </p>
                    )}
                    {appointment.reviewed && appointment.review && (
                      <div className="p-3 mt-3 border rounded-lg bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${
                                i < (appointment.review?.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                              }`} />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">Your Review</span>
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Treatment: {appointment.review?.treatment}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{appointment.review?.comment}</p>
                      </div>
                    )}
                  </div>
                  {canReviewAppointment(appointment) && (
                    <button
                      onClick={() => { setSelectedAppointment(appointment); setShowReviewModal(true); }}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700 whitespace-nowrap"
                    >
                      <Star className="w-4 h-4" /> Give Review
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-slate-500 dark:text-slate-400">No past appointments yet</p>
        )}
      </div>

      {/* Vaccination History & Timeline */}
      <div className="p-6 bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800">
        <h2 className="flex items-center gap-2 mb-4 text-2xl font-bold text-slate-900 dark:text-white">
          <Shield className="w-6 h-6 text-green-600" />
          Vaccination History & Timeline
        </h2>

        {isLoadingVaccines ? (
          <div className="py-8 text-center text-slate-500 dark:text-slate-400">Loading vaccine records...</div>
        ) : vaccineRecords.length === 0 && !hasUploadedDocument ? (
          /* First-time upload UI */
          <div className="text-center py-8 space-y-4">
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Upload className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Upload Vaccine Booklet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Upload your pet's vaccine card or booklet to digitize all records. 
                Our system will automatically extract all vaccine information.
              </p>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500">
              Accepted: JPG, PNG, JPEG, PDF
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleUploadDocument}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
            >
              <Upload className="w-5 h-5" />
              {isUploading ? 'Processing...' : 'Upload Vaccine Booklet'}
            </button>

            {uploadMessage && (
              <div className="text-sm mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {uploadMessage}
              </div>
            )}
          </div>
        ) : vaccineRecords.length === 0 && hasUploadedDocument ? (
          <div className="py-8 text-center text-slate-500 dark:text-slate-400">
            No vaccine records found. Records will appear here once added by your veterinarian.
          </div>
        ) : (
          /* Vaccine Timeline */
          <div className="space-y-6">
            {uploadMessage && uploadMessage.startsWith('✅') && (
              <div className="p-3 text-sm rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300">
                {uploadMessage}
              </div>
            )}

            {/* Stats summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{vaccineRecords.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Vaccines</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-center">
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {vaccineRecords.filter(r => !r.next_due_date || new Date(r.next_due_date) >= new Date()).length}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">Up to Date</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-center">
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                  {vaccineRecords.filter(r => {
                    if (!r.next_due_date) return false;
                    const diff = Math.ceil((new Date(r.next_due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return diff > 0 && diff <= 30;
                  }).length}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500">Due Soon</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-center">
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {vaccineRecords.filter(r => r.next_due_date && new Date(r.next_due_date) < new Date()).length}
                </p>
                <p className="text-xs text-red-600 dark:text-red-500">Overdue</p>
              </div>
            </div>

            {/* Timeline by year */}
            <div className="relative pl-8 border-l-2 border-green-300 dark:border-green-700 space-y-6">
              {vaccineTimeline.map(({ year, records }) => (
                <div key={year}>
                  {/* Year header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="absolute left-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 -translate-x-1/2" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{year}</h3>
                  </div>

                  {/* Records for this year */}
                  <div className="space-y-2 ml-2">
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
                                <p className="font-semibold text-slate-900 dark:text-white truncate">
                                  {record.vaccine_name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Given: {formatDateForDisplay(record.vaccination_date)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
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

            {/* If no upcoming vaccines, show friendly message */}
            {vaccineTimeline.length === 0 && (
              <p className="py-4 text-center text-slate-500 dark:text-slate-400">
                Vaccine records will appear here once added.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg overflow-hidden bg-white border shadow-xl dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Review Your Experience</h2>
                <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleReviewSubmit} className="p-6 space-y-5">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Clinic: <strong>{selectedAppointment.clinic}</strong></p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Doctor: <strong>{selectedAppointment.doctor}</strong></p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Service: <strong>{selectedAppointment.type}</strong></p>
                </div>
                <div>
                  <label className="block mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">How would you rate your experience? *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })} className="transition-transform hover:scale-110">
                        <Star className={`w-8 h-8 ${star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Treatment Quality *</label>
                  <input type="text" placeholder="e.g., Excellent care and treatment" value={reviewForm.treatment} onChange={(e) => setReviewForm({ ...reviewForm, treatment: e.target.value })} required maxLength={100} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Your Feedback</label>
                  <textarea placeholder="Share your experience..." value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} maxLength={500} rows={4} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowReviewModal(false)} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmittingReview} className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}