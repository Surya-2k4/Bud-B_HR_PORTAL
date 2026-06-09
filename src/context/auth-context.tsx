'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getOrCreateUserProfile, signInUser, signInWithGoogle, signOutUser, resetPassword as sendPasswordReset, updateUserProfile, UserProfile } from '@/lib/firebase-services';
import { useHRStore } from '@/store/hrStore';

type UserRole = 'employee' | 'hr' | null;

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const initializeData = useHRStore((state) => state.initializeData);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser: any) => {
      setIsLoading(true);
      if (!nextUser) {
        setUser(null);
        setProfile(null);
        setRole(null);
        setIsLoading(false);
        return;
      }

      setUser(nextUser);
      try {
        const userProfile = await getOrCreateUserProfile(nextUser);
        setProfile(userProfile);
        setRole(userProfile.role);
      } catch (error) {
        console.error('Failed to load user profile', error);
        setProfile(null);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isLoading && !role && pathname !== '/') {
      router.push('/');
      return;
    }

    if (!isLoading && role && pathname === '/') {
      router.push(role === 'hr' ? '/hr/dashboard' : '/dashboard');
      return;
    }

    if (role === 'employee' && pathname?.startsWith('/hr')) {
      router.push('/dashboard');
      return;
    }

    if (role === 'hr' && pathname?.startsWith('/dashboard')) {
      router.push('/hr/dashboard');
    }
  }, [role, isLoading, pathname, router]);

  useEffect(() => {
    if (!isLoading && user && role) {
      initializeData();
    }
  }, [initializeData, isLoading, user, role]);

  const login = async (email: string, password: string) => {
    await signInUser(email, password);
  };

  const loginWithGoogle = async () => {
    await signInWithGoogle();
  };

  const logout = async () => {
    await signOutUser();
    setUser(null);
    setProfile(null);
    setRole(null);
    router.push('/');
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('No authenticated user');
    }
    const updatedProfile = await updateUserProfile(user.uid, updates);
    setProfile(updatedProfile);
    return updatedProfile;
  };

  const resetPassword = async (email: string) => {
    await sendPasswordReset(email);
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, login, loginWithGoogle, logout, resetPassword, updateProfile, isLoading }}>
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
