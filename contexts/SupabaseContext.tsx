'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface SupabaseContextType {
  supabase: SupabaseClient | null;
  isInitialized: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
      );
      setIsInitialized(true);
      return;
    }

    const client = createClient(supabaseUrl, supabaseAnonKey);
    setSupabase(client);
    setIsInitialized(true);
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase, isInitialized }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = (): SupabaseContextType => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider');
  }
  return context;
};

// Helper hooks for common operations
export const useSupabaseAuth = () => {
  const { supabase } = useSupabase();

  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not initialized');
    return supabase.auth.signUp({ email, password });
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not initialized');
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    if (!supabase) throw new Error('Supabase not initialized');
    return supabase.auth.signOut();
  };

  const getSession = async () => {
    if (!supabase) throw new Error('Supabase not initialized');
    return supabase.auth.getSession();
  };

  return { signUp, signIn, signOut, getSession };
};

export const useSupabaseDB = () => {
  const { supabase } = useSupabase();

  const insertUser = async (userData: any) => {
    if (!supabase) throw new Error('Supabase not initialized');
    return supabase.from('auth_users').insert([userData]);
  };

  const getUser = async (userId: string) => {
    if (!supabase) throw new Error('Supabase not initialized');
    return supabase
      .from('auth_users')
      .select('*')
      .eq('id', userId)
      .single();
  };

  const insertPet = async (petData: any) => {
    if (!supabase) throw new Error('Supabase not initialized');
    return supabase.from('pets').insert([petData]);
  };

  const getUserPets = async (userId: string) => {
    if (!supabase) throw new Error('Supabase not initialized');
    return supabase.from('pets').select('*').eq('user_id', userId);
  };

  const insertMedicalRecord = async (recordData: any) => {
    if (!supabase) throw new Error('Supabase not initialized');
    return supabase.from('medical_records').insert([recordData]);
  };

  const getPetMedicalRecords = async (petId: string) => {
    if (!supabase) throw new Error('Supabase not initialized');
    return supabase
      .from('medical_records')
      .select('*')
      .eq('pet_id', petId);
  };

  return {
    insertUser,
    getUser,
    insertPet,
    getUserPets,
    insertMedicalRecord,
    getPetMedicalRecords,
  };
};

export const useSupabaseStorage = () => {
  const { supabase } = useSupabase();

  const uploadPetImage = async (
    userId: string,
    petId: string,
    file: File
  ) => {
    if (!supabase) throw new Error('Supabase not initialized');
    const filePath = `${userId}/${petId}/${Date.now()}-${file.name}`;
    return supabase.storage
      .from('pet-images')
      .upload(filePath, file);
  };

  const getPublicUrl = (bucket: string, filePath: string) => {
    if (!supabase) throw new Error('Supabase not initialized');
    return supabase.storage.from(bucket).getPublicUrl(filePath);
  };

  return { uploadPetImage, getPublicUrl };
};
