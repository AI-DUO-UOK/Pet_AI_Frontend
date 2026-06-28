"use client";
import { apiFetch } from '@/lib/api';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
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
  Map as MapIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Global promise for maps loading to avoid double injection
let mapsLoadingPromise: Promise<void> | null = null;

const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).google?.maps) return Promise.resolve();
  if (mapsLoadingPromise) return mapsLoadingPromise;

  mapsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve();
    };
    script.onerror = (err) => {
      mapsLoadingPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return mapsLoadingPromise;
};

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
  latitude?: number | null;
  longitude?: number | null;
};

type ClinicReview = {
  id: string;
  reviewer: string;
  pet: string;
  rating: number;
  comment: string;
  date: string;
  treatment?: string;
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1631217343661-1d1971f5a196?w=1200&h=800&fit=crop';

/*
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
*/

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

function rebuildDescription(
  rawDesc: string,
  currentServices: string[],
  currentDoctors: string[]
): string {
  const parts = [rawDesc.trim()];
  
  if (currentServices.length > 0) {
    parts.push(`Specialties: ${currentServices.join(', ')}`);
  }
  
  if (currentDoctors.length > 0) {
    const leadVet = currentDoctors[0];
    parts.push(`Lead veterinarian: ${leadVet}`);
    if (currentDoctors.length > 1) {
      parts.push(`Team: ${currentDoctors.slice(1).join(', ')}`);
    }
  }
  
  return parts.filter(Boolean).join('\n\n');
}
export default function ClinicProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ClinicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<string[]>([]);
  const [reviews, setReviews] = useState<ClinicReview[]>([]);
  const [, setReviewStats] = useState({ count: 0, averageRating: 0 });
  const [newService, setNewService] = useState('');
  const [newFacility, setNewFacility] = useState('');
  const [newDoctor, setNewDoctor] = useState('');
  
  // Google Maps States
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isMapsApiLoaded, setIsMapsApiLoaded] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [showMapsConfig, setShowMapsConfig] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const mapInitializedRef = useRef(false);

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
    latitude: '',
    longitude: '',
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
        const response = await apiFetch(`/api/clinic/profile?user_id=${encodeURIComponent(user.id)}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to load clinic profile (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const clinic: ClinicProfile = data.clinic;
        setProfile(clinic);
        try {
          const reviewsResponse = await apiFetch(`/api/reviews/clinic?clinic_id=${encodeURIComponent(clinic.id)}`);
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
          description: getRawDescription(clinic.description || ''),
          latitude: clinic.latitude !== undefined && clinic.latitude !== null ? String(clinic.latitude) : '',
          longitude: clinic.longitude !== undefined && clinic.longitude !== null ? String(clinic.longitude) : '',
        });

        const { leadVet, team, specialties } = parseClinicDescription(clinic.description || '');
        const dbDoctors = [leadVet, ...team].map(formatDoctorName).filter(Boolean);
        const dbServices = specialties;

        const savedExtra = localStorage.getItem('clinicProfileExtras');
        let initialServices = dbServices;
        let initialFacilities: string[] = [];
        let initialDoctors = dbDoctors;

        if (savedExtra) {
          try {
            const parsed = JSON.parse(savedExtra);
            if (parsed) {
              if (Array.isArray(parsed.services)) initialServices = parsed.services;
              if (Array.isArray(parsed.facilities)) initialFacilities = parsed.facilities;
              if (Array.isArray(parsed.doctors)) initialDoctors = parsed.doctors;
            }
          } catch {
            // Keep parsed database values if localStorage parsing fails
          }
        } else {
          localStorage.setItem(
            'clinicProfileExtras',
            JSON.stringify({ services: dbServices, facilities: [], doctors: dbDoctors })
          );
        }

        setServices(initialServices);
        setFacilities(initialFacilities);
        setDoctors(initialDoctors);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinicProfile();
  }, [user?.id]);

  // Check and automatically load Google Maps API
  useEffect(() => {
    const fetchMapsKey = async () => {
      try {
        const res = await apiFetch('/api/config/google-maps');
        if (res.ok) {
          const data = await res.json();
          if (data.key) {
            loadGoogleMaps(data.key);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch Maps API key from backend config:', err);
      }

      const autoApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (autoApiKey) {
        loadGoogleMaps(autoApiKey);
      } else {
        setShowMapsConfig(true);
      }
    };

    fetchMapsKey();
  }, []);

  // Trigger mapCenter initialization once profile loads
  useEffect(() => {
    if (profile) {
      if (
        profile.latitude !== undefined &&
        profile.latitude !== null &&
        profile.longitude !== undefined &&
        profile.longitude !== null
      ) {
        const lat = Number(profile.latitude);
        const lng = Number(profile.longitude);
        setMapCenter({ lat, lng });
      } else {
        // Default fallback or browser geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setMapCenter({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
            },
            () => {
              // Default to Colombo, Sri Lanka
              setMapCenter({ lat: 6.9271, lng: 79.8612 });
            }
          );
        } else {
          // Default to Colombo, Sri Lanka
          setMapCenter({ lat: 6.9271, lng: 79.8612 });
        }
      }
    }
  }, [profile]);

  // Load Maps helper
  const loadGoogleMaps = async (key: string) => {
    try {
      setMapsError(null);
      await loadGoogleMapsScript(key.trim());
      setIsMapsApiLoaded(true);
      setShowMapsConfig(false);
    } catch (err) {
      setMapsError('Failed to load Google Maps SDK. Please check your API Key.');
      console.error(err);
    }
  };

  const handleManualMapLoad = () => {
    if (!apiKeyInput.trim()) {
      setMapsError('Please enter a valid Google Maps API Key.');
      return;
    }
    loadGoogleMaps(apiKeyInput);
  };

  const parseNominatimAddress = (data: any) => {
    const addressObj = data.address || {};
    
    // Construct a line address from road, house_number, suburb, neighbourhood etc.
    const streetParts = [
      addressObj.house_number,
      addressObj.road,
      addressObj.neighbourhood,
      addressObj.suburb
    ].filter(Boolean);
    
    const addressLine = streetParts.join(', ') || data.display_name.split(',')[0];
    
    const city = addressObj.city || addressObj.town || addressObj.village || addressObj.county || '';
    const state = addressObj.state || addressObj.province || addressObj.region || '';
    const zip = addressObj.postcode || '';
    const country = addressObj.country || '';
    
    return {
      address: addressLine,
      city,
      state,
      zip,
      country
    };
  };

  const parseGoogleAddress = (addressComponents: any[]) => {
    let streetNumber = '';
    let route = '';
    let city = '';
    let state = '';
    let zip = '';
    let country = '';
    
    for (const component of addressComponents) {
      const types = component.types;
      if (types.includes('street_number')) {
        streetNumber = component.long_name;
      } else if (types.includes('route')) {
        route = component.long_name;
      } else if (types.includes('locality') || types.includes('sublocality')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      } else if (types.includes('postal_code')) {
        zip = component.long_name;
      } else if (types.includes('country')) {
        country = component.long_name;
      }
    }
    
    const addressLine = [streetNumber, route].filter(Boolean).join(' ');
    return {
      address: addressLine,
      city,
      state,
      zip,
      country
    };
  };

  // Initialize Map Canvas & Draggable Marker
  useEffect(() => {
    if (!showMap || !isMapsApiLoaded || !mapCenter || !mapContainerRef.current) return;

    // Create map instance
    const map = new (window as any).google.maps.Map(mapContainerRef.current, {
      center: mapCenter,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    mapInstanceRef.current = map;

    // Create draggable marker
    const marker = new (window as any).google.maps.Marker({
      position: mapCenter,
      map,
      draggable: true,
      animation: (window as any).google.maps.Animation.DROP,
    });
    markerInstanceRef.current = marker;

    // Set initial coords in formState if they were empty
    if (formState.latitude === '' || formState.longitude === '') {
      setFormState((prev) => ({
        ...prev,
        latitude: String(mapCenter.lat),
        longitude: String(mapCenter.lng),
      }));
    }

    const fallbackToNominatim = async (lat: number, lng: number) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'PetAIApp/1.0'
          }
        });
        if (res.ok) {
          const data = await res.json();
          const parsed = parseNominatimAddress(data);
          setFormState((prev) => ({
            ...prev,
            address: parsed.address || prev.address,
            city: parsed.city || prev.city,
            state: parsed.state || prev.state,
            zip_code: parsed.zip || prev.zip_code,
            country: parsed.country || prev.country,
          }));
        }
      } catch (err) {
        console.error('Nominatim reverse geocoding fallback failed:', err);
      }
    };

    // Reverse geocode helper function
    const performReverseGeocoding = (lat: number, lng: number) => {
      if ((window as any).google?.maps?.Geocoder) {
        const geocoder = new (window as any).google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
          if (status === 'OK' && results[0]) {
            const parsed = parseGoogleAddress(results[0].address_components);
            setFormState((prev) => ({
              ...prev,
              address: parsed.address || prev.address,
              city: parsed.city || prev.city,
              state: parsed.state || prev.state,
              zip_code: parsed.zip || prev.zip_code,
              country: parsed.country || prev.country,
            }));
          } else {
            fallbackToNominatim(lat, lng);
          }
        });
      } else {
        fallbackToNominatim(lat, lng);
      }
    };

    // Marker dragend listener
    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      if (pos) {
        const lat = pos.lat();
        const lng = pos.lng();
        setFormState((prev) => ({
          ...prev,
          latitude: String(lat),
          longitude: String(lng),
        }));
        performReverseGeocoding(lat, lng);
      }
    });

    // Map click listener to place the marker and update coordinates
    map.addListener('click', (e: any) => {
      const pos = e.latLng;
      marker.setPosition(pos);
      const lat = pos.lat();
      const lng = pos.lng();
      setFormState((prev) => ({
        ...prev,
        latitude: String(lat),
        longitude: String(lng),
      }));
      performReverseGeocoding(lat, lng);
    });

    mapInitializedRef.current = true;

    return () => {
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
      mapInitializedRef.current = false;
    };
  }, [showMap, isMapsApiLoaded, mapCenter]);

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
      const rawDesc = formState.description;
      const finalDescription = rebuildDescription(rawDesc, services, doctors);
      formData.append('description', finalDescription);

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      if (formState.latitude !== '') {
        formData.append('latitude', formState.latitude);
      }
      if (formState.longitude !== '') {
        formData.append('longitude', formState.longitude);
      }

      galleryFiles.forEach((file) => {
        formData.append('photos', file);
      });

      const response = await apiFetch('/api/clinic/profile', {
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
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formState.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      placeholder="Phone number"
                    />
                    <input
                      type="email"
                      disabled
                      value={profile?.email || ''}
                      className="w-full px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-slate-900 dark:text-white">{profile?.phone || 'Not provided'}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{profile?.email}</p>
                  </>
                )}
              </div>
              <div className="p-4 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <MapPin className="w-4 h-4" /> Location
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setShowMap(!showMap)}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors border border-slate-300 dark:border-slate-600"
                    >
                      <MapIcon className="w-3 h-3" />
                      {showMap ? 'Hide Map' : 'Edit on Map'}
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formState.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      placeholder="Address line (e.g. street name)"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formState.city}
                        onChange={(e) => handleFieldChange('city', e.target.value)}
                        className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20"
                        placeholder="City"
                      />
                      <input
                        type="text"
                        value={formState.state}
                        onChange={(e) => handleFieldChange('state', e.target.value)}
                        className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20"
                        placeholder="State / Province"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formState.zip_code}
                        onChange={(e) => handleFieldChange('zip_code', e.target.value)}
                        className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20"
                        placeholder="Zip Code"
                      />
                      <input
                        type="text"
                        value={formState.country}
                        onChange={(e) => handleFieldChange('country', e.target.value)}
                        className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20"
                        placeholder="Country"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-slate-900 dark:text-white">{profile?.address}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {[profile?.city, profile?.state, profile?.zip_code, profile?.country].filter(Boolean).join(', ') || 'Not provided'}
                    </p>
                  </>
                )}
              </div>
              <div className="p-4 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                  <Clock className="w-4 h-4" /> Hours
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formState.opening_hours}
                    onChange={(e) => handleFieldChange('opening_hours', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="Operating hours (e.g. 9AM - 5PM)"
                  />
                ) : (
                  <p className="font-semibold text-slate-900 dark:text-white">{profile?.opening_hours || 'Not provided'}</p>
                )}
              </div>
              <div className="p-4 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                  <Globe className="w-4 h-4" /> Website
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formState.website}
                    onChange={(e) => handleFieldChange('website', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="Website URL (e.g. https://...)"
                  />
                ) : (
                  <p className="font-semibold text-slate-900 dark:text-white break-all">{profile?.website || 'Not provided'}</p>
                )}
              </div>
            </div>

            {/* Conditional Map View */}
            {isEditing && showMap && (
              <div className="space-y-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/10">
                {/* Google Maps API Key Setup UI */}
                {showMapsConfig && (
                  <div className="p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl space-y-3 bg-slate-50 dark:bg-slate-800/20">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MapIcon className="w-4 h-4 text-primary-500" /> Use Interactive Google Maps Selector
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      To select your exact location visually, enter your Google Maps API Key below:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="Enter Google Maps API Key (AIzaSy...)"
                        className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                      <button
                        type="button"
                        onClick={handleManualMapLoad}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        Load Map
                      </button>
                    </div>
                    {mapsError && (
                      <p className="text-xs text-red-600 dark:text-red-400">{mapsError}</p>
                    )}
                  </div>
                )}

                {/* Google Maps Interactive UI */}
                {isMapsApiLoaded && (
                  <div>
                    <div
                      ref={mapContainerRef}
                      className="w-full h-64 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner"
                      style={{ minHeight: '256px' }}
                    />
                    <p className="mt-1.5 text-right text-[10px] text-slate-500 dark:text-slate-400">
                      Drag the red marker or click on the map to set your location
                    </p>
                  </div>
                )}

                <div className="p-3 bg-primary-50 dark:bg-primary-950/20 border border-primary-100/50 dark:border-primary-900/30 rounded-xl flex items-start gap-2.5">
                  <MapIcon className="w-4 h-4 text-primary-500 mt-0.5" />
                  <p className="text-xs text-primary-700 dark:text-primary-400 leading-relaxed">
                    To set your precise address location: drag the red marker or click anywhere directly on the map. Coordinates are stored in the database.
                  </p>
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">About</h3>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={formState.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                  placeholder="Tell pet owners about your clinic..."
                />
              ) : (
                <p className="leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                  {profile?.description || 'No clinic description has been provided yet.'}
                </p>
              )}
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