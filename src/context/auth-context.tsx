'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, User, updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getOrCreateUserProfile, signInUser, signInWithGoogle, signOutUser, resetPassword as sendPasswordReset, updateUserProfile, UserProfile } from '@/lib/firebase-services';
import { useHRStore } from '@/store/hrStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

type UserRole = 'employee' | 'hr' | null;

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
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
        useHRStore.getState().clearListeners();
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
    useHRStore.getState().clearListeners();
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
      {!isLoading && profile?.mustChangePassword && user ? (
        <PasswordChangeScreen 
          user={user} 
          onComplete={() => {
            setProfile(prev => prev ? { ...prev, mustChangePassword: false } : null);
          }} 
        />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

function PasswordChangeScreen({ user, onComplete }: { user: User; onComplete: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(user, newPassword);
      await updateUserProfile(user.uid, { mustChangePassword: false });
      toast.success('Password updated successfully!');
      onComplete();
    } catch (error: any) {
      console.error('Failed to change password', error);
      toast.error(error.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-[100px]" />

      <Card className="w-full max-w-md glass dark:glass-dark border border-white/20 dark:border-white/10 shadow-2xl relative z-10 p-6 rounded-[32px]">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center">
              <ShieldAlert size={32} />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight">Update Password</CardTitle>
          <CardDescription className="text-sm">
            For security reasons, you must change your initial password before accessing the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest ml-1">New Password</Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-12 h-14 rounded-2xl bg-accent/30 border-2 border-transparent focus-visible:border-primary/50 transition-all text-base"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest ml-1">Confirm New Password</Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-12 h-14 rounded-2xl bg-accent/30 border-2 border-transparent focus-visible:border-primary/50 transition-all text-base"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
