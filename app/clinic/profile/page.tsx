'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Phone,
  MapPin,
  Clock,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Star,
  X,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ClinicProfile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [operatingHours, setOperatingHours] = useState({ mon_fri: '', sat: '', sun: '' });
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');

  const isVerified = user?.verificationStatus === 'approved';
  const isPending = user?.verificationStatus === 'pending';

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('clinicProfileData');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setClinicName(data.clinicName || '');
        setContactNumber(data.contactNumber || '');
        setLocation(data.location || '');
        setDescription(data.description || '');
        setOperatingHours(data.operatingHours || { mon_fri: '', sat: '', sun: '' });
        setServices(data.services || []);
      } catch (e) {
        initializeDefaults();
      }
    } else {
      initializeDefaults();
    }
  }, []);

  const initializeDefaults = () => {
    setClinicName(user?.clinicName || 'Mavi');
    setContactNumber('+94 71 234 5678');
    setLocation('Colombo, Sri Lanka');
    setDescription('Full-service veterinary clinic specializing in small animals. We offer preventive care, surgical procedures, dental services, and emergency care. Our team is dedicated to providing high-quality care for your beloved pets.');
    setOperatingHours({ mon_fri: '9:00 AM - 6:00 PM', sat: '9:00 AM - 4:00 PM', sun: '10:00 AM - 2:00 PM' });
    setServices(['General Check-ups', 'Vaccinations', 'Dental Care', 'Surgery', 'Emergency Care', 'Grooming']);
  };

  const handleSave = () => {
    const data = { clinicName, contactNumber, location, description, operatingHours, services };
    localStorage.setItem('clinicProfileData', JSON.stringify(data));
    setIsEditing(false);
  };

  const addService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService('');
    }
  };

  const removeService = (service: string) => {
    setServices(services.filter(s => s !== service));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Clinic Profile
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage your clinic information and services.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-4 py-2 font-medium text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700"
        >
          <Edit2 className="w-4 h-4" />
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </motion.button>
      </div>

      {/* Verification Status */}
      <div className="p-6 bg-white border dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800">
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
          Verification Status
        </h2>
        <div className="flex items-center gap-4">
          {isVerified && (
            <>
              <div className="p-3 bg-green-100 rounded-lg dark:bg-green-900/30">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-green-700 dark:text-green-400">
                  Verified Clinic ✅
                </p>
                <p className="text-sm text-green-600 dark:text-green-500">
                  Your clinic is visible to pet owners
                </p>
              </div>
            </>
          )}
          {isPending && (
            <>
              <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                  Pending Verification ⏳
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  Your clinic is under review (24-48 hours)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Clinic Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-white border dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800"
      >
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Clinic Information
          </h2>
        </div>

        {!isEditing ? (
          <div className="space-y-5">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Clinic Name
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {clinicName || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Email
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {user?.email || 'Not provided'}
                </p>
              </div>
            </div>

            <div className="grid gap-6 pt-5 border-t sm:grid-cols-2 border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Contact Number
                  </p>
                  <p className="text-slate-900 dark:text-white">
                    {contactNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Location
                  </p>
                  <p className="text-slate-900 dark:text-white">
                    {location}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
              <p className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                Description
              </p>
              <p className="leading-relaxed text-slate-900 dark:text-white">
                {description}
              </p>
            </div>

            <div className="flex items-start gap-3 pt-5 border-t border-slate-200 dark:border-slate-800">
              <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Operating Hours
                </p>
                <div className="space-y-1 text-slate-900 dark:text-white">
                  <p>Mon - Fri: {operatingHours.mon_fri}</p>
                  <p>Sat: {operatingHours.sat}</p>
                  <p>Sun: {operatingHours.sun}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                Clinic Name
              </label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                Contact Number
              </label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                Operating Hours
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block mb-1 text-xs text-slate-600 dark:text-slate-400">
                    Mon - Fri
                  </label>
                  <input
                    type="text"
                    placeholder="9:00 AM - 6:00 PM"
                    value={operatingHours.mon_fri}
                    onChange={(e) => setOperatingHours({ ...operatingHours, mon_fri: e.target.value })}
                    className="w-full px-3 py-2 text-sm transition-all border rounded-lg outline-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500/20 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs text-slate-600 dark:text-slate-400">
                    Saturday
                  </label>
                  <input
                    type="text"
                    placeholder="9:00 AM - 4:00 PM"
                    value={operatingHours.sat}
                    onChange={(e) => setOperatingHours({ ...operatingHours, sat: e.target.value })}
                    className="w-full px-3 py-2 text-sm transition-all border rounded-lg outline-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500/20 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs text-slate-600 dark:text-slate-400">
                    Sunday
                  </label>
                  <input
                    type="text"
                    placeholder="10:00 AM - 2:00 PM"
                    value={operatingHours.sun}
                    onChange={(e) => setOperatingHours({ ...operatingHours, sun: e.target.value })}
                    className="w-full px-3 py-2 text-sm transition-all border rounded-lg outline-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500/20 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Services Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 bg-white border dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Services Offered
          </h2>
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Done Editing
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((service) => (
              <div
                key={service}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
              >
                <CheckCircle2 className="flex-shrink-0 w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-slate-700 dark:text-slate-300">{service}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <motion.div
                  key={service}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                >
                  <span className="text-slate-700 dark:text-slate-300">{service}</span>
                  <button
                    onClick={() => removeService(service)}
                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                    title="Remove service"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <input
                type="text"
                placeholder="Enter new service..."
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addService()}
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white text-sm"
              />
              <button
                onClick={addService}
                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Reviews Section - Only if verified */}
      {isVerified && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-white border dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800"
        >
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
            Recent Reviews
          </h2>
          <div className="space-y-4">
            {[
              {
                name: 'Sarah Jenkins',
                rating: 5,
                text: 'Excellent service! Dr. Paw team was very professional and caring.',
              },
              {
                name: 'Mike Thompson',
                rating: 5,
                text: 'Highly recommend. My cat received great care.',
              },
            ].map((review, idx) => (
              <div
                key={idx}
                className="pb-4 border-b border-slate-200 dark:border-slate-800 last:border-b-0"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {review.name}
                  </p>
                  <div className="flex gap-1">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  {review.text}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
