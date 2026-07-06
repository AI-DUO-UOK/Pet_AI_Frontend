'use client';
import { apiFetch } from '@/lib/api';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Star, Filter, MapPinIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

type ClinicListItem = {
  id: string;
  clinic_name: string;
  clinic_logo_url?: string | null;
  address?: string | null;
  doctors?: string[];
  opening_hours?: string | null;
  city?: string | null;
  rating?: number;
  reviews?: number;
  latitude?: number | null;
  longitude?: number | null;
  distance?: number | null;
  description?: string | null;
  specializations?: string[];
};

const FALLBACK_CARD_IMAGE = 'https://images.unsplash.com/photo-1631217343661-1d1971f5a196?w=400&h=400&fit=crop';

const getCachedCoordinates = (address: string): { lat: number; lng: number } | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(`geo_cache_${address}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}
  return null;
};

const setCachedCoordinates = (address: string, coords: { lat: number; lng: number }) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`geo_cache_${address}`, JSON.stringify(coords));
  } catch (e) {}
};

const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km;
};

const geocodeAddressOSM = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  const cached = getCachedCoordinates(address);
  if (cached) return cached;

  try {
    await new Promise((resolve) => setTimeout(resolve, 100)); // rate limiting delay
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'PetAIApp/1.0',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data[0]) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        setCachedCoordinates(address, coords);
        return coords;
      }
    }
  } catch (err) {
    console.error('OSM geocoding failed for address:', address, err);
  }
  return null;
};

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

export default function FindVets() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Nearest', 'Highest Rated', 'Dogs', 'Cats', 'Surgery'];
  const [clinics, setClinics] = useState<ClinicListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and geolocation states
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [ownerCoords, setOwnerCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // Search parameters applied when Search is clicked
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedLocation, setAppliedLocation] = useState('');
  const [searchCoords, setSearchCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Fetch owner profile to set default location text and coordinates
  useEffect(() => {
    const fetchOwnerLocation = async () => {
      if (!user?.id) return;
      try {
        const res = await apiFetch(`/api/auth/profile`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.profile) {
            const profile = data.profile;
            
            // Default location text to city or full address
            if (profile.city || profile.address) {
              const displayLoc = profile.city || profile.address;
              setLocationQuery(displayLoc);
              setAppliedLocation(displayLoc);
            }
            
            // Default coordinates to profile location
            if (profile.latitude && profile.longitude) {
              const coords = { lat: Number(profile.latitude), lng: Number(profile.longitude) };
              setOwnerCoords(coords);
              setSearchCoords(coords);
            } else {
              getBrowserGeolocation();
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch owner profile coordinates:', err);
        getBrowserGeolocation();
      }
    };

    const getBrowserGeolocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setOwnerCoords(coords);
            setSearchCoords(coords);
          },
          () => {
            const defaultCoords = { lat: 6.9271, lng: 79.8612 }; // Colombo
            setOwnerCoords(defaultCoords);
            setSearchCoords(defaultCoords);
          }
        );
      } else {
        const defaultCoords = { lat: 6.9271, lng: 79.8612 }; // Colombo
        setOwnerCoords(defaultCoords);
        setSearchCoords(defaultCoords);
      }
    };

    fetchOwnerLocation();
  }, [user?.id]);

  // Load clinics and geocode their addresses in background
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiFetch('/api/clinics');
        if (!res.ok) throw new Error('Failed to fetch clinics');
        const data = await res.json();
        if (data && Array.isArray(data.clinics)) {
          const parsedClinics = data.clinics.map((clinic: any) => {
            const { leadVet, team, specialties } = parseClinicDescription(clinic.description || '');
            const parsedDoctors = [leadVet, ...team].map(formatDoctorName).filter(Boolean);
            
            return {
              ...clinic,
              description: getRawDescription(clinic.description || ''),
              doctors: clinic.doctors && clinic.doctors.length ? clinic.doctors : parsedDoctors,
              specializations: clinic.specializations && clinic.specializations.length ? clinic.specializations : specialties,
            };
          });

          // Fetch coordinates for clinics dynamically in background with robust fallbacks
          const geocoded = await Promise.all(
            parsedClinics.map(async (clinic: any) => {
              let coords = null;
              if (clinic.address) {
                coords = await geocodeAddressOSM(clinic.address);
                
                // Fallback 1: Try splitting by commas and ignoring the specific first part (e.g. room/house number)
                if (!coords) {
                  const parts = clinic.address.split(',');
                  if (parts.length > 1) {
                    const partialAddress = parts.slice(1).join(',').trim();
                    coords = await geocodeAddressOSM(partialAddress);
                  }
                }
                
                // Fallback 2: Try the last two parts of the address
                if (!coords) {
                  const parts = clinic.address.split(',');
                  if (parts.length > 2) {
                    const coarseAddress = parts.slice(-2).join(',').trim();
                    coords = await geocodeAddressOSM(coarseAddress);
                  }
                }

                // Fallback 3: Try the city field
                if (!coords && clinic.city) {
                  coords = await geocodeAddressOSM(clinic.city);
                }

                // Cache the successful fallback under the original address to speed up next loads
                if (coords) {
                  setCachedCoordinates(clinic.address, coords);
                }
              } else if (clinic.city) {
                coords = await geocodeAddressOSM(clinic.city);
              }

              if (coords) {
                return { ...clinic, latitude: coords.lat, longitude: coords.lng };
              }
              return clinic;
            })
          );
          
          setClinics(geocoded);
        }
      } catch (e) {
        console.warn('Load clinics failed', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = async () => {
    setAppliedSearch(searchQuery);
    setAppliedLocation(locationQuery);

    if (locationQuery.trim()) {
      setIsSearchingLocation(true);
      try {
        let coords = await geocodeAddressOSM(locationQuery);
        
        // Fallback for user location queries
        if (!coords) {
          const parts = locationQuery.split(',');
          if (parts.length > 1) {
            const partial = parts.slice(1).join(',').trim();
            coords = await geocodeAddressOSM(partial);
          }
        }
        
        if (!coords) {
          const parts = locationQuery.split(',');
          if (parts.length > 2) {
            const coarse = parts.slice(-2).join(',').trim();
            coords = await geocodeAddressOSM(coarse);
          }
        }

        if (coords) {
          setSearchCoords(coords);
          setCachedCoordinates(locationQuery, coords);
        }
      } catch (err) {
        console.warn('Search location geocoding failed:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    } else {
      setSearchCoords(ownerCoords);
    }
  };

  // Filter and sort clinics using useMemo
  const filteredClinics = useMemo(() => {
    // 1. Calculate distances based on searchCoords
    let processed = clinics.map((clinic) => {
      let distance: number | null = null;
      if (
        searchCoords &&
        clinic.latitude !== undefined &&
        clinic.latitude !== null &&
        clinic.longitude !== undefined &&
        clinic.longitude !== null
      ) {
        distance = calculateHaversineDistance(
          searchCoords.lat,
          searchCoords.lng,
          Number(clinic.latitude),
          Number(clinic.longitude)
        );
      }
      return { ...clinic, distance };
    });

    // 2. Filter by text query
    if (appliedSearch.trim()) {
      const q = appliedSearch.toLowerCase().trim();
      processed = processed.filter(
        (c) =>
          c.clinic_name.toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q) ||
          (c.specializations || []).some((s: string) => s.toLowerCase().includes(q)) ||
          (c.doctors || []).some((d: string) => d.toLowerCase().includes(q))
      );
    }

    // 3. Filter by location search string if coords weren't fetched
    if (appliedLocation.trim() && !searchCoords) {
      const loc = appliedLocation.toLowerCase().trim();
      processed = processed.filter(
        (c) =>
          (c.address || '').toLowerCase().includes(loc) ||
          (c.city || '').toLowerCase().includes(loc)
      );
    }

    // 4. Filter by category specialization (Dogs, Cats, Surgery)
    if (activeFilter !== 'All' && activeFilter !== 'Nearest' && activeFilter !== 'Highest Rated') {
      const filterLower = activeFilter.toLowerCase();
      processed = processed.filter((c) =>
        (c.specializations || []).some((s: string) => s.toLowerCase().includes(filterLower))
      );
    }

    // 5. Apply Sorting based on active filter (Nearest, Highest Rated)
    if (activeFilter === 'Nearest') {
      processed.sort((a, b) => {
        if (a.distance === null || a.distance === undefined) return 1;
        if (b.distance === null || b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    } else if (activeFilter === 'Highest Rated') {
      processed.sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }
        return (b.reviews || 0) - (a.reviews || 0);
      });
    }

    return processed;
  }, [clinics, activeFilter, appliedSearch, appliedLocation, searchCoords, ownerCoords]);

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="relative p-6 overflow-hidden bg-white border shadow-sm dark:bg-slate-900 rounded-2xl sm:p-8 border-slate-200 dark:border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 -translate-y-1/2 rounded-full bg-primary-500/10 blur-3xl translate-x-1/3" />

        <div className="relative z-10 max-w-2xl">
          <h1 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">
            Find the perfect vet clinic for your furry friend
          </h1>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, clinic, or specialization..."
                className="w-full py-2 pl-10 pr-4 text-sm transition-all border outline-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white"
              />
            </div>
            <div className="relative sm:w-48">
              <MapPin className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Location"
                className="w-full py-2 pl-10 pr-4 text-sm transition-all border outline-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={isSearchingLocation}
              className="px-6 py-2 text-sm font-medium text-white transition-colors shadow-sm bg-primary-600 hover:bg-primary-700 rounded-xl shadow-primary-600/20 whitespace-nowrap disabled:opacity-75"
            >
              {isSearchingLocation ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 pb-2 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 px-3 py-2 mr-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Results Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(loading ? [] : (filteredClinics.length ? filteredClinics : [])).map((clinic, index) => (
          <motion.div
            key={clinic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="overflow-hidden transition-all bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800 hover:shadow-md"
          >
              <div className="relative h-48 overflow-hidden">
              <img
                src={clinic.clinic_logo_url || FALLBACK_CARD_IMAGE}
                alt={clinic.clinic_name || 'Clinic'}
                className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
              />
            </div>

            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {clinic.clinic_name}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {clinic.address}
              </p>

              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(clinic.rating || 0)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {clinic.rating ? clinic.rating.toFixed(1) : '0.0'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({clinic.reviews || 0})
                </span>
              </div>

              {/* Clinic Info */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <MapPinIcon className="w-4 h-4 text-primary-500" />
                  <span>{clinic.city || 'Local'}</span>
                  {clinic.distance !== undefined && clinic.distance !== null && (
                    <span className="text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full ml-auto">
                      {clinic.distance.toFixed(1)} km away
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Opening hours: {clinic.opening_hours || 'Not provided'}
                </div>
              </div>

              {/* Specializations */}
              <div className="flex flex-wrap gap-2 mt-4">
                {((clinic as any).specializations || []).map((spec: string) => (
                  <span
                    key={spec}
                    className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2.5 py-1 rounded-full"
                  >
                    {spec}
                  </span>
                ))}
              </div>

              {/* Doctors Team */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Our Team ({(clinic.doctors || []).length})
                </p>
                <div className="space-y-1">
                  {(clinic.doctors || []).map((doctor) => (
                    <p key={doctor} className="text-xs text-slate-500 dark:text-slate-400">
                      • {doctor}
                    </p>
                  ))}
                </div>
              </div>

              <button
                onClick={() => router.push(`/clinic-profile/${clinic.id}${clinic.distance !== undefined && clinic.distance !== null ? `?distance=${clinic.distance}` : ''}`)}
                className="w-full mt-4 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                View Clinic Profile
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}