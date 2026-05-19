'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function ClinicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, isAuthenticated } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Loading state during hydration
  if (!isHydrated) {
    return <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950" />;
  }

  // Redirect if not clinic
  if (!isAuthenticated || role !== 'clinic') {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <p className="mb-4 text-slate-600 dark:text-slate-400">
            Access denied. Please login as a clinic.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-4 py-2 font-medium text-white rounded-lg bg-primary-600 hover:bg-primary-700"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
