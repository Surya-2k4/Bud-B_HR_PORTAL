'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Building2, 
  Calendar, 
  MapPin, 
  Phone,
  Edit3,
  Eye,
  EyeOff,
  FileText
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useHRStore } from '@/store/hrStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { role, profile, updateProfile } = useAuth();
  const { employees } = useHRStore();
  const assignedEmployee = employees.find((emp) => emp.email.toLowerCase() === profile?.email?.toLowerCase());
  const [isEditMode, setIsEditMode] = useState(false);
  const formatAadhaar = (value: string) => {
    const clean = value.replace(/\D/g, '');
    const parts = [];
    for (let i = 0; i < clean.length && i < 12; i += 4) {
      parts.push(clean.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  const formatPAN = (value: string) => {
    return value.trim().toUpperCase().slice(0, 10);
  };

  const maskAadhaar = (val: string) => {
    if (!val) return '—';
    const clean = val.replace(/\s/g, '');
    if (clean.length < 4) return val;
    return `•••• •••• ${clean.slice(-4)}`;
  };

  const maskPAN = (val: string) => {
    if (!val) return '—';
    const clean = val.trim();
    if (clean.length < 4) return val;
    return `•••••${clean.slice(-5, -1)}•`;
  };

  const formatDob = (dobStr: string) => {
    if (!dobStr) return '—';
    try {
      const date = new Date(dobStr);
      if (isNaN(date.getTime())) return dobStr;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dobStr;
    }
  };

  const [showAadhar, setShowAadhar] = useState(false);
  const [showPan, setShowPan] = useState(false);

  const [formValues, setFormValues] = useState({
    dept: profile?.dept || '',
    employeeId: profile?.employeeId || '',
    joinDate: profile?.joinDate || '',
    location: profile?.location || '',
    phone: profile?.phone || '',
    aadhar: profile?.aadhar || '',
    pan: profile?.pan || '',
    address: profile?.address || '',
    dob: profile?.dob || '',
  });

  useEffect(() => {
    setFormValues({
      dept: profile?.dept || assignedEmployee?.dept || '',
      employeeId: profile?.employeeId || assignedEmployee?.employeeId || '',
      joinDate: profile?.joinDate || assignedEmployee?.joinDate || '',
      location: profile?.location || '',
      phone: profile?.phone || assignedEmployee?.phone || '',
      aadhar: profile?.aadhar || assignedEmployee?.aadhar || '',
      pan: profile?.pan || assignedEmployee?.pan || '',
      address: profile?.address || assignedEmployee?.address || '',
      dob: profile?.dob || assignedEmployee?.dob || '',
    });
  }, [profile, assignedEmployee]);

  const userData = {
    name: profile?.name || assignedEmployee?.name || (role === 'hr' ? 'HR Administrator' : 'Team Member'),
    role: role === 'hr' ? 'Head of HR' : (assignedEmployee?.role || 'Team Member'),
    email: profile?.email || assignedEmployee?.email || (role === 'hr' ? 'admin@budbinnovations.com' : 'user@budbinnovations.com'),
    dept: assignedEmployee?.dept || formValues.dept || profile?.dept || (role === 'hr' ? 'Human Resources' : 'Product Design'),
    joinDate: formValues.joinDate || profile?.joinDate || assignedEmployee?.joinDate || 'Jan 2024',
    location: formValues.location || profile?.location || 'Bangalore, India',
    phone: formValues.phone || profile?.phone || assignedEmployee?.phone || '+91 98765 43210',
    avatar: profile?.avatar || assignedEmployee?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.name || assignedEmployee?.name || (role === 'hr' ? 'HR Administrator' : 'Team Member'))}`,
    initials: profile?.name
      ? profile.name
          .split(' ')
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : assignedEmployee?.name
      ? assignedEmployee.name
          .split(' ')
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : role === 'hr'
      ? 'AD'
      : 'JD',
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    const cleanAadhar = formValues.aadhar.replace(/[\s-]/g, '');
    if (cleanAadhar && !/^\d{12}$/.test(cleanAadhar)) {
      toast.error('Aadhaar number must be exactly 12 digits');
      return;
    }

    const cleanPan = formValues.pan.trim().toUpperCase();
    if (cleanPan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan)) {
      toast.error('PAN card must be a valid 10-character alphanumeric (e.g. ABCDE1234F)');
      return;
    }

    try {
      await updateProfile({
        dept: formValues.dept,
        employeeId: formValues.employeeId,
        joinDate: formValues.joinDate,
        location: formValues.location,
        phone: formValues.phone,
        aadhar: cleanAadhar ? formatAadhaar(cleanAadhar) : '',
        pan: cleanPan,
        address: formValues.address.trim(),
        dob: formValues.dob,
      });
      setIsEditMode(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile', error);
      toast.error('Failed to update profile');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information and workspace settings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <Card className="glass dark:glass-dark border-none shadow-sm p-8 text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <div className="relative inline-block mb-6">
                <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                  <AvatarImage src={userData.avatar} />
                  <AvatarFallback className="text-3xl font-bold">{userData.initials}</AvatarFallback>
                </Avatar>
              </div>
              <h2 className="text-xl font-bold">{userData.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{userData.role}</p>
              <div className="mt-6">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none uppercase tracking-widest text-[10px] font-bold">
                  {role === 'hr' ? 'Admin Access' : 'Employee Portal'}
                </Badge>
              </div>
            </Card>

            <Card className="glass dark:glass-dark border-none shadow-sm p-6 space-y-4">
              <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Personal Details</CardTitle>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/50 text-muted-foreground shrink-0">
                    <Mail size={16} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Email</span>
                    <span className="text-sm font-medium truncate" title={userData.email}>{userData.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/50 text-muted-foreground shrink-0">
                    <Phone size={16} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Phone</span>
                    <span className="text-sm font-medium truncate" title={userData.phone}>{userData.phone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/50 text-muted-foreground shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Location</span>
                    <span className="text-sm font-medium truncate" title={userData.location}>{userData.location}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-8">
            <Card className="glass dark:glass-dark border-none shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <CardTitle className="text-xl">Employment Information</CardTitle>
                {role === 'hr' && (
                  <Button variant="outline" className="rounded-xl gap-2 h-9 border-border/50" onClick={() => setIsEditMode(true)}>
                    <Edit3 size={16} /> Edit
                  </Button>
                )}
              </div>
              {isEditMode && role === 'hr' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Department</Label>
                      <Input
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={formValues.dept}
                        onChange={(e) => setFormValues({ ...formValues, dept: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Employee ID</Label>
                      <Input
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={formValues.employeeId}
                        onChange={(e) => setFormValues({ ...formValues, employeeId: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Joining Date</Label>
                      <Input
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={formValues.joinDate}
                        onChange={(e) => setFormValues({ ...formValues, joinDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Location</Label>
                      <Input
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={formValues.location}
                        onChange={(e) => setFormValues({ ...formValues, location: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest ml-1">Phone</Label>
                    <Input
                      className="h-12 rounded-xl bg-accent/30 border-none"
                      value={formValues.phone}
                      onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Aadhaar Number</Label>
                      <Input
                        placeholder="1234 5678 9012"
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={formValues.aadhar}
                        onChange={(e) => setFormValues({ ...formValues, aadhar: formatAadhaar(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">PAN Card</Label>
                      <Input
                        placeholder="ABCDE1234F"
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={formValues.pan}
                        onChange={(e) => setFormValues({ ...formValues, pan: formatPAN(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest ml-1">Date of Birth</Label>
                    <Input
                      type="date"
                      className="h-12 rounded-xl bg-accent/30 border-none text-muted-foreground focus:text-foreground"
                      value={formValues.dob}
                      onChange={(e) => setFormValues({ ...formValues, dob: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest ml-1">Address</Label>
                    <Input
                      placeholder="123 Main St, Bangalore, India"
                      className="h-12 rounded-xl bg-accent/30 border-none"
                      value={formValues.address}
                      onChange={(e) => setFormValues({ ...formValues, address: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-4">
                    <Button variant="secondary" className="rounded-xl h-12" onClick={() => setIsEditMode(false)}>
                      Cancel
                    </Button>
                    <Button className="rounded-xl h-12" onClick={handleSaveProfile}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                        <Building2 size={20} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Department</span>
                        <span className="text-base font-bold truncate" title={userData.dept}>{userData.dept}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
                        <Building2 size={20} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Employee ID</span>
                        <span className="text-base font-bold truncate" title={formValues.employeeId || 'BUDB001'}>{formValues.employeeId || 'BUDB001'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-500 shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="flex flex-col min-w-0 w-full">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Aadhaar Number</span>
                        <div className="flex items-center justify-between gap-2 pr-4">
                          <span className="text-base font-bold truncate">
                            {showAadhar ? (formValues.aadhar || '—') : maskAadhaar(formValues.aadhar)}
                          </span>
                          {formValues.aadhar && (
                            <button
                              type="button"
                              onClick={() => setShowAadhar(!showAadhar)}
                              className="text-muted-foreground hover:text-foreground focus:outline-none"
                            >
                              {showAadhar ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                        <Calendar size={20} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Date of Birth</span>
                        <span className="text-base font-bold truncate" title={formValues.dob ? formatDob(formValues.dob) : '—'}>
                          {formatDob(formValues.dob)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                        <Calendar size={20} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Joining Date</span>
                        <span className="text-base font-bold truncate" title={userData.joinDate}>{userData.joinDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                        <User size={20} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Location</span>
                        <span className="text-base font-bold truncate" title={userData.location}>{userData.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="flex flex-col min-w-0 w-full">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">PAN Card</span>
                        <div className="flex items-center justify-between gap-2 pr-4">
                          <span className="text-base font-bold truncate">
                            {showPan ? (formValues.pan || '—') : maskPAN(formValues.pan)}
                          </span>
                          {formValues.pan && (
                            <button
                              type="button"
                              onClick={() => setShowPan(!showPan)}
                              className="text-muted-foreground hover:text-foreground focus:outline-none"
                            >
                              {showPan ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 sm:col-span-2 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-slate-500/10 text-slate-500 shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Address</span>
                        <span className="text-base font-bold whitespace-pre-line leading-relaxed" title={formValues.address || '—'}>
                          {formValues.address || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
