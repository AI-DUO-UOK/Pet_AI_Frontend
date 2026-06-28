'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GoogleButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  label?: string;
}

export function GoogleButton({ onClick, isLoading = false, label = 'Continue with Google' }: GoogleButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center justify-center gap-3 py-3 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.745 1.055 14.99 0 12 0 7.354 0 3.373 2.736 1.527 6.709l3.739 3.056Z"
          />
          <path
            fill="#4285F4"
            d="M23.818 12.273c0-.818-.073-1.609-.209-2.373H12v4.509h6.627a5.668 5.668 0 0 1-2.463 3.718v3.082h3.973c2.327-2.145 3.682-5.3 3.682-8.936Z"
          />
          <path
            fill="#FBBC05"
            d="M5.266 14.235A7.077 7.077 0 0 1 4.909 12c0-.79.136-1.545.357-2.235L1.527 6.71A11.968 11.968 0 0 0 0 12c0 1.927.455 3.745 1.264 5.373l4.002-3.138Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.245 0 5.973-1.073 7.964-2.918l-3.973-3.082c-1.109.745-2.527 1.191-3.991 1.191-3.045 0-5.627-2.055-6.545-4.818L1.264 17.43C3.11 21.355 7.145 24 12 24Z"
          />
        </svg>
      )}
      <span>{label}</span>
    </motion.button>
  );
}

export default GoogleButton;
