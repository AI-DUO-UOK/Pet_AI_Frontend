'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Calendar, FileText, LayoutDashboard } from 'lucide-react';

export default function PaymentSuccessPage() {
  const router = useRouter();

  // TODO: Fetch actual appointment/transaction details using Stripe session_id from URL query params
  const mockDetails = {
    appointmentNumber: 'PP-2026-8942',
    paymentId: 'pay_M1x89Fk27a9s',
    transactionId: 'ch_3Mxs92Lkd90sja',
    clinicName: 'VetCare Animal Hospital',
    doctorName: 'Dr. Sarah Jenkins',
    amount: 'LKR 4,500.00',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 text-center bg-white border shadow-xl dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800"
      >
        {/* Success Icon Animation */}
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

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Payment Successful!
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Your appointment has been confirmed. A confirmation email and receipt have been sent to you.
        </p>

        {/* Transaction Details */}
        <div className="p-4 mb-8 text-left rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Appointment No.</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{mockDetails.appointmentNumber}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Transaction ID</span>
            <span className="font-mono text-slate-800 dark:text-slate-200">{mockDetails.transactionId}</span>
          </div>
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" />
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Clinic</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{mockDetails.clinicName}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Doctor</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{mockDetails.doctorName}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Amount Paid</span>
            <span className="font-bold text-slate-900 dark:text-white">{mockDetails.amount}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => {}} // TODO: Trigger PDF receipt download or modal
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-primary-600/10 text-sm"
          >
            <FileText className="w-4 h-4" />
            Download Receipt
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/appointments')} // TODO: Route to user's appointments list
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
