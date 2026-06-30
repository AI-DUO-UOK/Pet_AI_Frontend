'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, CreditCard, LayoutDashboard } from 'lucide-react';

export default function PaymentCancelledPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 text-center bg-white border shadow-xl dark:bg-slate-900 rounded-2xl border-slate-200 dark:border-slate-800"
      >
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
          You have cancelled the payment process. Your appointment slot has not been reserved yet.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => router.back()} // Go back to the clinic profile / booking modal
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-amber-600/10 text-sm"
          >
            <CreditCard className="w-4 h-4" />
            Resume Payment
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all text-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
}
