'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Star, Filter, MapPinIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_CLINICS = [
  {
    id: '1',
    clinicName: 'Paws & Claws Veterinary Clinic',
    doctors: ['Dr. Sarah Jenkins', 'Dr. David Martinez', 'Dr. Lisa Wong'],
    specializations: ['Dogs', 'Cats', 'Surgery'],
    rating: 4.9,
    reviews: 128,
    distance: '2.4 km',
    imageUrl: 'https://images.unsplash.com/photo-1631217343661-1d1971f5a196?w=400&h=400&fit=crop',
    operatingHours: 'Mon-Fri: 8am-6pm, Sat: 9am-3pm',
    address: '123 Pet Street, New York, NY',
  },
  {
    id: '2',
    clinicName: 'City Center Animal Hospital',
    doctors: ['Dr. Michael Chen', 'Dr. Anna Rodriguez', 'Dr. James Peterson'],
    specializations: ['Cats Only', 'Internal Medicine', 'Emergency Care'],
    rating: 4.8,
    reviews: 95,
    distance: '3.1 km',
    imageUrl: 'https://images.unsplash.com/photo-1631217343661-1d1971f5a196?w=400&h=400&fit=crop',
    operatingHours: '24/7 Emergency',
    address: '456 Animal Ave, New York, NY',
  },
  {
    id: '3',
    clinicName: 'Happy Tails Vet Care',
    doctors: ['Dr. Emily Rodriguez', 'Dr. Robert Chen', 'Dr. Sarah Kim'],
    specializations: ['Dogs', 'Dermatology', 'Behavior'],
    rating: 4.7,
    reviews: 210,
    distance: '5.0 km',
    imageUrl: 'https://images.unsplash.com/photo-1631217343661-1d1971f5a196?w=400&h=400&fit=crop',
    operatingHours: 'Mon-Sat: 8am-5pm, Sun: 10am-2pm',
    address: '789 Vet Lane, New York, NY',
  },
];

export default function FindVets() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Dogs', 'Cats', 'Surgery', 'Highest Rated'];

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
              <Search className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, clinic, or specialization..."
                className="w-full py-3 pl-10 pr-4 transition-all border outline-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white"
              />
            </div>
            <div className="relative sm:w-48">
              <MapPin className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Location"
                defaultValue="New York, NY"
                className="w-full py-3 pl-10 pr-4 transition-all border outline-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white"
              />
            </div>
            <button className="px-6 py-3 font-medium text-white transition-colors shadow-sm bg-primary-600 hover:bg-primary-700 rounded-xl shadow-primary-600/20 whitespace-nowrap">
              Search
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
        {MOCK_CLINICS.map((clinic, index) => (
          <motion.div
            key={clinic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="overflow-hidden transition-all bg-white border shadow-sm dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800 hover:shadow-md"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={clinic.imageUrl}
                alt={clinic.clinicName}
                className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
              />
            </div>

            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {clinic.clinicName}
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
                        i < Math.floor(clinic.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {clinic.rating}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({clinic.reviews})
                </span>
              </div>

              {/* Clinic Info */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <MapPinIcon className="w-4 h-4" />
                  {clinic.distance}
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {clinic.operatingHours}
                </div>
              </div>

              {/* Specializations */}
              <div className="flex flex-wrap gap-2 mt-4">
                {clinic.specializations.map((spec) => (
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
                  Our Team ({clinic.doctors.length})
                </p>
                <div className="space-y-1">
                  {clinic.doctors.map((doctor) => (
                    <p key={doctor} className="text-xs text-slate-500 dark:text-slate-400">
                      • {doctor}
                    </p>
                  ))}
                </div>
              </div>

              <button
                onClick={() => router.push(`/clinic-profile/${clinic.id}`)}
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
