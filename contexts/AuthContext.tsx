'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';

export type Role = 'owner' | 'clinic' | 'admin' | null;

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: 'owner' | 'clinic' | 'admin';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUser: User = {
  id: '1',
  name: 'Sarah Jenkins',
  email: 'sarah@example.com',
  avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces&q=80'
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [role, setRoleState] = useState<Role>('owner');
  const [user, setUser] = useState<User | null>(mockUser);

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

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        user,
        login,
        logout,
        setRole
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
