'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * /payment/loading
 *
 * Shown while the frontend is waiting for the Stripe Checkout Session
 * to be created by the backend. In production this page will be displayed
 * very briefly before window.location.href redirects to Stripe.
 *
 * TODO: When Stripe is integrated, createCheckoutSession() in lib/payment.ts
 * will redirect away from this page automatically.
 */
export default function PaymentLoadingPage() {
  // Pulse animation dots
  const dots = [0, 1, 2];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-8 max-w-sm w-full text-center"
      >
        {/* Animated ring */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
          {/* Inner pulsing dot */}
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"
          >
            <span className="text-primary-600 dark:text-primary-400 font-black text-xs tracking-tight">
              PAY
            </span>
          </motion.div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Preparing your secure payment
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            We're securely connecting to our payment provider.
            <br />
            Please do not close this page.
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-2">
          {dots.map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Security note */}
        <p className="text-xs text-slate-400 dark:text-slate-500">
          🔒 256-bit SSL encrypted · Powered by Stripe
        </p>
      </motion.div>
    </div>
  );
}
