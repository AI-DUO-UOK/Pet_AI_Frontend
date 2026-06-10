'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Phone,
  Mail,
  MapPin,
  ShieldAlert,
  Save,
  Camera,
  Loader2,
  CheckCircle,
  Map as MapIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type OwnerProfile = {
  full_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  profile_image_url?: string | null;
  bio?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=0D9488&color=fff';

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

export default function PetOwnerProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // File upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    bio: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    latitude: '',
    longitude: '',
  });

  // Google Maps States
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isMapsApiLoaded, setIsMapsApiLoaded] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [showMapsConfig, setShowMapsConfig] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const mapInitializedRef = useRef(false);

  // Load profile details from API
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setError('Session not found. Please log in again.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `http://localhost:8000/api/user/profile?user_id=${encodeURIComponent(user.id)}`
        );

        if (!response.ok) {
          throw new Error('Failed to load profile details');
        }

        const data = await response.json();
        if (data.success && data.profile) {
          const prof: OwnerProfile = data.profile;
          setProfile(prof);
          setFormData({
            full_name: prof.full_name || '',
            phone: prof.phone || '',
            bio: prof.bio || '',
            address: prof.address || '',
            city: prof.city || '',
            state: prof.state || '',
            zip_code: prof.zip_code || '',
            country: prof.country || '',
            emergency_contact_name: prof.emergency_contact_name || '',
            emergency_contact_phone: prof.emergency_contact_phone || '',
            latitude: prof.latitude !== undefined && prof.latitude !== null ? String(prof.latitude) : '',
            longitude: prof.longitude !== undefined && prof.longitude !== null ? String(prof.longitude) : '',
          });
          if (prof.profile_image_url) {
            setAvatarPreview(prof.profile_image_url);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Check and automatically load Google Maps API
  useEffect(() => {
    const fetchMapsKey = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/config/google-maps');
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

        // If address is empty/null, populate it with OSM Nominatim reverse-geocoding format!
        if (!profile.address) {
          const fetchInitialNominatim = async () => {
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
                  setFormData((prev) => ({
                    ...prev,
                    address: data.display_name,
                  }));
                }
              }
            } catch (err) {
              console.warn('Initial Nominatim load failed:', err);
            }
          };
          fetchInitialNominatim();
        }
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

    // Set initial coords in formData if they were empty
    if (formData.latitude === '' || formData.longitude === '') {
      setFormData((prev) => ({
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
          if (data.display_name) {
            setFormData((prev) => ({
              ...prev,
              address: data.display_name,
            }));
          }
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
            setFormData((prev) => ({
              ...prev,
              address: results[0].formatted_address,
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
        setFormData((prev) => ({
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
      setFormData((prev) => ({
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

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zip_code: profile.zip_code || '',
        country: profile.country || '',
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
        latitude: profile.latitude !== undefined && profile.latitude !== null ? String(profile.latitude) : '',
        longitude: profile.longitude !== undefined && profile.longitude !== null ? String(profile.longitude) : '',
      });
      if (profile.profile_image_url) {
        setAvatarPreview(profile.profile_image_url);
      } else {
        setAvatarPreview(null);
      }
      setAvatarFile(null);
    }
    setIsEditing(false);
    setShowMap(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMsg(null);

      const dataPayload = new FormData();
      dataPayload.append('user_id', user.id);
      dataPayload.append('full_name', formData.full_name);
      dataPayload.append('phone', formData.phone);
      dataPayload.append('bio', formData.bio);
      dataPayload.append('address', formData.address);
      dataPayload.append('city', formData.city);
      dataPayload.append('state', formData.state);
      dataPayload.append('zip_code', formData.zip_code);
      dataPayload.append('country', formData.country);
      dataPayload.append('emergency_contact_name', formData.emergency_contact_name);
      dataPayload.append('emergency_contact_phone', formData.emergency_contact_phone);

      if (formData.latitude !== '') {
        dataPayload.append('latitude', formData.latitude);
      }
      if (formData.longitude !== '') {
        dataPayload.append('longitude', formData.longitude);
      }

      if (avatarFile) {
        dataPayload.append('photo', avatarFile);
      }

      const response = await fetch('http://localhost:8000/api/user/profile', {
        method: 'PUT',
        body: dataPayload,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to update profile: ${errText}`);
      }

      const data = await response.json();
      if (data.success && data.profile) {
        const updatedProf: OwnerProfile = data.profile;
        setProfile(updatedProf);

        // Update user session context globally (topbar, avatar, name)
        updateUser({
          name: updatedProf.full_name,
          avatar: updatedProf.profile_image_url || undefined,
        });

        setSuccessMsg('Profile updated successfully!');
        setAvatarFile(null);
        setIsEditing(false);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const currentAvatarUrl = useMemo(() => {
    return avatarPreview || profile?.profile_image_url || DEFAULT_AVATAR;
  }, [avatarPreview, profile?.profile_image_url]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <p className="text-slate-500 dark:text-slate-400">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage your personal details and location address.
          </p>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-md shadow-primary-600/10"
          >
            Edit Profile
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 border border-red-200 rounded-xl bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 border border-emerald-200 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-[250px_1fr]">
          {/* Avatar Area */}
          <div className="flex flex-col items-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 h-fit">
            <div className="relative group w-36 h-36 rounded-full overflow-hidden border-2 border-primary-500/30">
              <img
                src={currentAvatarUrl}
                alt="Profile Avatar"
                className="object-cover w-full h-full"
              />
              {isEditing && (
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="text-center">
              {isEditing && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Click photo to change avatar
                </span>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Basic Info Card */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-primary-500" /> Personal Details
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={formData.full_name}
                    onChange={(e) => handleFieldChange('full_name', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white disabled:opacity-75 disabled:cursor-not-allowed"
                    placeholder="First and last name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address (Read-only)
                  </label>
                  <div className="relative">
                    <Mail className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                    <input
                      type="email"
                      disabled
                      value={profile?.email || ''}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                    <input
                      type="tel"
                      disabled={!isEditing}
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white disabled:opacity-75 disabled:cursor-not-allowed"
                      placeholder="Contact number"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Short Bio
                  </label>
                  <textarea
                    rows={3}
                    disabled={!isEditing}
                    value={formData.bio}
                    onChange={(e) => handleFieldChange('bio', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white resize-none disabled:opacity-75 disabled:cursor-not-allowed"
                    placeholder="Tell us a bit about yourself or your pets..."
                  />
                </div>
              </div>
            </div>

            {/* Address Location Card */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-500" /> Location Details
                </h2>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    {showMap ? 'Hide Map' : 'Edit Location on Map'}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white disabled:opacity-75 disabled:cursor-not-allowed"
                    placeholder="Enter your home address"
                  />
                </div>
              </div>

              {/* Conditional Map View */}
              {showMap && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
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
                    <div className="space-y-4 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/10">
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
            </div>

            {/* Save / Cancel Buttons */}
            {isEditing && (
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2.5 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 font-semibold text-white transition-colors bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/10 disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Profile
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
