'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle,
  X,
  Send,
  Activity,
  Pill,
  Syringe,
  Bot,
  Edit,
  Upload,
  ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DOG_BREEDS = [
  'Sinhala Hound(Street Dog)',
  'Labrador Retriever',
  'German Shepherd',
  'Golden Retriever',
  'Rottweiler',
  'Beagle',
  'Shih Tzu',
  'Pomeranian',
  'Dachshund',
  'Other Mixed Breed',
  'Other Pure Breed',
  'Unknown'
];

const CAT_BREEDS = [
  'Domestic Shorthair (Mixed Breed)',
  'Persian',
  'Siamese',
  'British Shorthair',
  'Bengal',
  'Maine Coon',
  'Ceylon Cat',
  'Other Pure Breed',
  'Unknown'
];

const DOG_BLOOD_TYPES = [
  'DEA 1 Positive',
  'DEA 1 Negative',
  'Unknown'
];

const CAT_BLOOD_TYPES = [
  'Type A',
  'Type B',
  'Type AB',
  'Unknown'
];

interface Appointment {
  id: string;
  clinic: string;
  doctor: string;
  date: string;
  time: string;
  type: string;
  // status may come from backend (scheduled/completed/cancelled/in_progress) or be derived
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
  gender?: string | null;
  allergies?: string | null;
  medical_conditions?: string | null;
  notes?: string | null;
}

