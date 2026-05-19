'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bell, Syringe, AlertTriangle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'vaccine',
    title: 'Vaccination Due',
    message: 'Max is due for Rabies booster next week.',
    time: '2 hours ago',
    icon: Syringe,
    color: 'text-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-500/20',
  },
  {
    id: 2,
    type: 'alert',
    title: 'Health Alert',
    message: 'Luna has been reported lethargic. Consider an AI checkup.',
    time: '1 day ago',
    icon: AlertTriangle,
    color: 'text-red-500',
    bg: 'bg-red-100 dark:bg-red-500/20',
  },
  {
    id: 3,
    type: 'appointment',
    title: 'Appointment Confirmed',
    message: 'Checkup with Dr. Smith tomorrow at 10:00 AM.',
    time: '2 days ago',
    icon: Calendar,
    color: 'text-primary-500',
    bg: 'bg-primary-100 dark:bg-primary-500/20',
  },
];

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = MOCK_NOTIFICATIONS.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 transition-colors rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 z-50 mt-2 overflow-hidden bg-white border shadow-lg w-80 dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Notifications
              </h3>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                {unreadCount} New
              </span>
            </div>

            <div className="overflow-y-auto max-h-96">
              {MOCK_NOTIFICATIONS.map((notif) => {
                const Icon = notif.icon;
                return (
                  <div
                    key={notif.id}
                    className="flex gap-3 p-4 transition-colors border-b cursor-pointer border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${notif.bg} ${notif.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {notif.title}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        {notif.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 text-center border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20">
              <button className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                Mark all as read
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
