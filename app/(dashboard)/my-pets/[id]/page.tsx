'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Appointment {
  id: string;
  clinic: string;
  doctor: string;
  date: string;
  time: string;
  type: string;
  status: 'upcoming' | 'completed';
  address: string;
  notes?: string;
  reviewed?: boolean;
  review?: {
    rating: number;
    treatment: string;
    comment: string;
  };
}

const MOCK_PET_DETAILS = {
  '1': {
    name: 'Max',
    type: 'Dog',
    breed: 'Golden Retriever',
    age: '3 years',
    weight: '32 kg',
    bloodType: 'Dog Type A',
    dateOfBirth: 'April 15, 2021',
    imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&h=400&fit=crop',
    microchipId: 'ABC123456789',
  },
  '2': {
    name: 'Luna',
    type: 'Cat',
    breed: 'British Shorthair',
    age: '2 years',
    weight: '4.5 kg',
    bloodType: 'Cat Type B',
    dateOfBirth: 'June 20, 2022',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&h=400&fit=crop',
    microchipId: 'XYZ987654321',
  },
};

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

  const petDetails = MOCK_PET_DETAILS[petId as keyof typeof MOCK_PET_DETAILS];
  const appointments = MOCK_APPOINTMENTS[petId as keyof typeof MOCK_APPOINTMENTS] || [];
  const medicalHistory = MOCK_MEDICAL_HISTORY[petId as keyof typeof MOCK_MEDICAL_HISTORY] || [];

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    treatment: '',
    comment: '',
  });

  if (!petDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500 dark:text-slate-400">Pet not found</p>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter((a) => a.status === 'upcoming');
  const pastAppointments = appointments.filter((a) => a.status === 'completed');

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would save the review to your backend
    console.log('Review submitted:', reviewForm);
    setShowReviewModal(false);
    setReviewForm({ rating: 5, treatment: '', comment: '' });
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
          {/* Photo */}
          <div className="flex justify-center md:col-span-1">
            <div className="relative">
              <img
                src={petDetails.imageUrl}
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
                  Age
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {petDetails.age}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                  Weight
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {petDetails.weight}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                  Blood Type
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {petDetails.bloodType}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                  Date of Birth
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {petDetails.dateOfBirth}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                  Microchip ID
                </p>
                <p className="font-mono text-lg font-semibold text-slate-900 dark:text-white">
                  {petDetails.microchipId}
                </p>
              </div>
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
                    {appointment.type}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    <strong>{appointment.clinic}</strong> • Dr. {appointment.doctor.split(' ')[1]}
                  </p>
                  <p className="flex items-center gap-1 mt-2 text-sm text-slate-500 dark:text-slate-400">
                    <Calendar className="w-4 h-4" /> {appointment.date} at {appointment.time}
                  </p>
                  <p className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin className="w-4 h-4" /> {appointment.address}
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
                      <span className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-400">
                        Completed
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      <strong>{appointment.clinic}</strong> • {appointment.doctor}
                    </p>

                    <p className="flex items-center gap-1 mt-2 text-sm text-slate-500 dark:text-slate-400">
                      <Calendar className="w-4 h-4" /> {appointment.date} at {appointment.time}
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

                  {!appointment.reviewed && (
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
                      <Calendar className="w-3.5 h-3.5" /> {record.date}
                    </p>
                  </div>

                  <span className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-400">
                    {record.status}
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
                    className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Submit Review
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
