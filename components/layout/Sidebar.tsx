'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Dog,
  Bot,
  Search,
  Users,
  UserCircle,
  LogOut,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { role, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const ownerLinks = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/my-pets', icon: Dog, label: 'My Pets' },
    { href: '/ai-assistant', icon: Bot, label: 'AI Assistant' },
    { href: '/find-vets', icon: Search, label: 'Find a Vet' },
  ];

  const vetLinks = [
    { href: '/clinic/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/clinic/patients', icon: Users, label: 'Clinic Patients' },
    { href: '/clinic/profile', icon: UserCircle, label: 'Clinic Profile' },
  ];

  const links = role === 'clinic' ? vetLinks : ownerLinks;
  const handleClose = () => setIsOpen(false);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={handleClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xl font-bold text-primary-600 dark:text-primary-400">
            <Dog className="w-6 h-6" />
            <span>Dr. Paw</span>
          </div>
          <button
            onClick={handleClose}
            className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 px-3 py-2 mb-4 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <div
              className={`w-2 h-2 rounded-full ${
                role === 'clinic' ? 'bg-secondary-500' : 'bg-primary-500'
              }`}
            />
            Logged in as {role === 'clinic' ? 'Clinic' : 'Pet Owner'}
          </div>
          <button
            onClick={() => {
              logout();
              router.push('/auth/login');
            }}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
