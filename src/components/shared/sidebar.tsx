'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Clock, 
  Calendar, 
  Users, 
  ChevronRight,
  LogOut,
  Briefcase,
  CheckCircle2,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';

const employeeMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Clock, label: 'Timesheets', href: '/timesheets' },
  { icon: Calendar, label: 'Leaves', href: '/leaves' },
];

const hrMenuItems = [
  { icon: LayoutDashboard, label: 'HR Dashboard', href: '/hr/dashboard' },
  { icon: CheckCircle2, label: 'Approvals', href: '/hr/approvals' },
  { icon: Users, label: 'Organization', href: '/hr/organization' },
  { icon: Users, label: 'Employees', href: '/employees' },
  { icon: TrendingUp, label: 'Analytics', href: '/hr/analytics' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role, logout } = useAuth();
  const items = role === 'hr' ? hrMenuItems : employeeMenuItems;

  return (
    <>
      <aside className="hidden lg:flex w-64 glass dark:glass-dark h-screen sticky top-0 flex-col border-r border-border/50 z-40">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Briefcase size={24} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight">BUD-B</span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">People</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-3">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "group relative flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 overflow-hidden",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon size={20} className={cn("transition-colors", isActive ? "text-primary" : "group-hover:text-foreground")} />
                <span className="font-medium">{item.label}</span>
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
          onClick={logout}
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </Button>
      </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-background border-t border-border/50 flex items-center justify-around p-3 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              )}>
                <item.icon size={20} className={cn(isActive && "text-primary")} />
                <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
