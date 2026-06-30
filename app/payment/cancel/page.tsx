'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, CreditCard, LayoutDashboard, ArrowLeft } from 'lucide-react';

/**
 * /payment/cancel
 *
 * Stripe redirects here when the user clicks "Cancel" or closes the
 * Stripe Hosted Checkout page without completing payment.
 *
 * The appointment has NOT been created at this point — that only
 * happens after the Stripe webhook confirms the payment.
 *
 * TODO: Optionally read ?session_id= from URL to log cancellation
 *       or present the user with their previous booking details so
 *       they can retry.
 */
export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 text-center"
      >
        {/* Warning icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="p-4 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
          >
            <AlertCircle className="w-16 h-16" />
          </motion.div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Payment Cancelled
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          You cancelled the payment process. Your appointment slot has{' '}
          <strong className="text-slate-700 dark:text-slate-300">not</strong> been reserved yet.
          <br />
          You can return to the clinic and try again at any time.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          {/* Resume / Try again */}
          <button
            onClick={() => router.back()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all shadow-md shadow-amber-500/20 text-sm"
          >
            <CreditCard className="w-4 h-4" />
            Resume Payment
          </button>

          <div className="grid grid-cols-2 gap-3">
            {/* Go back to find vets */}
            <button
              onClick={() => router.push('/find-vets')}
              className="flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Find Vets
            </button>

            {/* Dashboard */}
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
