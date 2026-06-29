'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Mail,
  Lock,
  MapPin,
  FileText,
  Upload,
  CheckCircle,
  Stethoscope,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { authService } from '@/services/auth.service';
import { PasswordStrength } from '@/components/auth/PasswordStrength';

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

export default function ClinicSignupPage() {
  const { isAuthenticated, user, signUp, refreshProfile } = useAuth();
  const router = useRouter();

  // Form State
  const [clinicName, setClinicName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [operatingHours, setOperatingHours] = useState('');
  const [description, setDescription] = useState('');
  const [mainVeterinarianName, setMainVeterinarianName] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [otherDoctors, setOtherDoctors] = useState<string[]>([]);
  const [tempDoctorName, setTempDoctorName] = useState('');

  // Files
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [clinicPhoto, setClinicPhoto] = useState<File | null>(null);

  // Map States
  const [showMap, setShowMap] = useState(false);
  const [isMapsApiLoaded, setIsMapsApiLoaded] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Load Google Maps API Key on mount
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      loadGoogleMapsScript(apiKey)
        .then(() => {
          setIsMapsApiLoaded(true);
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              },
              () => {
                setMapCenter({ lat: 6.9271, lng: 79.8612 }); // Colombo
              }
            );
          } else {
            setMapCenter({ lat: 6.9271, lng: 79.8612 });
          }
        })
        .catch((err) => console.error('Failed to load Google Maps:', err));
    }
  }, []);

  // Initialize Map and Draggable Marker
  useEffect(() => {
    if (!showMap || !isMapsApiLoaded || !mapCenter || !mapContainerRef.current) return;

    const google = (window as any).google;
    const map = new google.maps.Map(mapContainerRef.current, {
      center: mapCenter,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const marker = new google.maps.Marker({
      position: mapCenter,
      map,
      draggable: true,
    });

    const updateLocationFromCoords = async (lat: number, lng: number) => {
      setLatitude(String(lat));
      setLongitude(String(lng));
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'PetAIApp/1.0'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.display_name) {
            setAddress(data.display_name);
            return;
          }
        }
      } catch (err) {
        console.warn('Nominatim reverse geocode failed:', err);
      }

      // Fallback to Google Geocoder or coordinates
      const google = (window as any).google;
      if (google && google.maps && google.maps.Geocoder) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
          if (status === 'OK' && results[0]) {
            setAddress(results[0].formatted_address);
          } else {
            setAddress(`Pinned Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
          }
        });
      } else {
        setAddress(`Pinned Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
      }
    };

    // Set initial coordinates and fetch address
    updateLocationFromCoords(mapCenter.lat, mapCenter.lng);

    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      if (pos) {
        updateLocationFromCoords(pos.lat(), pos.lng());
      }
    });

    map.addListener('click', (e: any) => {
      const pos = e.latLng;
      marker.setPosition(pos);
      updateLocationFromCoords(pos.lat(), pos.lng());
    });
  }, [showMap, isMapsApiLoaded, mapCenter]);

  const handleAddDoctor = () => {
    if (tempDoctorName.trim()) {
      setOtherDoctors((prev) => [...prev, tempDoctorName.trim()]);
      setTempDoctorName('');
    }
  };

  const handleRemoveDoctor = (index: number) => {
    setOtherDoctors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'license' | 'photo') => {
    const file = e.target.files?.[0] || null;
    if (type === 'license') {
      setLicenseFile(file);
    } else {
      setClinicPhoto(file);
    }
  };

  const validateForm = () => {
    if (!clinicName.trim()) return 'Clinic name is required';
    if (!contactNumber.trim()) return 'Contact number is required';
    if (!address.trim()) return 'Address is required';
    if (!mainVeterinarianName.trim()) return 'Main veterinarian name is required';
    if (!licenseFile) return 'Clinic license file is required for verification';

    if (!isAuthenticated) {
      if (!email.trim()) return 'Email is required';
      if (password.length < 8) return 'Password must be at least 8 characters';
      if (password !== confirmPassword) return 'Passwords do not match';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      let currentUserId = user?.id;
      let accessToken = '';

      // 1. Authenticate if not already authenticated
      if (!isAuthenticated) {
        const { data: authData, error: authError } = await signUp(email, password, 'clinic', contactNumber, clinicName);
        if (authError || !authData.user) {
          throw new Error(authError?.message || 'Authentication signup failed.');
        }
        currentUserId = authData.user.id;
        accessToken = authData.session?.access_token || '';
      } else {
        // If already logged in, get session
        const { data: { session } } = await supabase.auth.getSession();
        accessToken = session?.access_token || '';
      }

      if (!currentUserId) {
        throw new Error('User session not found.');
      }

      // 2. Build clinic description
      const clinicDescription = [
        description.trim(),
        specialties ? `Specialties: ${specialties}` : '',
        mainVeterinarianName ? `Lead veterinarian: ${mainVeterinarianName}` : '',
        otherDoctors.length > 0 ? `Team: ${otherDoctors.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      // 3. Send profile registration details to the backend (multipart form)
      const formPayload = new FormData();
      formPayload.append('clinic_name', clinicName);
      formPayload.append('phone', contactNumber);
      formPayload.append('address', address);
      formPayload.append('city', '');
      formPayload.append('state', '');
      formPayload.append('zip_code', '');
      formPayload.append('country', '');
      formPayload.append('website', '');
      formPayload.append('opening_hours', operatingHours);
      formPayload.append('description', clinicDescription);
      
      if (latitude) {
        formPayload.append('latitude', latitude);
      }
      if (longitude) {
        formPayload.append('longitude', longitude);
      }
      if (clinicPhoto) {
        formPayload.append('clinic_photo', clinicPhoto);
      }
      if (licenseFile) {
        formPayload.append('clinic_license', licenseFile);
      }

      await authService.registerClinic(formPayload, accessToken);

      await refreshProfile();
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create clinic account.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white border shadow-xl dark:bg-slate-900 rounded-2xl border-slate-100 dark:border-slate-800 p-8 text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
              <CheckCircle className="w-12 h-12" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Registration Submitted!
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm leading-relaxed">
            Your clinic registration has been submitted successfully. Our admin team will review your application and documents before it becomes visible to pet owners.
          </p>
          <button
            onClick={() => router.push('/clinic/dashboard')}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white border shadow-xl dark:bg-slate-900 rounded-2xl border-slate-100 dark:border-slate-800 p-8"
      >
        <button
          onClick={() => router.push('/auth/select-role')}
          className="flex items-center gap-2 mb-6 font-medium transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Register Your Clinic
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Provide your clinic details for verification and listing.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Account Credentials (only shown if NOT authenticated) */}
          {!isAuthenticated && (
            <div className="p-6 border bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="text-md font-semibold text-slate-900 dark:text-white">
                Account Credentials
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none transition-all dark:text-white"
                      placeholder="clinic@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none transition-all dark:text-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute -translate-y-1/2 right-3 top-1/2 text-slate-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none transition-all dark:text-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute -translate-y-1/2 right-3 top-1/2 text-slate-400"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
              {password && <PasswordStrength password={password} />}
            </div>
          )}

          {/* 2. Clinic Information */}
          <div className="p-6 border bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-primary-500" />
              <h3 className="text-md font-semibold text-slate-900 dark:text-white">
                Clinic Information
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Clinic Name *
                </label>
                <input
                  type="text"
                  required
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none transition-all dark:text-white"
                  placeholder="Vet Care Clinic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none transition-all dark:text-white"
                  placeholder="+1 555-555-5555"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Address *
                  </label>
                  {isMapsApiLoaded && (
                    <button
                      type="button"
                      onClick={() => setShowMap(!showMap)}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      {showMap ? 'Hide Map' : 'Select on Map'}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none transition-all dark:text-white"
                  placeholder="123 Main Street, City, Country"
                />

                {showMap && isMapsApiLoaded && (
                  <div className="mt-3 space-y-2">
                    <div
                      ref={mapContainerRef}
                      className="w-full h-48 rounded-lg border border-slate-200 dark:border-slate-600 shadow-inner"
                      style={{ minHeight: '192px' }}
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 text-right">
                      Drag the marker or click on the map to pin your clinic's location
                    </p>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none transition-all dark:text-white"
                  placeholder="Mon-Fri: 8am-6pm, Sat: 9am-4pm (Optional)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description / Services Offered
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none transition-all dark:text-white resize-none"
                  placeholder="Describe your clinic and veterinary services... (Optional)"
                />
              </div>
            </div>
          </div>

          {/* 3. Veterinarian Details */}
          <div className="p-6 border bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Stethoscope className="w-5 h-5 text-secondary-500" />
              <h3 className="text-md font-semibold text-slate-900 dark:text-white">
                Veterinarians & Specialties
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Main Veterinarian Name *
                </label>
                <input
                  type="text"
                  required
                  value={mainVeterinarianName}
                  onChange={(e) => setMainVeterinarianName(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none transition-all dark:text-white"
                  placeholder="Dr. Sarah Jenkins"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Specialties
                </label>
                <input
                  type="text"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none transition-all dark:text-white"
                  placeholder="Surgery, Vaccines, Dentistry (Optional)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Other Team Members
                </label>
                <div className="flex gap-2">
                  <input
                     type="text"
                     value={tempDoctorName}
                     onChange={(e) => setTempDoctorName(e.target.value)}
                     className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none transition-all dark:text-white"
                     placeholder="Add team member name..."
                  />
                  <button
                    type="button"
                    onClick={handleAddDoctor}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>

                {otherDoctors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {otherDoctors.map((doc, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1.5 px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full text-xs font-medium"
                      >
                        {doc}
                        <button type="button" onClick={() => handleRemoveDoctor(idx)}>
                          <X className="w-3.5 h-3.5 hover:text-red-500" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. License & Image Uploads */}
          <div className="p-6 border bg-amber-50 dark:bg-amber-900/10 rounded-2xl border-amber-200 dark:border-amber-800 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-amber-600" />
              <h3 className="text-md font-semibold text-slate-900 dark:text-white">
                Verification Documents
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Clinic License / Registration PDF *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    required
                    onChange={(e) => handleFileChange(e, 'license')}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-700 border-2 border-dashed rounded-lg border-slate-300 dark:border-slate-600 hover:border-primary-500 transition-colors">
                    {licenseFile ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{licenseFile.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-sm text-slate-500">Click to upload license file (PDF, JPG, PNG)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Clinic Logo / Cover Image
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'photo')}
                    accept=".jpg,.jpeg,.png"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-700 border-2 border-dashed rounded-lg border-slate-300 dark:border-slate-600 hover:border-primary-500 transition-colors">
                    {clinicPhoto ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{clinicPhoto.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-sm text-slate-500">Click to upload logo or cover image (JPG, PNG)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Submitting registration...' : 'Submit Registration'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
