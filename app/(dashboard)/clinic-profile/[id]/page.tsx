/* @ts-nocheck */
'use client';
import { apiFetch } from '@/lib/api';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Mail,
  Star,
  Users,
  Calendar,
  X,
  Send,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface Pet {
  id: string;
  name: string;
  type: 'Dog' | 'Cat';
  breed: string;
  age: string;
  imageUrl: string;
}

type PetRecord = {
  id: string;
  name: string;
  type: string;
  breed: string;
  date_of_birth: string;
  profile_image_url?: string | null;
};

const FALLBACK_IMAGE_BY_TYPE: Record<'Dog' | 'Cat', string> = {
  Dog: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop',
  Cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface Clinic {
  id: string;
  clinicName: string;
  doctors: string[];
  specializations: string[];
  rating: number;
  reviews: 128 | 95 | 210;
  distance: string;
  imageUrl: string;
  operatingHours: string;
  address: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  services?: string[];
  facilities?: string[];
  photos?: string[];
  clinic_logo_url?: string | null;
  gallery_urls?: string[];
  clinicReviews?: Array<{
    id: string;
    reviewer: string;
    pet: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

interface ClinicExtras {
  clinicName?: string;
  services?: string[];
  facilities?: string[];
  doctors?: string[];
}

// Keep a tiny placeholder and reference it to avoid some toolchains complaining about a removed mock.
const MOCK_CLINICS: Record<string, Clinic> = {} as Record<string, Clinic>;
void Object.keys(MOCK_CLINICS);

const formatDoctorName = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) return '';
  if (/^Dr\.?\s+/i.test(trimmed)) {
    return trimmed;
  }
  return `Dr. ${trimmed}`;
};

function parseClinicDescription(description: string) {
  let leadVet = '';
  let team: string[] = [];
  let specialties: string[] = [];

  if (!description) return { leadVet, team, specialties };

  const lines = description.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('Lead veterinarian:')) {
      leadVet = trimmed.replace('Lead veterinarian:', '').trim();
    } else if (trimmed.startsWith('Team:')) {
      const teamStr = trimmed.replace('Team:', '').trim();
      if (teamStr) {
        team = teamStr.split(',').map(name => name.trim()).filter(Boolean);
      }
    } else if (trimmed.startsWith('Specialties:')) {
      const specStr = trimmed.replace('Specialties:', '').trim();
      if (specStr) {
        specialties = specStr.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
  }
  return { leadVet, team, specialties };
}

function getRawDescription(description: string): string {
  if (!description) return '';
  const lines = description.split('\n');
  const rawLines = lines.filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith('Specialties:') && 
           !trimmed.startsWith('Lead veterinarian:') && 
           !trimmed.startsWith('Team:');
  });
  return rawLines.join('\n').trim();
}

