'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Search, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationDropdown } from '../ui/NotificationDropdown';

interface TopNavbarProps {
  onMenuClick: () => void;
}

function getInitials(name?: string): string {
  if (!name) return 'US';
  const cleanName = name.trim();
  if (!cleanName) return 'US';
  const parts = cleanName.split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0][0] || '';
    const second = parts[parts.length - 1][0] || '';
    return (first + second).toUpperCase();
  }
  return cleanName.slice(0, Math.min(2, cleanName.length)).toUpperCase();
}

export function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, role } = useAuth();

  const isVerified = role === 'clinic' && user?.verificationStatus === 'approved';
  const displayName = role === 'clinic' ? (user?.clinicName || user?.name) : user?.name?.split(' ')[0];

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center max-w-md w-full relative">
          <Search className="w-4 h-4 absolute left-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search pets, vets or records..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900/30 rounded-lg text-sm transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>

        <NotificationDropdown />

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 sm:mx-2" />

        <Link
          href={role === 'clinic' ? '/clinic/profile' : '/profile'}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center text-xs font-semibold border border-slate-200 dark:border-slate-700">
              {getInitials(user?.name)}
            </div>
          )}

          <span className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            {displayName || 'User'}
            {isVerified && (
              <span className="group relative inline-flex items-center">
                <CheckCircle2 className="w-4 h-4 text-green-500 fill-green-500/10" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg pointer-events-none">
                  <span className="font-semibold">Verified Clinic ✅</span>
                  <br />
                  Your clinic is now visible to pet owners and all features are unlocked.
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                </span>
              </span>
            )}
          </span>
        </Link>
      </div>
    </header>
  );
}
