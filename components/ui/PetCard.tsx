'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

interface PetCardProps {
  id: string;
  name: string;
  type: 'Dog' | 'Cat';
  breed: string;
  age: string;
  imageUrl: string;
  nextVaccine?: string;
}

export function PetCard({
  id,
  name,
  type,
  breed,
  age,
  imageUrl,
  nextVaccine,
}: PetCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
    >
      <div className="h-48 overflow-hidden relative">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />

        <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm flex items-center gap-1">
          {type === 'Dog' ? '🐶' : '🐱'} {type}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {name}
          </h3>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {breed} • {age}
        </p>

        <div className="mt-auto space-y-3">
          {nextVaccine && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg">
              <Calendar className="w-3.5 h-3.5" />
              <span>Next vaccine: {nextVaccine}</span>
            </div>
          )}

          <Link
            href={`/my-pets/${id}`}
            className="block w-full py-2 text-center text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 dark:text-primary-400 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 rounded-lg transition-colors"
          >
            View Profile
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
