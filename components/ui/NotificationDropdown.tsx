'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bell, Syringe, AlertTriangle, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at?: string;
  is_read?: boolean;
  metadata?: Record<string, any>;
};

const ICON_BY_TYPE: Record<string, { icon: any; color: string; bg: string }> = {
  vaccine: { icon: Syringe, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/20' },
  alert: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/20' },
  appointment: { icon: Calendar, color: 'text-primary-500', bg: 'bg-primary-100 dark:bg-primary-500/20' },
  appointment_status: { icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
  clinic_approval: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
  clinic_rejection: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/20' },
};

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8000/api/auth/notifications?limit=10`);
        if (!res.ok) return;
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (e) {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const formatTimeAgo = (createdAt?: string) => {
    if (!createdAt) return '';
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    try {
      await fetch('http://localhost:8000/api/auth/notifications/read-all', {
        method: 'POST',
      });
    } catch (e) {
      // ignore network issues; UI already updated
    }
  };

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
              {loading ? (
                <div className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-sm text-slate-500 dark:text-slate-400">No notifications yet.</div>
              ) : notifications.map((notif) => {
                const iconConfig = ICON_BY_TYPE[notif.type] || ICON_BY_TYPE.appointment;
                const Icon = iconConfig.icon;
                return (
                  <div
                    key={notif.id}
                    className={`flex gap-3 p-4 transition-colors border-b cursor-pointer border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${notif.is_read ? 'opacity-70' : ''}`}
                  >
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconConfig.bg} ${iconConfig.color}`}
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
                        {formatTimeAgo(notif.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 text-center border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20">
              <button onClick={markAllAsRead} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                Mark all as read
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
