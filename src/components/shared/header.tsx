'use client';

import { User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { LogOut } from 'lucide-react';
import Link from 'next/link';

function getInitials(name?: string, fallback?: string) {
  if (!name) return fallback || '';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

export function Header() {
  const { profile, role, logout } = useAuth();
  const displayName = profile?.name || (role === 'hr' ? 'HR Admin' : 'Employee');
  const displayEmail = profile?.email || (role === 'hr' ? 'admin@budbinnovations.com' : 'user@budbinnovations.com');
  const avatarInitials = getInitials(profile?.name, role === 'hr' ? 'AD' : 'EM');

  return (
    <header className="h-20 glass dark:glass-dark border-b border-border/50 sticky top-0 z-30 px-8 flex items-center justify-between">
      <div className="flex items-center gap-6 flex-1">
        <div className="flex lg:hidden items-center gap-2">
          <div className="bg-white rounded-lg px-2.5 py-1.5 border border-slate-100 shadow-sm flex items-center justify-center">
            <img src="/logo.png" alt="BUD-B Innovations Logo" className="h-6 w-auto object-contain" />
          </div>
        </div>
        <Badge variant="secondary" className={cn(
          "hidden sm:flex px-3 py-1 rounded-lg font-bold uppercase tracking-widest text-[10px] border-none",
          role === 'hr' ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
        )}>
          {role === 'hr' ? 'HR Portal' : 'Employee Portal'}
        </Badge>
      </div>

      <div className="flex items-center gap-4">

        <DropdownMenu>
          <DropdownMenuTrigger render={(props) => (
            <Button {...props} variant="ghost" className="p-0 h-10 w-10 rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                {profile?.avatar ? <AvatarImage src={profile.avatar} /> : null}
                <AvatarFallback>{avatarInitials}</AvatarFallback>
              </Avatar>
            </Button>
          )} />
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 glass dark:glass-dark border-border/50 shadow-2xl">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-3">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-sm">{displayName}</span>
                  <span className="text-xs text-muted-foreground">{displayEmail}</span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-border/50" />
            
            <DropdownMenuItem 
              render={<Link href="/profile" />}
              className="rounded-xl gap-3 p-3 cursor-pointer focus:bg-primary focus:text-white focus:**:text-white transition-colors"
            >
              <User size={18} className="text-primary" /> 
              <span className="font-medium">Profile Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem 
              className="rounded-xl gap-3 p-3 cursor-pointer text-destructive focus:text-white focus:bg-destructive focus:**:text-white transition-colors"
              onClick={logout}
            >
              <LogOut size={18} /> 
              <span className="font-medium">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
