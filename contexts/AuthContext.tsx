'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Session } from '@supabase/supabase-js';

// Global Fetch Interceptor to automatically attach Supabase JWT to backend requests
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input && 'url' in input) {
      url = input.url;
    }

    // Dynamic URL replacement for production deployment
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const chatbotUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'http://localhost:8001';

    let targetUrl = url;
    if (url.includes('localhost:8000')) {
      targetUrl = url.replace('http://localhost:8000', backendUrl);
    } else if (url.includes('localhost:8001')) {
      targetUrl = url.replace('http://localhost:8001', chatbotUrl);
    }

    if (typeof input === 'string') {
      input = targetUrl;
    } else if (input instanceof URL) {
      input = new URL(targetUrl);
    }

    // Intercept requests to the FastAPI backend (either localhost or the production URL)
    if (
      targetUrl.includes(backendUrl) || 
      targetUrl.includes(chatbotUrl) || 
      targetUrl.startsWith('/api')
    ) {
      const token = localStorage.getItem('access_token');
      if (token) {
        init = init || {};
        let headers: Record<string, string> = {};
        if (init.headers) {
          if (init.headers instanceof Headers) {
            init.headers.forEach((val, key) => {
              headers[key] = val;
            });
          } else if (Array.isArray(init.headers)) {
            init.headers.forEach(([key, val]) => {
              headers[key] = val;
            });
          } else {
            headers = { ...init.headers } as Record<string, string>;
          }
        }

        if (!headers['Authorization'] && !headers['authorization']) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        init.headers = headers;
      }
    }
    return originalFetch(input, init);
  };
}

export type Role = 'owner' | 'clinic' | 'admin' | null;

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: Role;
  phone?: string;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  hasProfile?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  role: Role;
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, role?: Role, phone?: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileDetails = async (userId: string, userEmail: string): Promise<User | null> => {
    try {
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !dbUser) {
        console.warn('User profile not found in public.users:', error?.message);
        return null;
      }

      let hasProfile = true;
      let verificationStatus: 'pending' | 'approved' | 'rejected' | undefined = undefined;
      let avatar = dbUser.avatar_url || undefined;

      if (dbUser.role === 'clinic') {
        let { data: clinic, error: clinicError } = await supabase
          .from('clinics')
          .select('id, is_verified, clinic_logo_url')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (clinicError) {
          console.error('Error fetching clinic profile in AuthContext:', clinicError);
        }
        
        // Fallback: If client-side query returns null, check via backend API to bypass RLS/cache issues
        if (!clinic && !clinicError) {
          console.log('Clinic profile not found via client-side query. Trying backend fallback...');
          try {
            const res = await window.fetch('http://localhost:8000/api/auth/profile');
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.role === 'clinic') {
                clinic = data.profile;
                console.log('Clinic profile successfully resolved via backend fallback.');
              }
            }
          } catch (err) {
            console.error('Error in clinic profile backend fallback:', err);
          }
        }
        
        hasProfile = !!clinic;
        if (clinic) {
          verificationStatus = clinic.is_verified ? 'approved' : 'pending';
          if (clinic.clinic_logo_url) {
            avatar = clinic.clinic_logo_url;
          }
        }
      } else if (dbUser.role === 'owner') {
        let { data: owner, error: ownerError } = await supabase
          .from('pet_owners')
          .select('id, profile_image_url')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (ownerError) {
          console.error('Error fetching pet owner profile in AuthContext:', ownerError);
        }
        
        if (!owner && !ownerError) {
          // Silently create the pet_owners record via the backend API
          console.log('Pet owner profile missing. Silently creating one via backend...');
          const nameParts = (dbUser.full_name || userEmail || 'Owner').trim().split(' ');
          const firstName = nameParts[0] || 'Owner';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          try {
            const res = await window.fetch('http://localhost:8000/api/auth/register/owner', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                phone: '',
                address: '',
                state: '',
                zip_code: '',
                country: '',
                bio: '',
              }),
            });
            
            if (res.ok) {
              console.log('Pet owner profile created silently via backend.');
              // Re-query pet_owners
              const { data: retryOwner } = await supabase
                .from('pet_owners')
                .select('id, profile_image_url')
                .eq('user_id', userId)
                .maybeSingle();
              if (retryOwner) {
                owner = retryOwner;
              }
            } else {
              const errText = await res.text();
              console.error('Backend silent profile creation failed:', errText);
            }
          } catch (err) {
            console.error('Error calling backend to create profile:', err);
          }
        }
        
        hasProfile = !!owner;
        if (owner && owner.profile_image_url) {
          avatar = owner.profile_image_url;
        }
      }

      return {
        id: userId,
        name: dbUser.full_name || userEmail,
        email: userEmail,
        avatar,
        role: dbUser.role as Role,
        phone: dbUser.phone_number || undefined,
        verificationStatus,
        hasProfile,
      };
    } catch (e) {
      console.error('Error fetching profile details:', e);
      return null;
    }
  };

  const handleSession = async (currentSession: Session | null) => {
    setSession(currentSession);
    
    if (currentSession?.user) {
      const userId = currentSession.user.id;
      const userEmail = currentSession.user.email || '';
      
      localStorage.setItem('access_token', currentSession.access_token);
      localStorage.setItem('refresh_token', currentSession.refresh_token);
      localStorage.setItem('user_id', userId);
      
      // Set cookie for middleware
      document.cookie = `sb-access-token=${currentSession.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax; Secure`;
      
      const profileUser = await fetchProfileDetails(userId, userEmail);
      if (profileUser && profileUser.role) {
        setUser(profileUser);
        setRole(profileUser.role);
        setIsAuthenticated(true);
        localStorage.setItem('user_role', profileUser.role);
      } else {
        // User exists in auth.users but hasn't completed onboarding/role selection
        setUser({
          id: userId,
          name: currentSession.user.user_metadata?.full_name || userEmail,
          email: userEmail,
          avatar: currentSession.user.user_metadata?.avatar_url || undefined,
          role: null,
          hasProfile: false,
        });
        setRole(null);
        setIsAuthenticated(false);
      }
    } else {
      clearAuth();
    }
    setLoading(false);
  };

  const clearAuth = () => {
    setIsAuthenticated(false);
    setRole(null);
    setUser(null);
    setSession(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    
    // Clear cookie for middleware
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax; Secure';
  };

  const refreshProfile = async () => {
    if (session?.user) {
      const profileUser = await fetchProfileDetails(session.user.id, session.user.email || '');
      if (profileUser) {
        setUser(profileUser);
        setRole(profileUser.role || null);
        if (profileUser.role) {
          setIsAuthenticated(true);
          localStorage.setItem('user_role', profileUser.role);
        }
      }
    }
  };

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      handleSession(activeSession);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      handleSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email: string, password: string, signUpRole?: Role, phone?: string) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: signUpRole,
          phone: phone,
        },
      },
    });
  };

  const signInWithGoogle = async () => {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearAuth();
    window.location.href = '/auth/login';
  };

  const resetPassword = async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        user,
        session,
        loading,
        signInWithPassword,
        signUp,
        signInWithGoogle,
        signOut,
        logout: signOut,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
