'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';

export type Role = 'owner' | 'clinic' | 'admin' | null;

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: 'owner' | 'clinic' | 'admin';
  permissions?: string[];
  clinicName?: string;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  submittedDate?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  role: Role;
  user: User | null;
  login: (role: Role, user: User) => void;
  logout: () => void;
  setRole: (role: Role) => void;
  updateUser: (updatedFields: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRoleState] = useState<Role>(null);
  const [user, setUser] = useState<User | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem('authRole') as Role;
    const savedUser = localStorage.getItem('authUser');
    const savedAuth = localStorage.getItem('isAuthenticated');

    if (savedRole && savedUser) {
      setRoleState(savedRole);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(savedAuth === 'true');
    }
  }, []);

  const login = (newRole: Role, newUser: User) => {
    setIsAuthenticated(true);
    setRoleState(newRole);
    setUser(newUser);
    
    // Persist to localStorage
    localStorage.setItem('authRole', newRole || '');
    localStorage.setItem('authUser', JSON.stringify(newUser));
    localStorage.setItem('isAuthenticated', 'true');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRoleState(null);
    setUser(null);
    
    // Clear localStorage
    localStorage.removeItem('authRole');
    localStorage.removeItem('authUser');
    localStorage.removeItem('isAuthenticated');
  };

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updatedFields };
      localStorage.setItem('authUser', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        user,
        login,
        logout,
        setRole,
        updateUser
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
