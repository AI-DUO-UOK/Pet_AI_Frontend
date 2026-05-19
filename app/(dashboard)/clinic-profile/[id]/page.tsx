'use client';

import React, { useState } from 'react';
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

interface Pet {
  id: string;
  name: string;
  type: 'Dog' | 'Cat';
  breed: string;
  age: string;
  imageUrl: string;
}

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
  clinicReviews?: Array<{
    id: string;
    reviewer: string;
    pet: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

const MOCK_CLINICS: Record<string, Clinic> = {
  '1': {
    id: '1',
    clinicName: 'Paws & Claws Veterinary Clinic',
    doctors: ['Dr. Sarah Jenkins', 'Dr. David Martinez', 'Dr. Lisa Wong'],
    specializations: ['Dogs', 'Cats', 'Surgery'],
    rating: 4.9,
    reviews: 128,
    distance: '2.4 km',
    imageUrl: 'https://images.unsplash.com/photo-1631217343661-1d1971f5a196?w=800&h=600&fit=crop',
    operatingHours: 'Mon-Fri: 8am-6pm, Sat: 9am-3pm, Sun: Closed',
    address: '123 Pet Street, New York, NY 10001',
    description:
      'We provide comprehensive veterinary care for both dogs and cats. Our experienced team specializes in general medicine, surgery, and preventive care.',
    phone: '+1 (212) 555-0123',
    email: 'info@pawsclaws.com',
    website: 'www.pawsclaws.com',
    services: [
      'General Checkups',
      'Vaccinations',
      'Surgery',
      'Dental Cleaning',
      'Lab Tests',
      'Microchipping',
      'Grooming',
    ],
    facilities: ['X-Ray', 'Ultrasound', 'Surgery Suite', 'Dental Equipment', 'Laboratory'],
    photos: [
      'https://images.unsplash.com/photo-1631217343661-1d1971f5a196?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1587300411207-f9d9c3a85ae5?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=800&h=600&fit=crop',
    ],
    clinicReviews: [
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
    ],
  },
  '2': {
    id: '2',
    clinicName: 'City Center Animal Hospital',
    doctors: ['Dr. Michael Chen', 'Dr. Anna Rodriguez', 'Dr. James Peterson'],
    specializations: ['Cats Only', 'Internal Medicine', 'Emergency Care'],
    rating: 4.8,
    reviews: 95,
    distance: '3.1 km',
    imageUrl: 'https://images.unsplash.com/photo-1631217343661-1d1971f5a196?w=800&h=600&fit=crop',
    operatingHours: '24/7 Emergency Services',
    address: '456 Animal Ave, New York, NY 10002',
    description:
      'Specializing in feline health care with emergency services available 24/7. Our team has extensive experience with cats of all ages.',
    phone: '+1 (212) 555-0124',
    email: 'emergency@cityanimals.com',
    website: 'www.cityanimals.com',
    services: [
      'Emergency Care',
      'Internal Medicine',
      'Feline Behavior',
      'Surgery',
      'Hospitalization',
      'IV Therapy',
      'Blood Transfusions',
    ],
    facilities: ['Emergency Ward', 'ICU', 'Surgery Suite', 'Laboratory', '24hr Monitoring'],
    photos: [
      'https://images.unsplash.com/photo-1631217343661-1d1971f5a196?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1587300411207-f9d9c3a85ae5?w=800&h=600&fit=crop',
    ],
    clinicReviews: [
      {
        id: '3',
        reviewer: 'Mike Johnson',
        pet: 'Whiskers (Siamese)',
        rating: 5,
        comment: 'Emergency service saved my cat. Very experienced team!',
        date: '2024-03-10',
      },
    ],
  },
  '3': {
    id: '3',
    clinicName: 'Happy Tails Vet Care',
    doctors: ['Dr. Emily Rodriguez', 'Dr. Robert Chen', 'Dr. Sarah Kim'],
    specializations: ['Dogs', 'Dermatology', 'Behavior'],
    rating: 4.7,
    reviews: 210,
    distance: '5.0 km',
    imageUrl: 'https://images.unsplash.com/photo-1631217343661-1d1971f5a196?w=800&h=600&fit=crop',
    operatingHours: 'Mon-Sat: 8am-5pm, Sun: 10am-2pm',
    address: '789 Vet Lane, New York, NY 10003',
    description:
      'Focused on dog health with special expertise in dermatology and behavioral issues. Compassionate care for your beloved pets.',
    phone: '+1 (212) 555-0125',
    email: 'happy@happytails.com',
    website: 'www.happytails.com',
    services: [
      'General Care',
      'Dermatology',
      'Behavioral Counseling',
      'Allergy Testing',
      'Grooming',
      'Training',
      'Nutrition Consultation',
    ],
    facilities: ['Dermatology Lab', 'Training Area', 'Grooming Suite', 'Outdoor Play Area'],
    photos: [
      'https://images.unsplash.com/photo-1631217343661-1d1971f5a196?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1587300411207-f9d9c3a85ae5?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=800&h=600&fit=crop',
    ],
    clinicReviews: [
      {
        id: '4',
        reviewer: 'Emily Adams',
        pet: 'Buddy (Labrador)',
        rating: 5,
        comment: 'Dr. Rodriguez helped with my dog skin issue. Great results!',
        date: '2024-03-05',
      },
      {
        id: '5',
        reviewer: 'David Lee',
        pet: 'Rex (German Shepherd)',
        rating: 4,
        comment: 'Good service and very friendly staff.',
        date: '2024-02-20',
      },
    ],
  },
};

const MOCK_USER_PETS: Pet[] = [
  {
    id: '1',
    name: 'Max',
    type: 'Dog',
    breed: 'Golden Retriever',
    age: '3 years',
    imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop',
  },
  {
    id: '2',
    name: 'Luna',
    type: 'Cat',
    breed: 'British Shorthair',
    age: '2 years',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop',
  },
];

export default function ClinicProfile() {
  const router = useRouter();
  const params = useParams();
  const clinicId = params.id as string;

  const clinic = MOCK_CLINICS[clinicId as keyof typeof MOCK_CLINICS];
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [channelForm, setChannelForm] = useState({
    date: '',
    time: '',
    serviceType: '',
    notes: '',
  });

  if (!clinic) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500 dark:text-slate-400">Clinic not found</p>
      </div>
    );
  }

  const handleChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Channelling booked:', {
      clinic: clinic.clinicName,
      pet: selectedPet?.name,
      ...channelForm,
    });
    // Here you would call your backend API
    alert(`Successfully booked appointment for ${selectedPet?.name} at ${clinic.clinicName}!`);
    setShowChannelModal(false);
    setSelectedPet(null);
    setChannelForm({ date: '', time: '', serviceType: '', notes: '' });
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {clinic.clinicName}
        </h1>
      </div>

      {/* Photo Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <img
            src={clinic.imageUrl}
            alt={clinic.clinicName}
            className="w-full h-80 object-cover rounded-2xl shadow-md"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 md:col-span-1 md:grid-cols-1">
          {clinic.photos?.slice(1).map((photo, idx) => (
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rating */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Rating</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {clinic.rating}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {clinic.reviews} reviews
          </p>
        </div>

        {/* Distance */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
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
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
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
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl p-4 font-bold transition-colors flex flex-col items-center justify-center gap-2 shadow-sm shadow-primary-600/20"
        >
          <Calendar className="w-5 h-5" />
          Channel Now
        </button>
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">About</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{clinic.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Contact</h3>
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
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Facilities</h3>
            <div className="flex flex-wrap gap-2">
              {clinic.facilities?.map((facility) => (
                <span
                  key={facility}
                  className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full font-medium"
                >
                  {facility}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Services & Team */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Services
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {clinic.services?.map((service) => (
              <div
                key={service}
                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <p className="text-sm font-medium text-slate-900 dark:text-white">{service}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Our Team
          </h2>
          <div className="space-y-3">
            {clinic.doctors.map((doctor) => (
              <div
                key={doctor}
                className="p-3 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 rounded-lg border border-primary-200 dark:border-primary-800"
              >
                <p className="font-semibold text-slate-900 dark:text-white">{doctor}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Specialist in: {clinic.specializations.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clinic Reviews */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Client Reviews
        </h2>
        <div className="space-y-4">
          {clinic.clinicReviews?.map((review) => (
            <div
              key={review.id}
              className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
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
              <p className="text-sm text-slate-700 dark:text-slate-300">{review.comment}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{review.date}</p>
            </div>
          ))}
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
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Channel {clinic.clinicName}
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
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Select Your Pet *
                  </label>
                  {selectedPet ? (
                    <div className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                      <img
                        src={selectedPet.imageUrl}
                        alt={selectedPet.name}
                        className="w-12 h-12 rounded-lg object-cover"
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
                    <div className="grid grid-cols-2 gap-3">
                      {MOCK_USER_PETS.map((pet) => (
                        <button
                          key={pet.id}
                          type="button"
                          onClick={() => setSelectedPet(pet)}
                          className="p-3 border-2 rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-left"
                        >
                          <img
                            src={pet.imageUrl}
                            alt={pet.name}
                            className="w-full h-20 object-cover rounded mb-2"
                          />
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">
                            {pet.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {pet.breed}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedPet && (
                  <>
                    {/* Service Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                        {clinic.services?.map((service) => (
                          <option key={service} value={service}>
                            {service}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {channelForm.notes.length}/300
                      </p>
                    </div>

                    {/* Alert */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-3">
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
                    disabled={!selectedPet || !channelForm.date || !channelForm.time || !channelForm.serviceType}
                    className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Book Appointment
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