const MOCK_APPOINTMENTS: Record<string, Appointment[]> = {
  '1': [
    // Upcoming
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
    // Past
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

const MOCK_MEDICAL_HISTORY = {
  '1': [
    {
      id: '1',
      date: 'March 5, 2024',
      type: 'Dental Cleaning',
      clinic: 'Paws & Claws Veterinary Clinic',
      status: 'Completed',
    },
    {
      id: '2',
      date: 'January 20, 2024',
      type: 'Vaccine - Rabies Booster',
      clinic: 'City Center Animal Hospital',
      status: 'Completed',
    },
    {
      id: '3',
      date: 'December 10, 2023',
      type: 'Annual Physical Exam',
      clinic: 'Happy Tails Vet Care',
      status: 'Completed',
    },
  ],
  '2': [
    {
      id: '4',
      date: 'April 1, 2024',
      type: 'Vaccine Update',
      clinic: 'Happy Tails Vet Care',
      status: 'Completed',
    },
    {
      id: '5',
      date: 'February 14, 2024',
      type: 'Microchip Implant',
      clinic: 'City Center Animal Hospital',
      status: 'Completed',
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

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [editPhoto, setEditPhoto] = useState<string>('');
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

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
    
    const diffTime = today.getTime() - birthDate.getTime();
    if (diffTime < 0) return 'Just born';

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      if (diffDays < 7) {
        return diffDays === 1 ? '1 day' : `${diffDays} days`;
      }
      const weeks = Math.floor(diffDays / 7);
      const remainingDays = diffDays % 7;
      return remainingDays > 0 
        ? `${weeks} week${weeks > 1 ? 's' : ''}, ${remainingDays} day${remainingDays > 1 ? 's' : ''}`
        : `${weeks} week${weeks > 1 ? 's' : ''}`;
    }

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years >= 1) {
      if (months > 0) {
        return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
      }
      return `${years} year${years > 1 ? 's' : ''}`;
    }

    return `${months} month${months > 1 ? 's' : ''}`;
  };

  const handleOpenEdit = () => {
    if (!petDetails) return;
    setEditForm({
      name: petDetails.name,
      type: petDetails.type || 'Dog',
      breed: petDetails.breed || 'Unknown',
      gender: petDetails.gender || 'Male',
      dateOfBirth: petDetails.date_of_birth ? petDetails.date_of_birth.split('T')[0] : '',
      weight: petDetails.weight || '',
      weightUnit: petDetails.weight_unit || 'kg',
      bloodType: petDetails.blood_type || 'Unknown',
      allergies: petDetails.allergies || '',
      medicalConditions: petDetails.medical_conditions || '',
      notes: petDetails.notes || '',
    });
    setEditPhoto(petDetails.profile_image_url || '');
    setEditPhotoFile(null);
    setIsEditModalOpen(true);
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'type') {
      setEditForm((prev: any) => ({
        ...prev,
        type: value,
        breed: 'Unknown',
        bloodType: 'Unknown',
      }));
    } else {
      setEditForm((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm || !petDetails) return;

    try {
      setIsEditSubmitting(true);
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('pet_type', editForm.type);
      formData.append('breed', editForm.breed);
      formData.append('date_of_birth', editForm.dateOfBirth);
      formData.append('weight', editForm.weight);
      formData.append('weight_unit', editForm.weightUnit);
      formData.append('gender', editForm.gender);
      formData.append('blood_type', editForm.bloodType);
      formData.append('allergies', editForm.allergies);
      formData.append('medical_conditions', editForm.medicalConditions);
      formData.append('notes', editForm.notes);

      if (editPhotoFile) {
        formData.append('photo', editPhotoFile);
      }

      const response = await fetch(`http://localhost:8000/api/pets/${petDetails.id}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.detail || data.error || 'Failed to update pet');
      }

      setPetDetails(data.pet);
      setIsEditModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update pet');
    } finally {
      setIsEditSubmitting(false);
    }
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

  const [medicalHistory, setMedicalHistory] = useState<any[]>(
    MOCK_MEDICAL_HISTORY[petId as keyof typeof MOCK_MEDICAL_HISTORY] || []
  );

  const formatDateShort = (d?: string) => {
    if (!d) return '';
    const parsed = new Date(d);
    if (Number.isNaN(parsed.getTime())) return d;
    return parsed.toLocaleDateString();
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

  useEffect(() => {
    // After pet details load, fetch real appointments and medical records from backend
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
          // ignore clinic lookup failures and fall back to ids
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
          // ignore and keep fallback mocks
        }

        // Fetch medical records (broad medical or vaccine records)
        try {
          const medRes = await fetch(
            `http://localhost:8000/api/pet/medical-records?pet_id=${encodeURIComponent(petId)}`
          );
          if (medRes.ok) {
            const mj = await medRes.json();
            // API returns { success, records }
            const recs = mj.records || mj.records || mj.data || [];
            if (recs && recs.length) setMedicalHistory(recs);
          } else {
            // fallback to vaccine records endpoint
            const vacRes = await fetch(
              `http://localhost:8000/api/vaccine-records?pet_id=${encodeURIComponent(petId)}`
            );
            if (vacRes.ok) {
              const vj = await vacRes.json();
              const recs = vj.records || vj.records || vj.data || [];
              if (recs && recs.length) setMedicalHistory(recs);
            }
          }
        } catch (e) {
          // ignore and keep fallback
        }
      } catch (e) {
        // overall ignore
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
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
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
        <button
          onClick={handleOpenEdit}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
        >
          <Edit className="w-4 h-4" />
          Edit Profile
        </button>
      </div>

      {/* Pet Details Card */}
      <div className="overflow-hidden bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
          {/* Photo */}
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

          {/* Details */}
          <div className="space-y-4 md:col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                  Breed
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {petDetails.breed}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                  Gender
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {petDetails.gender || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                  Date of Birth
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {formatDateOfBirth(petDetails.date_of_birth)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                  Age
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {calculateAge(petDetails.date_of_birth)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                  Weight
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {petDetails.weight ? `${petDetails.weight}${petDetails.weight_unit ? ` ${petDetails.weight_unit}` : ''}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                  Blood Type
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {petDetails.blood_type || '—'}
                </p>
              </div>
              {petDetails.microchip_id && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                    Microchip ID
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {petDetails.microchip_id}
                  </p>
                </div>
              )}
              {petDetails.allergies && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                    Known Allergies
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {petDetails.allergies}
                  </p>
                </div>
              )}
              {petDetails.medical_conditions && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                    Medical Conditions
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {petDetails.medical_conditions}
                  </p>
                </div>
              )}
              {petDetails.notes && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                    Notes
                  </p>
                  <p className="text-base text-slate-700 dark:text-slate-300 italic whitespace-pre-wrap">
                    "{petDetails.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* AI Assistant Button */}
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
                  <p className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin className="w-4 h-4" /> {appointment.address || appointment.location || ''}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-slate-500 dark:text-slate-400">
            No upcoming appointments scheduled
          </p>
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
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {appointment.type}
                      </h3>
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
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < (appointment.review?.rating || 0)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300 dark:text-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            Your Review
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Treatment: {appointment.review?.treatment}
                        </p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          {appointment.review?.comment}
                        </p>
                      </div>
                    )}
                  </div>

                  {canReviewAppointment(appointment) && (
                    <button
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowReviewModal(true);
                      }}
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
          <p className="py-8 text-center text-slate-500 dark:text-slate-400">
            No past appointments yet
          </p>
        )}
      </div>

      {/* Medical History */}
      <div className="p-6 bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800">
        <h2 className="flex items-center gap-2 mb-4 text-2xl font-bold text-slate-900 dark:text-white">
          <Activity className="w-6 h-6 text-primary-600" />
          Medical History
        </h2>

        {medicalHistory.length > 0 ? (
          <div className="space-y-2">
            {medicalHistory.map((record, idx) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 transition-colors border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {record.type.includes('Vaccine') ? (
                      <Syringe className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    ) : record.type.includes('Cleaning') ? (
                      <Pill className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    ) : (
                      <Activity className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {record.type}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {record.clinic}
                    </p>
                    <p className="flex items-center gap-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5" /> {formatDateShort(record.date || record.recorded_at || record.created_at || record.date_performed)}
                    </p>
                  </div>

                  <span className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-400">
                    {record.status || (record.completed ? 'Completed' : 'Recorded')}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-slate-500 dark:text-slate-400">
            No medical history records
          </p>
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
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Review Your Experience
                </h2>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleReviewSubmit} className="p-6 space-y-5">
                {/* Clinic Info */}
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Clinic: <strong>{selectedAppointment.clinic}</strong>
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Doctor: <strong>{selectedAppointment.doctor}</strong>
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Service: <strong>{selectedAppointment.type}</strong>
                  </p>
                </div>

                {/* Rating */}
                <div>
                  <label className="block mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                    How would you rate your experience? *
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setReviewForm({ ...reviewForm, rating: star })
                        }
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= reviewForm.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Treatment Quality */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Treatment Quality *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Excellent care and treatment"
                    value={reviewForm.treatment}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, treatment: e.target.value })
                    }
                    required
                    maxLength={100}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {reviewForm.treatment.length}/100
                  </p>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Feedback
                  </label>
                  <textarea
                    placeholder="Share your experience with the clinic, doctor, and treatment..."
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, comment: e.target.value })
                    }
                    maxLength={500}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white resize-none"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {reviewForm.comment.length}/500
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* Edit Pet Modal */}
        {isEditModalOpen && editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg overflow-hidden bg-white border shadow-xl dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Edit Pet Profile
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[80vh]">
                <form onSubmit={handleEditSubmit} className="space-y-6">
                  {/* Photo Upload */}
                  <div className="flex justify-center">
                    <label className="relative flex flex-col items-center justify-center w-40 h-40 overflow-hidden transition-colors border-2 border-dashed rounded-full cursor-pointer border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditPhotoChange}
                        className="hidden"
                      />
                      {editPhoto ? (
                        <>
                          <img src={editPhoto} alt="Pet" className="object-cover w-full h-full" />
                          <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-slate-900/60 group-hover:opacity-100">
                            <ImageIcon className="w-6 h-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-2" />
                          <span className="px-2 text-xs font-medium text-center">Upload Pet Photo</span>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Basic Info */}
                  <div className="p-4 space-y-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Basic Information</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Pet Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={editForm.name}
                          onChange={handleEditInputChange}
                          required
                          placeholder="e.g., Max, Luna"
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Type *
                        </label>
                        <select
                          name="type"
                          value={editForm.type}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                        >
                          <option>Dog</option>
                          <option>Cat</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Gender *
                        </label>
                        <select
                          name="gender"
                          value={editForm.gender}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                        >
                          <option>Male</option>
                          <option>Female</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Breed *
                        </label>
                        <select
                          name="breed"
                          value={editForm.breed}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                        >
                          {(editForm.type.toLowerCase() === 'cat' ? CAT_BREEDS : DOG_BREEDS).map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Date of Birth *
                        </label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={editForm.dateOfBirth}
                          onChange={handleEditInputChange}
                          required
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                        />
                        {editForm.dateOfBirth && (
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Age: {calculateAge(editForm.dateOfBirth)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Health Info */}
                  <div className="p-4 space-y-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Health Information</h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Weight *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.1"
                            name="weight"
                            value={editForm.weight}
                            onChange={handleEditInputChange}
                            required
                            placeholder="e.g., 25"
                            className="flex-1 min-w-0 px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                          />
                          <select
                            name="weightUnit"
                            value={editForm.weightUnit}
                            onChange={handleEditInputChange}
                            className="w-20 px-2 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white text-sm"
                          >
                            <option>kg</option>
                            <option>lbs</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Blood Type
                        </label>
                        <select
                          name="bloodType"
                          value={editForm.bloodType}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                        >
                          {(editForm.type.toLowerCase() === 'cat' ? CAT_BLOOD_TYPES : DOG_BLOOD_TYPES).map((bt) => (
                            <option key={bt} value={bt}>{bt}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Known Allergies
                        </label>
                        <textarea
                          name="allergies"
                          value={editForm.allergies}
                          onChange={handleEditInputChange}
                          placeholder="e.g., Chicken, Dairy"
                          rows={2}
                          maxLength={200}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white resize-none text-sm"
                        />
                        <p className="mt-1 text-right text-xs text-slate-500 dark:text-slate-400">
                          {editForm.allergies.length}/200
                        </p>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Medical Conditions / Special Needs
                        </label>
                        <textarea
                          name="medicalConditions"
                          value={editForm.medicalConditions}
                          onChange={handleEditInputChange}
                          placeholder="e.g., Diabetes, Heart condition"
                          rows={2}
                          maxLength={300}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white resize-none text-sm"
                        />
                        <p className="mt-1 text-right text-xs text-slate-500 dark:text-slate-400">
                          {editForm.medicalConditions.length}/300
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Additional Notes
                    </label>
                    <textarea
                      name="notes"
                      value={editForm.notes}
                      onChange={handleEditInputChange}
                      placeholder="Any other important information about your pet..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white resize-none"
                    />
                    <p className="mt-1 text-right text-xs text-slate-500 dark:text-slate-400">
                      {editForm.notes.length}/500
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isEditSubmitting}
                      className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isEditSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
