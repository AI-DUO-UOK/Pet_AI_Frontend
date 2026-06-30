'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Calendar, LayoutDashboard, Download } from 'lucide-react';

/**
 * /payment/success
 *
 * Stripe redirects here after a successful payment with:
 *   ?session_id={CHECKOUT_SESSION_ID}
 *
 * TODO: Use the session_id to:
 *   1. GET /api/payments/{session_id} → fetch appointment + payment details
 *   2. Display real Appointment ID, Transaction ID, Clinic, Doctor, Amount
 *   3. Trigger a PDF receipt download from GET /api/payments/{payment_id}/receipt
 *
 * Currently uses mock data as a placeholder.
 */

interface AppointmentDetails {
  appointmentId: string;
  transactionId: string;
  clinicName: string;
  doctorName: string;
  service: string;
  amount: string;
}

// ─── Inner component: uses useSearchParams() safely inside <Suspense> ───────
function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const petId = searchParams.get('pet_id');
  
  const [details, setDetails] = useState<AppointmentDetails | null>(null);

  useEffect(() => {
    // Generate stable details only on the client side to avoid hydration mismatch
    setDetails({
      appointmentId: `APT-${Math.floor(1000 + Math.random() * 9000)}`,
      transactionId: sessionId || `mock_cs_${Math.random().toString(36).substring(2, 10)}`,
      clinicName: 'Channel VetCare',
      doctorName: 'Dr. Silva',
      service: 'General Checkup',
      amount: 'LKR 2,650.00',
    });
  }, [sessionId]);

  const handleDownloadReceipt = () => {
    if (!details) return;
    const receiptText = `=========================================
              PETPULSE RECEIPT            
=========================================
Date: ${new Date().toLocaleDateString()}
Appointment ID: ${details.appointmentId}
Transaction ID: ${details.transactionId}
-----------------------------------------
Clinic: ${details.clinicName}
Doctor: ${details.doctorName}
Service: ${details.service}
-----------------------------------------
Consultation Fee: LKR 2,500.00
Platform Fee:     LKR 150.00
Tax:              LKR 0.00
=========================================
Total Amount Paid: LKR 2,650.00
=========================================
Thank you for using PetPULSE!
`;
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt_${details.appointmentId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!details) {
    return <PaymentSuccessSkeleton />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 text-center"
      >
        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2 className="w-16 h-16" />
          </motion.div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          Payment Successful!
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
          Appointment Confirmed
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-8">
          A confirmation email and receipt have been sent to you.
        </p>

        {/* Transaction details */}
        <div className="p-4 mb-6 text-left rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
          {[
            { label: 'Appointment ID', value: details.appointmentId, mono: false },
            { label: 'Transaction ID', value: details.transactionId, mono: true },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">{label}</span>
              <span className={`font-semibold text-slate-800 dark:text-slate-200 ${mono ? 'font-mono text-[11px] break-all' : ''}`}>
                {value}
              </span>
            </div>
          ))}

          <div className="h-px bg-slate-200 dark:bg-slate-700" />

          {[
            { label: 'Clinic', value: details.clinicName },
            { label: 'Doctor', value: details.doctorName },
            { label: 'Service', value: details.service },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">{label}</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{value}</span>
            </div>
          ))}

          <div className="h-px bg-slate-200 dark:bg-slate-700" />

          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Amount Paid</span>
            <span className="font-bold text-slate-900 dark:text-white">{details.amount}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Download Receipt */}
          <button
            onClick={handleDownloadReceipt}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-primary-600/10 text-sm"
          >
            <Download className="w-4 h-4" />
            Download Receipt
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push(petId ? `/my-pets/${petId}` : '/dashboard')}
              className="flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all text-sm"
            >
              <Calendar className="w-4 h-4" />
              View Booking
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all text-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Loading skeleton shown while searchParams resolves ───────────────────────
function PaymentSuccessSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 animate-pulse">
        <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-6" />
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-48 mx-auto mb-3" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mx-auto mb-8" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── Page export: wraps inner component in <Suspense> ─────────────────────────
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessSkeleton />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
