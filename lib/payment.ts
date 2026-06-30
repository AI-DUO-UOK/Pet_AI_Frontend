import { apiFetch } from './api';

/**
 * Data needed to create a Stripe Checkout Session.
 * Passed from the frontend booking modal to the backend.
 */
export interface CheckoutPayload {
  /** Internal clinic UUID */
  clinic_id: string;
  /** Name of the clinic (for display on Stripe hosted page) */
  clinic_name: string;
  /** Internal pet UUID */
  pet_id: string;
  /** Display name of the pet */
  pet_name: string;
  /** Owner's user UUID */
  owner_id: string;
  /** Service chosen by the user, e.g. "General Checkup" */
  service_name: string;
  /** Consultation fee in LKR (integer, e.g. 2500) */
  consultation_fee: number;
  /** Platform fee in LKR (integer, e.g. 150) */
  platform_fee: number;
  /** Tax in LKR (integer, 0 for now) */
  tax: number;
  /** Grand total in LKR */
  total_amount: number;
  /** ISO date string, e.g. "2026-07-15" */
  appointment_date: string;
  /** Time string, e.g. "10:30" */
  appointment_time: string;
  /** Optional additional notes */
  notes?: string;
  /** Doctor's name (first in the list) */
  doctor_name?: string;
}

/**
 * Response from POST /api/payments/create-checkout-session
 * In production this will contain the Stripe Checkout URL.
 */
export interface CheckoutSessionResponse {
  checkout_url: string;
  session_id?: string;
}

/**
 * createCheckoutSession — Initiates the Stripe payment flow.
 *
 *  1. POSTs the appointment payload to POST /api/payments/create-checkout-session
 *  2. The backend creates a stripe.checkout.Session and returns { checkout_url }
 *  3. The frontend redirects: window.location.href = checkout_url
 *  4. Stripe hosts the card/GPay/ApplePay UI
 *  5. After payment Stripe redirects to /payment/success?session_id=xxx
 *  6. Stripe webhook fires → backend creates appointment + marks payment paid
 */
export async function createCheckoutSession(
  payload: CheckoutPayload
): Promise<CheckoutSessionResponse> {
  const response = await apiFetch('/api/payments/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.checkout_url) {
    throw new Error(data.detail || 'Failed to create checkout session');
  }

  // Redirect to Stripe Hosted Checkout.
  // The browser will navigate away — code below this line will not execute.
  window.location.href = data.checkout_url;

  // Returned for TypeScript type-safety only; never reached in practice.
  return data;
}
