'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Mail, Lock, ArrowRight, ChevronLeft, UserPlus, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

type AuthState = 'login' | 'forgot-password' | 'request-access' | 'success';

export default function LoginPage() {
  const [state, setState] = useState<AuthState>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login: authLogin, loginWithGoogle: authLoginWithGoogle, resetPassword: authResetPassword } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authLogin(email, password);
      toast.success('Welcome back! Redirecting to your dashboard.');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Unable to sign in. Please check your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await authLoginWithGoogle();
      toast.success('Signed in with Google successfully.');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authResetPassword(email);
      toast.success('Password reset link sent to your email.');
      setState('login');
    } catch (error) {
      console.error(error);
      toast.error('Unable to send reset link. Please verify your email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAccess = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setState('success');
      toast.success('Request submitted successfully!');
    }, 1500);
  };

  const slideVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background overflow-hidden">
      {/* Left Side: Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#080B11] relative overflow-hidden items-center justify-center p-12 border-r border-white/5">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[140px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              x: [0, -30, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-purple-600/10 rounded-full blur-[140px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              x: [30, 0, 30],
              y: [-20, 20, -20],
            }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[30%] left-[20%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px]" 
          />
        </div>

        <div className="relative z-10 text-white max-w-lg w-full flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            {/* Logo container with white background to make the black text of the logo pop */}
            <div className="bg-white/95 rounded-2xl p-4 shadow-xl flex items-center justify-center border border-white max-w-[280px] self-center lg:self-start">
              <img src="/logo.png" alt="BUD-B Innovations Logo" className="h-10 w-auto object-contain" />
            </div>

            {/* Main Branding Banner Image Container */}
            <div className="glass dark:glass-dark rounded-[32px] p-2.5 border border-white/10 dark:border-white/5 shadow-2xl bg-white/5 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 opacity-50 pointer-events-none" />
              
              {/* Floating glow behind the banner image */}
              <div className="absolute -inset-1 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-[32px] blur-xl opacity-20 group-hover:opacity-30 transition duration-1000" />
              
              <img 
                src="/signin_illustration.png" 
                alt="BUD-B Innovations Workspace Illustration" 
                className="rounded-[22px] w-full h-auto object-cover border border-white/5 shadow-lg relative z-10 hover:scale-[1.01] transition-transform duration-500"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400 rounded-full blur-[100px]" />
        </div>

        <div className="w-full max-w-lg relative z-10">
          <AnimatePresence mode="wait">
            {state === 'login' && (
              <motion.div
                key="login"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
              >
                <div className="glass dark:glass-dark rounded-[32px] p-8 lg:p-12 border border-white/20 dark:border-white/10 shadow-2xl relative overflow-hidden group">
                  {/* Decorative corner glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />
                  
                  <CardHeader className="space-y-2 px-0 pb-10 text-center lg:text-left relative z-10">
                    <div className="flex justify-center lg:justify-start mb-6">
                      <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-md">
                        <img src="/logo.png" alt="BUD-B Innovations Logo" className="h-10 w-auto object-contain" />
                      </div>
                    </div>
                    <CardTitle className="text-4xl font-black tracking-tight">Welcome Back</CardTitle>
                    <CardDescription className="text-lg">
                      Sign in to your BUD-B Innovations portal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 space-y-8 relative z-10">
                    <form onSubmit={handleLogin} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="font-bold text-xs uppercase tracking-widest ml-1">Email</Label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="name@budbinnovations.com" 
                            className="pl-12 h-14 rounded-2xl bg-accent/30 border-2 border-transparent focus-visible:border-primary/50 transition-all text-base"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="off"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                          <Label htmlFor="password" className="font-bold text-xs uppercase tracking-widest">Password</Label>
                          <Button 
                            type="button"
                            variant="link" 
                            onClick={() => setState('forgot-password')}
                            className="px-0 h-auto text-xs font-bold text-primary hover:no-underline"
                          >
                            Forgot?
                          </Button>
                        </div>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                          <Input 
                            id="password" 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••"
                            className="pl-12 pr-12 h-14 rounded-2xl bg-accent/30 border-2 border-transparent focus-visible:border-primary/50 transition-all text-base"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                          >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Processing...' : 'Sign In'}
                      </Button>
                    </form>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black">
                        <span className="bg-background px-4 text-muted-foreground">Security Partners</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <Button type="button" onClick={handleGoogleSignIn} variant="outline" className="h-14 rounded-2xl border-border/50 hover:bg-accent/50 gap-3 font-bold group">
                        <svg className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </motion.div>
            )}

            {state === 'forgot-password' && (
              <motion.div
                key="forgot"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
              >
                <div className="glass dark:glass-dark rounded-[32px] p-8 lg:p-12 border border-white/20 dark:border-white/10 shadow-2xl relative overflow-hidden group">
                  <Button 
                    variant="ghost" 
                    onClick={() => setState('login')}
                    className="mb-6 -ml-3 gap-2 font-bold text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft size={20} /> Back to login
                  </Button>
                  <CardHeader className="space-y-2 px-0 pb-10">
                    <CardTitle className="text-4xl font-black tracking-tight">Reset Password</CardTitle>
                    <CardDescription className="text-lg">
                      Enter your email to receive a recovery link
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <form onSubmit={handleForgotPassword} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email" className="font-bold text-xs uppercase tracking-widest ml-1">Email</Label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                          <Input 
                            id="reset-email" 
                            type="email" 
                            placeholder="name@budbinnovations.com" 
                            className="pl-12 h-14 rounded-2xl bg-accent/30 border-2 border-transparent focus-visible:border-primary/50 transition-all"
                            required
                          />
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Sending...' : 'Send Recovery Link'}
                      </Button>
                    </form>
                  </CardContent>
                </div>
              </motion.div>
            )}

            {state === 'request-access' && (
              <motion.div
                key="request"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
              >
                <div className="glass dark:glass-dark rounded-[32px] p-8 lg:p-12 border border-white/20 dark:border-white/10 shadow-2xl relative overflow-hidden group">
                  <Button 
                    variant="ghost" 
                    onClick={() => setState('login')}
                    className="mb-6 -ml-3 gap-2 font-bold text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft size={20} /> Back to login
                  </Button>
                  <CardHeader className="space-y-2 px-0 pb-8">
                    <CardTitle className="text-4xl font-black tracking-tight">Request Access</CardTitle>
                    <CardDescription className="text-lg">
                      Apply for your workspace credentials
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 space-y-6">
                    <form onSubmit={handleRequestAccess} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-bold text-xs uppercase tracking-widest ml-1">First Name</Label>
                          <Input className="h-14 rounded-2xl bg-accent/30 border-none" required />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-xs uppercase tracking-widest ml-1">Last Name</Label>
                          <Input className="h-14 rounded-2xl bg-accent/30 border-none" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">Work Email</Label>
                        <Input type="email" placeholder="name@budbinnovations.com" className="h-14 rounded-2xl bg-accent/30 border-none" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">Department</Label>
                        <Input placeholder="e.g. Engineering" className="h-14 rounded-2xl bg-accent/30 border-none" required />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Submitting...' : 'Submit Request'}
                      </Button>
                    </form>
                  </CardContent>
                </div>
              </motion.div>
            )}

            {state === 'success' && (
              <motion.div
                key="success"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="text-center space-y-8"
              >
                <div className="glass dark:glass-dark rounded-[32px] p-8 lg:p-12 border border-white/20 dark:border-white/10 shadow-2xl flex flex-col items-center">
                  <div className="flex justify-center mb-8">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
                      <ShieldCheck size={48} />
                    </div>
                  </div>
                  <div className="space-y-2 mb-8">
                    <h2 className="text-4xl font-black tracking-tight">Great Success!</h2>
                    <p className="text-muted-foreground text-lg">
                      Your request has been received. Our HR team will review your application and get back to you shortly.
                    </p>
                  </div>
                  <Button 
                    onClick={() => setState('login')}
                    className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
                  >
                    Return to Login
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
