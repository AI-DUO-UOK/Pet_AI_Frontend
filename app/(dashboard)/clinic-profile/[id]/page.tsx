/* @ts-nocheck */
'use client';
import { apiFetch } from '@/lib/api';
import {
  VETERINARY_SERVICES,
  getServicePrice,
  PLATFORM_FEE,
  TAX,
  calculateTotal,
  formatLKR,
} from '@/lib/veterinary-services';
import { createCheckoutSession } from '@/lib/payment';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Clock,
  Phone,
  Mail,
  Star,
  Users,
  Calendar,
  X,
  AlertCircle,
  ShieldCheck,
  CreditCard,
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

const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

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
  const [calculatedDistance, setCalculatedDistance] = useState<string>('');
  const [channelForm, setChannelForm] = useState({
    date: '',
    time: '',
    serviceType: '',
    notes: '',
  });
  // consultationFee is auto-derived from VETERINARY_SERVICES when serviceType changes
  const [consultationFee, setConsultationFee] = useState<number>(0);
  const [bookingStep, setBookingStep] = useState<'form' | 'summary' | 'payment' | 'loading'>('form');
  const [selectedPayment, setSelectedPayment] = useState<'stripe' | 'gpay' | 'applepay'>('stripe');

  const getCurrentUserId = () => {
    const userId = user?.id || localStorage.getItem('user_id') || '';
    return UUID_PATTERN.test(userId) ? userId : '';
  };

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getOperatingHoursRange = (hoursStr: string) => {
    const defaultRange = { min: '08:00', max: '18:00' };
    if (!hoursStr) return defaultRange;

    try {
      const parts = hoursStr.split('-').map(p => p.trim());
      if (parts.length !== 2) return defaultRange;

      const convertTo24h = (timeStr: string) => {
        // Handle formats like "09:00 AM", "9:00 AM", "18:00", etc.
        const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)?$/i);
        if (!match) return null;
        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        const ampm = match[3];

        if (ampm) {
          if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
          if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
        }
        return `${String(hours).padStart(2, '0')}:${minutes}`;
      };

      const min = convertTo24h(parts[0]) || defaultRange.min;
      const max = convertTo24h(parts[1]) || defaultRange.max;
      return { min, max };
    } catch (e) {
      return defaultRange;
    }
  };

  const timeRange = getOperatingHoursRange(clinic?.operatingHours || '');

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

  useEffect(() => {
    const computeDistance = async () => {
      // 1. Try URL search params first
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const dist = params.get('distance');
        if (dist) {
          setCalculatedDistance(`${parseFloat(dist).toFixed(1)} km`);
          return;
        }
      }

      // 2. Otherwise calculate on the fly
      if (!clinic?.latitude || !clinic?.longitude) return;

      let userLat = null;
      let userLng = null;

      try {
        const res = await apiFetch(`/api/auth/profile`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.profile) {
            const profile = data.profile;
            if (profile.latitude && profile.longitude) {
              userLat = Number(profile.latitude);
              userLng = Number(profile.longitude);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch user coordinates:', err);
      }

      // Fallback: Geolocation
      if (userLat === null && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          userLat = pos.coords.latitude;
          userLng = pos.coords.longitude;
        } catch (e) {
          userLat = 6.9271; // Colombo default
          userLng = 79.8612;
        }
      }

      if (userLat !== null && userLng !== null) {
        const dist = calculateHaversineDistance(
          userLat,
          userLng,
          Number(clinic.latitude),
          Number(clinic.longitude)
        );
        setCalculatedDistance(`${dist.toFixed(1)} km`);
      }
    };

    if (clinic) {
      computeDistance();
    }
  }, [clinic]);

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userId = getCurrentUserId();

    if (!userId || !selectedPet || !clinic?.id) {
      alert('Please log in again and select a pet before booking.');
      return;
    }

    // Advance to Appointment Summary step
    setBookingStep('summary');
  };

  /** Helper: update service type AND auto-calculate the consultation fee */
  const handleServiceChange = (serviceName: string) => {
    const price = getServicePrice(serviceName);
    setChannelForm((prev) => ({ ...prev, serviceType: serviceName }));
    setConsultationFee(price);
  };

  /**
   * handlePaymentSubmit — Called when user clicks "Pay Securely" on the payment step.
   *
   * Calls createCheckoutSession() which POSTs to:
   *   POST /api/payments/create-checkout-session
   *
   * The backend returns { checkout_url } and createCheckoutSession() does:
   *   window.location.href = checkout_url  → browser navigates to Stripe Hosted Checkout
   *
   * After payment, Stripe redirects to /payment/success?session_id=xxx
   * Stripe webhook then fires → backend creates appointment + marks payment paid.
   */
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setBookingStep('loading');

    try {
      const userId = getCurrentUserId();
      const total = calculateTotal(consultationFee);

      // createCheckoutSession POSTs to /api/payments/create-checkout-session
      // and internally calls window.location.href = checkout_url.
      // The browser navigates away — code after this await is NOT reached on success.
      await createCheckoutSession({
        clinic_id: clinic?.id || '',
        clinic_name: clinic?.clinicName || '',
        pet_id: selectedPet?.id || '',
        pet_name: selectedPet?.name || '',
        owner_id: userId,
        service_name: channelForm.serviceType,
        consultation_fee: consultationFee,
        platform_fee: PLATFORM_FEE,
        tax: TAX,
        total_amount: total,
        appointment_date: channelForm.date,
        appointment_time: channelForm.time,
        notes: channelForm.notes || undefined,
        doctor_name: clinic?.doctors?.[0] || 'Available Doctor',
      });
    } catch (error) {
      // createCheckoutSession threw — backend returned an error or network failed.
      console.error('Checkout session error:', error);
      setBookingStep('form');
      router.push('/payment/cancel');
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
            {calculatedDistance || '—'}
          </p>
        </div>

        {/* Hours */}
        <div className="p-4 bg-white border shadow-sm dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Opening Hours</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {clinic.operatingHours || '—'}
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
              {/* Header */}
              {bookingStep !== 'loading' && (
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {bookingStep === 'form'
                      ? `Book at ${clinic?.clinicName || ''}`
                      : bookingStep === 'summary'
                      ? 'Appointment Summary'
                      : 'Payment'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowChannelModal(false);
                      setBookingStep('form');
                      setConsultationFee(0);
                      setChannelForm({ date: '', time: '', serviceType: '', notes: '' });
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Step 1: Booking Form */}
              {bookingStep === 'form' && (
                <form onSubmit={handleFormSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
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
                          <div className="col-span-2 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300">
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
                      {/* Service Type — driven by VETERINARY_SERVICES constant */}
                      <div>
                        <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                          Service Type *
                        </label>
                        <select
                          value={channelForm.serviceType}
                          onChange={(e) => handleServiceChange(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                        >
                          <option value="">Select a service</option>
                          {VETERINARY_SERVICES.map((svc) => (
                            <option key={svc.name} value={svc.name}>
                              {svc.name} — {formatLKR(svc.price)}
                            </option>
                          ))}
                        </select>
                        {/* Show auto-calculated fee inline */}
                        {consultationFee > 0 && (
                          <p className="mt-1.5 text-xs text-primary-600 dark:text-primary-400 font-medium">
                            Consultation fee: {formatLKR(consultationFee)}
                          </p>
                        )}
                      </div>

                      {/* Date */}
                      <div>
                        <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                          Preferred Date *
                        </label>
                        <input
                          type="date"
                          value={channelForm.date}
                          min={getTodayDateString()}
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
                          min={timeRange.min}
                          max={timeRange.max}
                          onChange={(e) => setChannelForm({ ...channelForm, time: e.target.value })}
                          required
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Clinic hours: {clinic?.operatingHours || '08:00 AM - 06:00 PM'}
                        </p>
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
                      className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={
                        isSubmitting || !selectedPet || !channelForm.date || !channelForm.time || !channelForm.serviceType
                      }
                      className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* ── STEP 2: Appointment Summary ── */}
              {bookingStep === 'summary' && selectedPet && (() => {
                const total = calculateTotal(consultationFee);
                // Format appointment date for display
                const displayDate = channelForm.date
                  ? new Date(channelForm.date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })
                  : channelForm.date;
                // Format time to 12h
                const displayTime = channelForm.time
                  ? new Date(`1970-01-01T${channelForm.time}`).toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit', hour12: true,
                    })
                  : channelForm.time;

                return (
                  <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
                    {/* Section title */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold">
                      Appointment Summary
                    </p>

                    {/* Booking details */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      {[
                        { label: 'Clinic', value: clinic?.clinicName || '—' },
                        { label: 'Doctor', value: clinic?.doctors?.[0] || 'Available Doctor' },
                        { label: 'Pet', value: selectedPet.name },
                        { label: 'Service', value: channelForm.serviceType },
                        { label: 'Date', value: displayDate },
                        { label: 'Time', value: displayTime },
                      ].map(({ label, value }, i, arr) => (
                        <div
                          key={label}
                          className={`flex justify-between items-center px-4 py-2.5 text-sm ${
                            i % 2 === 0
                              ? 'bg-slate-50 dark:bg-slate-800/40'
                              : 'bg-white dark:bg-slate-900'
                          } ${
                            i < arr.length - 1
                              ? 'border-b border-slate-100 dark:border-slate-700/50'
                              : ''
                          }`}
                        >
                          <span className="text-slate-500 dark:text-slate-400">{label}</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-[55%]">{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Fee breakdown */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-700/50 flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Consultation Fee</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{formatLKR(consultationFee)}</span>
                      </div>
                      <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/50 flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Platform Fee</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{formatLKR(PLATFORM_FEE)}</span>
                      </div>
                      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-700/50 flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Tax</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{formatLKR(TAX)}</span>
                      </div>
                      <div className="px-4 py-3 bg-primary-50 dark:bg-primary-950/20 flex justify-between">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Total</span>
                        <span className="text-base font-extrabold text-primary-600 dark:text-primary-400">{formatLKR(total)}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setBookingStep('form')}
                        className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingStep('payment')}
                        className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-all shadow-md shadow-primary-600/10 flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Pay Securely · {formatLKR(total)}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* ── STEP 3: Payment Method Selection ── */}
              {bookingStep === 'payment' && selectedPet && (() => {
                const total = calculateTotal(consultationFee);
                return (
                  <form onSubmit={handlePaymentSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold">
                      Payment Summary
                    </p>

                    {/* Compact fee recap */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>{channelForm.serviceType}</span>
                        <span>{formatLKR(consultationFee)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>Platform Fee</span>
                        <span>{formatLKR(PLATFORM_FEE)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>Tax</span>
                        <span>{formatLKR(TAX)}</span>
                      </div>
                      <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
                      <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                        <span className="text-sm">Total</span>
                        <span className="text-base text-primary-600 dark:text-primary-400">{formatLKR(total)}</span>
                      </div>
                    </div>

                    {/* Payment method selector */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white">
                        Select Payment Method
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedPayment('stripe')}
                          className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all ${
                            selectedPayment === 'stripe'
                              ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/15'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <CreditCard className="w-4 h-4 mb-1 text-slate-700 dark:text-slate-300" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Card</span>
                          <div className="flex gap-1.5 mt-1.5 items-center">
                            {/* Visa SVG */}
                            <svg className="h-2.5 w-auto" viewBox="0 0 36 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M4.5 10H1L3.8 0H7.3L4.5 10ZM14.3 2.7C13.5 2.4 12.4 2.1 11.2 2.1C7.9 2.1 5.6 3.8 5.6 6.2C5.6 8 7.3 9 8.6 9.6C9.9 10.2 10.3 10.6 10.3 11.1C10.3 11.9 9.3 12.3 8.4 12.3 7 12.3 6.2 11.9 5.1 11.4L4.6 11.1L4.1 14.1C5 14.5 6.6 14.9 8.2 14.9C11.8 14.9 14.1 13.2 14.1 10.8C14.1 9 13 8 11.1 7.1C9.8 6.5 9.3 6.1 9.3 5.6C9.3 4.9 10.3 4.4 11.4 4.4C12.5 4.4 13.3 4.7 13.9 4.9L14.3 5.1L14.8 2.2V2.7ZM26.6 0.2H23.5C22.6 0.2 21.8 0.7 21.4 1.6L15.7 14.8H19.1L19.8 12.8H23.9L24.3 14.8H27.3L26.6 0.2ZM20.8 9.9L22.2 5.9L23 9.9H20.8ZM35.5 0.2H32.6C31.7 0.2 31.1 0.7 30.7 1.6L28.2 7.5L27.2 2.1C27 1 26.1 0.2 25 0.2H20.1L20 0.6C21 0.8 22 1.2 22.8 1.6L25.7 12.3L29.1 0.2H32.4L29.2 14.8H32.6L35.6 0.2H35.5Z" fill="#1A1F71" className="fill-slate-800 dark:fill-white"/>
                            </svg>
                            {/* Mastercard SVG */}
                            <svg className="h-3 w-auto" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="7.5" cy="7.5" r="7.5" fill="#EB001B"/>
                              <circle cx="16.5" cy="7.5" r="7.5" fill="#F79E1B" fillOpacity="0.85"/>
                            </svg>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPayment('gpay')}
                          className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all ${
                            selectedPayment === 'gpay'
                              ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/15'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="text-lg font-black">G</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Google Pay</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPayment('applepay')}
                          className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all ${
                            selectedPayment === 'applepay'
                              ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/15'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="text-lg"></span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Apple Pay</span>
                        </button>
                      </div>
                    </div>

                    {/* Security badge */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 justify-center">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Secured by Stripe • 256-bit SSL encryption</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setBookingStep('summary')}
                        className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Preparing...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            Pay Securely · {formatLKR(total)}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                );
              })()}

              {/* Step 3: Stripe Connecting/Loading Overlay */}
              {bookingStep === 'loading' && (
                <div className="p-12 flex flex-col items-center justify-center space-y-6 text-center">
                  <div className="relative flex items-center justify-center">
                    {/* Spinner */}
                    <div className="w-20 h-20 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin" />
                    {/* Inner secure lock or brand indicator */}
                    <div className="absolute text-primary-500 font-extrabold text-sm">Stripe</div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Connecting to Stripe...</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                      We are securely transferring you to Stripe Checkout to finalize your payment.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}