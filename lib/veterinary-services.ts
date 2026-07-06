/**
 * VETERINARY_SERVICES — Hardcoded service list with prices (LKR).
 *
 * These are temporary fixed prices until clinics can manage their own
 * service catalog with individual pricing in the database.
 *
 * TODO: Replace with a dynamic fetch from /api/clinics/{id}/services
 *       once the backend supports per-clinic service pricing.
 */

export interface VeterinaryService {
  name: string;
  price: number; // in LKR
  description?: string;
}

export const VETERINARY_SERVICES: VeterinaryService[] = [
  {
    name: 'General Consultation',
    price: 2500,
    description: 'Routine physical examination and health assessment',
  },
  {
    name: 'Vaccination',
    price: 2000,
    description: 'Standard vaccination shots and boosters',
  },
  {
    name: 'Follow-up Consultation',
    price: 1500,
    description: 'Review of progress or treatment adjustments',
  },
  {
    name: 'Puppy / Kitten Health Check',
    price: 2000,
    description: 'Early development health assessment and guidance',
  },
  {
    name: 'Skin & Allergy Consultation',
    price: 3000,
    description: 'Dermatological evaluation for allergies and infections',
  },
  {
    name: 'Eye & Ear Consultation',
    price: 3000,
    description: 'Detailed examination for vision, ocular or hearing issues',
  },
  {
    name: 'Dental Consultation',
    price: 3000,
    description: 'Oral health examination and dental cleaning assessment',
  },
  {
    name: 'Deworming & Preventive Care',
    price: 1800,
    description: 'Parasite control treatment and wellness care',
  },
  {
    name: 'Grooming',
    price: 2500,
    description: 'Full grooming session including bath and trim',
  },
];

/** Fixed platform fee charged on every booking (LKR) */
export const PLATFORM_FEE = 150;

/** Tax amount — zero for now; update when applicable */
export const TAX = 0;

/**
 * Look up the consultation fee for a service by name.
 * Returns 0 if the service is not found in the hardcoded list.
 */
export function getServicePrice(serviceName: string): number {
  if (!serviceName) return 0;
  const match = VETERINARY_SERVICES.find(
    (s) => s.name.toLowerCase() === serviceName.toLowerCase()
  );
  return match ? match.price : 0;
}

/**
 * Calculate the grand total from consultation fee + platform fee + tax.
 */
export function calculateTotal(consultationFee: number): number {
  return consultationFee + PLATFORM_FEE + TAX;
}

/**
 * Format a number as a LKR currency string.
 * e.g. 2500 → "LKR 2,500.00"
 */
export function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