export default function ClinicProfile() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const clinicId = params.id as string;

  const [clinic, setClinic] = useState<Partial<Clinic> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [availablePets, setAvailablePets] = useState<Pet[]>([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [petsError, setPetsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clinicReviews, setClinicReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState({ count: 0, averageRating: 0 });
  const [channelForm, setChannelForm] = useState({
    date: '',
    time: '',
    serviceType: '',
    notes: '',
  });

  const getCurrentUserId = () => {
    const userId = user?.id || localStorage.getItem('user_id') || '';
    return UUID_PATTERN.test(userId) ? userId : '';
  };

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

  const mapPetRecord = (pet: PetRecord): Pet => {
    const normalizedType: 'Dog' | 'Cat' = pet.type?.toLowerCase() === 'cat' ? 'Cat' : 'Dog';
    return {
      id: pet.id,
      name: pet.name,
      type: normalizedType,
      breed: pet.breed,
      age: calculateAge(pet.date_of_birth),
      imageUrl: pet.profile_image_url || FALLBACK_IMAGE_BY_TYPE[normalizedType],
    };
  };

  const normalizeClinic = (clinicData: Record<string, unknown>): Partial<Clinic> => ({
    ...clinicData,
    clinicName: (clinicData.clinicName as string) || (clinicData.clinic_name as string) || '',
    operatingHours:
      (clinicData.operatingHours as string) || (clinicData.opening_hours as string) || '',
    imageUrl: (clinicData.imageUrl as string) || (clinicData.clinic_logo_url as string) || '',
    address: (clinicData.address as string) || '',
    phone: (clinicData.phone as string) || '',
    email: (clinicData.email as string) || '',
    website: (clinicData.website as string) || '',
    description: (clinicData.description as string) || '',
    services: (clinicData.services as string[]) || [],
    facilities: (clinicData.facilities as string[]) || [],
    doctors: (clinicData.doctors as string[]) || [],
    specializations: (clinicData.specializations as string[]) || [],
    gallery_urls: (clinicData.gallery_urls as string[]) || [],
  });

  const loadClinicExtras = (): ClinicExtras => {
    try {
      const stored = localStorage.getItem('clinicProfileExtras');
      if (!stored) return {};

      const parsed = JSON.parse(stored);
      return {
        clinicName: typeof parsed.clinicName === 'string' ? parsed.clinicName : undefined,
        services: Array.isArray(parsed.services) ? parsed.services : [],
        facilities: Array.isArray(parsed.facilities) ? parsed.facilities : [],
        doctors: Array.isArray(parsed.doctors) ? parsed.doctors : [],
      };
    } catch {
      return {};
    }
  };

  useEffect(() => {
    const fetchPets = async () => {
      const userId = getCurrentUserId();
      if (!userId) {
        setPetsError('Please log in again to load your pets.');
        setAvailablePets([]);
        return;
      }

      try {
        setPetsLoading(true);
        setPetsError(null);
        const response = await apiFetch(`/api/pets?user_id=${encodeURIComponent(userId)}`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch pets (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const records: PetRecord[] = data.pets || [];
        setAvailablePets(records.map(mapPetRecord));
      } catch (error) {
        console.error('Error fetching pets:', error);
        setPetsError(error instanceof Error ? error.message : 'Failed to load pets');
        setAvailablePets([]);
      } finally {
        setPetsLoading(false);
      }
    };

    fetchPets();
  }, [user?.id]);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/clinics/${encodeURIComponent(clinicId)}`);
        if (!res.ok) {
          // show not found state
          setClinic(null);
          return;
        }
        const data = await res.json();
        const fetchedClinic = normalizeClinic(data.clinic || {});
        const extras = loadClinicExtras();
        const clinicName = (fetchedClinic.clinicName as string) || extras.clinicName || '';
        
        const { leadVet, team, specialties } = parseClinicDescription(fetchedClinic.description || '');
        const parsedDoctors = [leadVet, ...team].map(formatDoctorName).filter(Boolean);
        
        const finalDoctors = fetchedClinic.doctors && fetchedClinic.doctors.length 
          ? fetchedClinic.doctors 
          : (parsedDoctors.length ? parsedDoctors : (extras.doctors || []));
          
        const finalServices = fetchedClinic.services && fetchedClinic.services.length 
          ? fetchedClinic.services 
          : (specialties.length ? specialties : (extras.services || []));
          
        const finalSpecializations = fetchedClinic.specializations && fetchedClinic.specializations.length 
          ? fetchedClinic.specializations 
          : (specialties.length ? specialties : []);

        const rawDescription = getRawDescription(fetchedClinic.description || '');

        setClinic({
          ...(fetchedClinic as Partial<Clinic>),
          clinicName,
          description: rawDescription,
          services: finalServices,
          facilities: fetchedClinic.facilities && fetchedClinic.facilities.length ? fetchedClinic.facilities : extras.facilities,
          doctors: finalDoctors,
          specializations: finalSpecializations,
        } as Partial<Clinic>);

        try {
          const reviewsRes = await apiFetch(`/api/reviews/clinic?clinic_id=${encodeURIComponent(clinicId)}`);
          if (reviewsRes.ok) {
            const reviewsJson = await reviewsRes.json();
            const reviews = reviewsJson.reviews || [];
            setClinicReviews(reviews);
            setReviewStats({ count: reviewsJson.count || reviews.length, averageRating: reviewsJson.average_rating || 0 });
          } else {
            setClinicReviews([]);
            setReviewStats({ count: 0, averageRating: 0 });
          }
        } catch (reviewError) {
          console.warn('Failed to load clinic reviews', reviewError);
          setClinicReviews([]);
          setReviewStats({ count: 0, averageRating: 0 });
        }
      } catch (e) {
        console.warn('Failed to load clinic', e);
        setClinic(null);
      } finally {
        setLoading(false);
      }
    };
    if (clinicId) load();
  }, [clinicId]);

  if (loading) {
    return <div className="py-16 text-center text-slate-500 dark:text-slate-400">Loading clinic...</div>;
  }

  if (!clinic) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500 dark:text-slate-400">Clinic not found</p>
      </div>
    );
  }

  const handleChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = getCurrentUserId();

    if (!userId || !selectedPet || !clinic?.id) {
      alert('Please log in again and select a pet before booking.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pet_id: selectedPet.id,
          clinic_id: clinic.id,
          owner_id: userId,
          appointment_date: channelForm.date,
          appointment_time: channelForm.time,
          reason: channelForm.serviceType,
          notes: channelForm.notes || null,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.detail || data.error || 'Failed to book appointment');
      }

      const clinicDisplayName = clinic.clinicName || 'the clinic';
      alert(`Successfully booked appointment for ${selectedPet.name} at ${clinicDisplayName}!`);
      setShowChannelModal(false);
      setSelectedPet(null);
      setChannelForm({ date: '', time: '', serviceType: '', notes: '' });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to book appointment');
    } finally {
      setIsSubmitting(false);
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
          {clinic?.clinicName || ''}
        </h1>
      </div>

      {/* Photo Gallery */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <img
            src={
              clinic?.clinic_logo_url || (clinic?.gallery_urls && clinic.gallery_urls[0]) || '/images/clinic-placeholder.png'
            }
            alt={clinic?.clinicName || 'Clinic'}
            className="object-cover w-full shadow-md h-80 rounded-2xl"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 md:col-span-1 md:grid-cols-1">
          {(clinic.gallery_urls || []).slice(1).map((photo, idx) => (
            <img
              key={idx}
              src={photo}
              alt={`Gallery ${idx + 1}`}
              className="w-full h-[11.5rem] object-cover rounded-xl shadow-sm"
            />
          ))}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Rating */}
        <div className="p-4 bg-white border shadow-sm dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Rating</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {reviewStats.averageRating || clinic.rating || '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {reviewStats.count} reviews
          </p>
        </div>

        {/* Distance */}
        <div className="p-4 bg-white border shadow-sm dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Distance
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {clinic.distance}
          </p>
        </div>

        {/* Hours */}
        <div className="p-4 bg-white border shadow-sm dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Hours</span>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {clinic.operatingHours}
          </p>
        </div>

        {/* Channel Button */}
        <button
          onClick={() => setShowChannelModal(true)}
          className="flex flex-col items-center justify-center gap-2 p-4 font-bold text-white transition-colors shadow-sm bg-primary-600 hover:bg-primary-700 rounded-xl shadow-primary-600/20"
        >
          <Calendar className="w-5 h-5" />
          Channel Now
        </button>
      </div>

      {/* Description */}
      <div className="p-6 bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800">
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">About</h2>
        <p className="leading-relaxed text-slate-600 dark:text-slate-300">{clinic.description}</p>

        <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Phone className="w-4 h-4" />
                <span>{clinic.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Mail className="w-4 h-4" />
                <span>{clinic.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <MapPin className="w-4 h-4" />
                <span>{clinic.address}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Facilities</h3>
            <div className="flex flex-wrap gap-2">
              {(clinic.facilities || []).map((facility) => (
                <span
                  key={facility}
                  className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-400"
                >
                  {facility}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Services & Team */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Services */}
        <div className="p-6 bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800">
          <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
            Services
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {(clinic.services || []).map((service) => (
              <div
                key={service}
                className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              >
                <p className="text-sm font-medium text-slate-900 dark:text-white">{service}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="p-6 bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800">
          <h2 className="flex items-center gap-2 mb-4 text-xl font-bold text-slate-900 dark:text-white">
            <Users className="w-5 h-5" />
            Our Team
          </h2>
          <div className="space-y-3">
            {(clinic.doctors || []).map((doctor) => (
              <div
                key={doctor}
                className="p-3 border rounded-lg bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 border-primary-200 dark:border-primary-800"
              >
                <p className="font-semibold text-slate-900 dark:text-white">{doctor}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Specialist in: {(clinic.specializations || []).length ? (clinic.specializations || []).join(', ') : 'General veterinary care'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clinic Reviews */}
      <div className="p-6 bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800">
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
          Client Reviews
        </h2>
        <div className="space-y-4">
          {clinicReviews.length > 0 ? clinicReviews.map((review) => (
            <div
              key={review.id}
              className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{review.reviewer}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pet: <strong>{review.pet}</strong>
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Treatment: <span className="font-normal text-slate-600 dark:text-slate-400">{review.treatment || 'General care'}</span>
              </p>
              {review.comment && (
                <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">"{review.comment}"</p>
              )}
              <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">{review.date}</p>
            </div>
          )) : (
            <p className="py-6 text-sm text-center text-slate-500 dark:text-slate-400">No client reviews yet.</p>
          )}
        </div>
      </div>

      {/* Channel Modal */}
      <AnimatePresence>
        {showChannelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg overflow-hidden bg-white border shadow-xl dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Channel {clinic?.clinicName || ''}
                </h2>
                <button
                  onClick={() => setShowChannelModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleChannelSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                {/* Select Pet */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Select Your Pet *
                  </label>
                  {selectedPet ? (
                    <div className="flex items-center gap-3 p-4 border rounded-lg bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
                      <img
                        src={selectedPet.imageUrl}
                        alt={selectedPet.name}
                        className="object-cover w-12 h-12 rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {selectedPet.name}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {selectedPet.breed} • {selectedPet.age}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPet(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {petsLoading && (
                        <div className="col-span-2 py-6 text-center text-slate-500 dark:text-slate-400">
                          Loading your pets...
                        </div>
                      )}

                      {petsError && !petsLoading && (
                        <div className="col-span-2 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                          {petsError}
                        </div>
                      )}

                      {!petsLoading && !petsError && availablePets.length === 0 && (
                        <div className="col-span-2 p-3 text-sm border border-dashed rounded-lg border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                          No pets found. Add a pet first to book a channel.
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        {availablePets.map((pet) => (
                        <button
                          key={pet.id}
                          type="button"
                          onClick={() => setSelectedPet(pet)}
                          className="p-3 text-left transition-colors border-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                        >
                          <img
                            src={pet.imageUrl}
                            alt={pet.name}
                            className="object-cover w-full h-20 mb-2 rounded"
                          />
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {pet.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {pet.breed}
                          </p>
                        </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {selectedPet && (
                  <>
                    {/* Service Type */}
                    <div>
                      <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Service Type *
                      </label>
                      <select
                        value={channelForm.serviceType}
                        onChange={(e) =>
                          setChannelForm({ ...channelForm, serviceType: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                      >
                        <option value="">Select a service</option>
                        {(clinic.services || []).map((service) => (
                          <option key={service} value={service}>
                            {service}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Preferred Date *
                      </label>
                      <input
                        type="date"
                        value={channelForm.date}
                        onChange={(e) => setChannelForm({ ...channelForm, date: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                      />
                    </div>

                    {/* Time */}
                    <div>
                      <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Preferred Time *
                      </label>
                      <input
                        type="time"
                        value={channelForm.time}
                        onChange={(e) => setChannelForm({ ...channelForm, time: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Additional Notes
                      </label>
                      <textarea
                        value={channelForm.notes}
                        onChange={(e) =>
                          setChannelForm({ ...channelForm, notes: e.target.value })
                        }
                        placeholder="Any symptoms or concerns to mention..."
                        maxLength={300}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white resize-none"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {channelForm.notes.length}/300
                      </p>
                    </div>

                    {/* Alert */}
                    <div className="flex gap-3 p-3 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-900 dark:text-blue-200">
                        A confirmation will be sent to your email after submission.
                      </p>
                    </div>
                  </>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowChannelModal(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting || !selectedPet || !channelForm.date || !channelForm.time || !channelForm.serviceType
                    }
                    className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                      <Send className="w-4 h-4" /> {isSubmitting ? 'Booking...' : 'Book Appointment'}
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