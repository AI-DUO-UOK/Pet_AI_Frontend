"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Edit2,
  MapPin,
  Phone,
  Globe,
  Clock,
  Image as ImageIcon,
  Users,
  Star,
  Plus,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type ClinicProfile = {
  id: string;
  user_id: string;
  clinic_name: string;
  email: string;
  phone?: string | null;
  address: string;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  website?: string | null;
  opening_hours?: string | null;
  description?: string | null;
  clinic_logo_url?: string | null;
  gallery_urls?: string[];
  verification_status?: 'pending' | 'approved' | 'rejected';
  is_verified?: boolean;
  is_rejected?: boolean;
  rejection_reason?: string | null;
  rejected_at?: string | null;
};

type ClinicReview = {
  id: string;
  reviewer: string;
  pet: string;
  rating: number;
  comment: string;
  date: string;
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1631217343661-1d1971f5a196?w=1200&h=800&fit=crop';

const DEFAULT_SERVICES = [
  'General Checkups',
  'Vaccinations',
  'Dental Care',
  'Surgery',
  'Emergency Care',
  'Grooming',
];

const DEFAULT_FACILITIES = [
  'X-Ray',
  'Ultrasound',
  'Surgery Suite',
  'Dental Equipment',
  'Laboratory',
];

const DEFAULT_DOCTORS = [
  'Dr. Sarah Jenkins',
  'Dr. David Martinez',
  'Dr. Lisa Wong',
];

const DEFAULT_REVIEWS: ClinicReview[] = [
  {
    id: '1',
    reviewer: 'John Smith',
    pet: 'Max (Golden Retriever)',
    rating: 5,
    comment: 'Excellent care and very professional staff. Dr. Jenkins was amazing with Max!',
    date: '2024-03-15',
  },
  {
    id: '2',
    reviewer: 'Sarah Chen',
    pet: 'Bella (Poodle)',
    rating: 5,
    comment: 'Best vet clinic in the area. Highly recommend!',
    date: '2024-02-28',
  },
];

export default function ClinicProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ClinicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [services, setServices] = useState<string[]>(DEFAULT_SERVICES);
  const [facilities, setFacilities] = useState<string[]>(DEFAULT_FACILITIES);
  const [doctors, setDoctors] = useState<string[]>(DEFAULT_DOCTORS);
  const [reviews, setReviews] = useState<ClinicReview[]>([]);
  const [reviewStats, setReviewStats] = useState({ count: 0, averageRating: 0 });
  const [newService, setNewService] = useState('');
  const [newFacility, setNewFacility] = useState('');
  const [newDoctor, setNewDoctor] = useState('');
  const [formState, setFormState] = useState({
    clinic_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    website: '',
    opening_hours: '',
    description: '',
  });

  const clinicImageUrl = useMemo(
    () => profile?.clinic_logo_url || FALLBACK_IMAGE,
    [profile?.clinic_logo_url]
  );

  const galleryUrls = profile?.gallery_urls || [];

  useEffect(() => {
    const fetchClinicProfile = async () => {
      if (!user?.id) {
        setError('Clinic session not found. Please log in again.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `http://localhost:8000/api/clinic/profile?user_id=${encodeURIComponent(user.id)}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to load clinic profile (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const clinic: ClinicProfile = data.clinic;
        setProfile(clinic);
        try {
          const reviewsResponse = await fetch(`http://localhost:8000/api/reviews/clinic?clinic_id=${encodeURIComponent(clinic.id)}`);
          if (reviewsResponse.ok) {
            const reviewsJson = await reviewsResponse.json();
            const realReviews = reviewsJson.reviews || [];
            setReviews(realReviews);
            setReviewStats({ count: reviewsJson.count || realReviews.length, averageRating: reviewsJson.average_rating || 0 });
          } else {
            setReviews([]);
            setReviewStats({ count: 0, averageRating: 0 });
          }
        } catch {
          setReviews([]);
          setReviewStats({ count: 0, averageRating: 0 });
        }
        setFormState({
          clinic_name: clinic.clinic_name || '',
          phone: clinic.phone || '',
          address: clinic.address || '',
          city: clinic.city || '',
          state: clinic.state || '',
          zip_code: clinic.zip_code || '',
          country: clinic.country || '',
          website: clinic.website || '',
          opening_hours: clinic.opening_hours || '',
          description: clinic.description || '',
        });

        const savedExtra = localStorage.getItem('clinicProfileExtras');
        if (savedExtra) {
          try {
            const parsed = JSON.parse(savedExtra);
            setServices(Array.isArray(parsed.services) && parsed.services.length ? parsed.services : DEFAULT_SERVICES);
            setFacilities(Array.isArray(parsed.facilities) && parsed.facilities.length ? parsed.facilities : DEFAULT_FACILITIES);
            setDoctors(Array.isArray(parsed.doctors) && parsed.doctors.length ? parsed.doctors : DEFAULT_DOCTORS);
          } catch {
            setServices(DEFAULT_SERVICES);
            setFacilities(DEFAULT_FACILITIES);
            setDoctors(DEFAULT_DOCTORS);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinicProfile();
  }, [user?.id]);

  const status = profile?.verification_status || (profile?.is_rejected ? 'rejected' : profile?.is_verified ? 'approved' : 'pending');

  const handleFieldChange = (field: keyof typeof formState, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const persistExtras = (nextServices = services, nextFacilities = facilities, nextDoctors = doctors) => {
    localStorage.setItem(
      'clinicProfileExtras',
      JSON.stringify({ services: nextServices, facilities: nextFacilities, doctors: nextDoctors })
    );
  };

  const addService = () => {
    const value = newService.trim();
    if (!value || services.includes(value)) return;
    const next = [...services, value];
    setServices(next);
    setNewService('');
    persistExtras(next, facilities, doctors);
  };

  const addFacility = () => {
    const value = newFacility.trim();
    if (!value || facilities.includes(value)) return;
    const next = [...facilities, value];
    setFacilities(next);
    setNewFacility('');
    persistExtras(services, next, doctors);
  };

  const addDoctor = () => {
    const value = newDoctor.trim();
    if (!value || doctors.includes(value)) return;
    const next = [...doctors, value];
    setDoctors(next);
    setNewDoctor('');
    persistExtras(services, facilities, next);
  };

  const removeService = (service: string) => {
    const next = services.filter((item) => item !== service);
    setServices(next);
    persistExtras(next, facilities, doctors);
  };

  const removeFacility = (facility: string) => {
    const next = facilities.filter((item) => item !== facility);
    setFacilities(next);
    persistExtras(services, next, doctors);
  };

  const removeDoctor = (doctor: string) => {
    const next = doctors.filter((item) => item !== doctor);
    setDoctors(next);
    persistExtras(services, facilities, next);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('clinic_name', formState.clinic_name);
      formData.append('phone', formState.phone);
      formData.append('address', formState.address);
      formData.append('city', formState.city);
      formData.append('state', formState.state);
      formData.append('zip_code', formState.zip_code);
      formData.append('country', formState.country);
      formData.append('website', formState.website);
      formData.append('opening_hours', formState.opening_hours);
      formData.append('description', formState.description);

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      galleryFiles.forEach((file) => {
        formData.append('photos', file);
      });

      const response = await fetch('http://localhost:8000/api/clinic/profile', {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save clinic profile (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      setProfile(data.clinic);
      setPhotoFile(null);
      setGalleryFiles([]);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="py-16 text-center text-slate-500 dark:text-slate-400">Loading clinic profile...</div>;
  }

  if (error && !profile) {
    return (
      <div className="p-6 border border-red-200 rounded-2xl bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clinic Profile</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Manage the real clinic details shown to pet owners.</p>
        </div>
        <div className="flex items-center gap-3">
          {isEditing && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 font-medium text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsEditing((current) => !current)}
            className="flex items-center gap-2 px-4 py-2 font-medium text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700"
          >
            <Edit2 className="w-4 h-4" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </motion.button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden border bg-white dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative h-72">
            <img src={clinicImageUrl} alt={profile?.clinic_name || 'Clinic'} className="object-cover w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 text-xs font-semibold uppercase rounded-full bg-white/15 backdrop-blur-sm">
                  {status === 'approved' ? 'Verified Clinic' : status === 'rejected' ? 'Rejected' : 'Pending Review'}
                </span>
              </div>
              <h2 className="text-3xl font-bold">{profile?.clinic_name}</h2>
              <p className="mt-1 text-sm text-white/80">{profile?.address}{profile?.city ? `, ${profile.city}` : ''}{profile?.state ? `, ${profile.state}` : ''}</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {galleryUrls.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Clinic Gallery</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{galleryUrls.length} images</span>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {galleryUrls.map((url, index) => (
                    <img
                      key={`${url}-${index}`}
                      src={url}
                      alt={`Clinic gallery ${index + 1}`}
                      className="object-cover w-full h-28 rounded-xl border border-slate-200 dark:border-slate-800"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                  <Phone className="w-4 h-4" /> Contact
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">{profile?.phone || 'Not provided'}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{profile?.email}</p>
              </div>
              <div className="p-4 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                  <MapPin className="w-4 h-4" /> Location
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">{profile?.address}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {[profile?.city, profile?.state, profile?.zip_code, profile?.country].filter(Boolean).join(', ') || 'Not provided'}
                </p>
              </div>
              <div className="p-4 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                  <Clock className="w-4 h-4" /> Hours
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">{profile?.opening_hours || 'Not provided'}</p>
              </div>
              <div className="p-4 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                  <Globe className="w-4 h-4" /> Website
                </div>
                <p className="font-semibold text-slate-900 dark:text-white break-all">{profile?.website || 'Not provided'}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">About</h3>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                {profile?.description || 'No clinic description has been provided yet.'}
              </p>
            </div>

            {profile?.is_rejected && profile?.rejection_reason && (
              <div className="p-4 border border-red-200 rounded-xl bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2 text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4" /> Rejection reason
                </div>
                <p className="text-sm text-red-700 dark:text-red-200">{profile.rejection_reason}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 border bg-white dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Verification Status</h3>
            </div>
            <div className={`flex items-start gap-3 p-4 rounded-xl ${status === 'approved' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}>
              <div className={`p-2 rounded-lg ${status === 'approved' ? 'bg-green-100 dark:bg-green-900/30' : status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                {status === 'approved' ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" /> : <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
              </div>
              <div>
                <p className={`font-semibold ${status === 'approved' ? 'text-green-700 dark:text-green-300' : status === 'rejected' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
                  {status === 'approved' ? 'Verified clinic' : status === 'rejected' ? 'Verification rejected' : 'Pending verification'}
                </p>
                <p className={`text-sm ${status === 'approved' ? 'text-green-600 dark:text-green-400' : status === 'rejected' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {status === 'approved' ? 'Your clinic is visible to pet owners.' : status === 'rejected' ? 'Update your profile and resubmit if needed.' : 'Your clinic is under review.'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border bg-white dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Clinic Images</h3>
            </div>
            <img src={clinicImageUrl} alt="Clinic image" className="object-cover w-full h-44 mb-4 rounded-xl" />
            {galleryUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4 md:grid-cols-4">
                {galleryUrls.map((url, index) => (
                  <img key={`${url}-${index}`} src={url} alt={`Clinic gallery ${index + 1}`} className="object-cover w-full h-24 rounded-lg border border-slate-200 dark:border-slate-800" />
                ))}
              </div>
            )}
            {isEditing ? (
              <div className="space-y-4">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-white hover:file:bg-primary-700"
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Upload a new logo or cover image for the clinic profile.</p>
                </label>

                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))}
                    className="w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-white hover:file:bg-slate-700"
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Upload multiple gallery images to show in the clinic page and admin review.</p>
                </label>

                {galleryFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {galleryFiles.map((file) => (
                      <img key={file.name} src={URL.createObjectURL(file)} alt={file.name} className="object-cover w-full h-20 rounded-lg" />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">This image is shown on the clinic profile and in admin review views. Gallery uploads appear below it.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Services</h2>
          <div className="grid grid-cols-2 gap-3">
            {services.map((service) => (
              <div key={service} className="flex items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{service}</p>
                {isEditing && (
                  <button type="button" onClick={() => removeService(service)} className="text-red-500 hover:text-red-600"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="flex gap-2 mt-4">
              <input value={newService} onChange={(e) => setNewService(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addService()} placeholder="Add service..." className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" />
              <button type="button" onClick={addService} className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Add</button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" /> Our Team
          </h2>
          <div className="space-y-3">
            {doctors.map((doctor) => (
              <div key={doctor} className="p-3 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 rounded-lg border border-primary-200 dark:border-primary-800 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{doctor}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Specialist in: General veterinary care</p>
                </div>
                {isEditing && (
                  <button type="button" onClick={() => removeDoctor(doctor)} className="text-red-500 hover:text-red-600"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="flex gap-2 mt-4">
              <input value={newDoctor} onChange={(e) => setNewDoctor(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addDoctor()} placeholder="Add doctor..." className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" />
              <button type="button" onClick={addDoctor} className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Add</button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Facilities</h2>
        <div className="flex flex-wrap gap-2">
          {facilities.map((facility) => (
            <span key={facility} className="inline-flex items-center gap-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full font-medium">
              {facility}
              {isEditing && <button type="button" onClick={() => removeFacility(facility)} className="hover:text-blue-900 dark:hover:text-blue-200"><X className="w-3.5 h-3.5" /></button>}
            </span>
          ))}
        </div>
        {isEditing && (
          <div className="flex gap-2 mt-4">
            <input value={newFacility} onChange={(e) => setNewFacility(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addFacility()} placeholder="Add facility..." className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white" />
            <button type="button" onClick={addFacility} className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Add</button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Client Reviews</h2>
        <div className="space-y-4">
          {reviews.length > 0 ? reviews.map((review) => (
            <div key={review.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{review.reviewer}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pet: <strong>{review.pet}</strong></p>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Treatment: <span className="font-normal text-slate-600 dark:text-slate-400">{review.treatment || 'General care'}</span>
              </p>
              {review.comment && (
                <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">"{review.comment}"</p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5">{review.date}</p>
            </div>
          )) : (
            <p className="py-6 text-sm text-center text-slate-500 dark:text-slate-400">No client reviews yet. Reviews will appear here after pet owners review completed channels.</p>
          )}
        </div>
        </div>
      </div>
    );
  }
