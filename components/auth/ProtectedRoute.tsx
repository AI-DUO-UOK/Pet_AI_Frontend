'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('owner' | 'clinic' | 'admin')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // If authenticated but role is not set, redirect to select-role onboarding
    if (role === null) {
      router.push('/auth/select-role');
      return;
    }

    // Check if role is allowed
    if (allowedRoles && !allowedRoles.includes(role as any)) {
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else if (role === 'clinic') {
        router.push('/clinic/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, role, loading, router, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated || (allowedRoles && !allowedRoles.includes(role as any)) || role === null) {
    return null; // Don't render children while redirecting
  }

  return <>{children}</>;
}

export default ProtectedRoute;
