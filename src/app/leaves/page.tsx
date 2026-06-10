'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Calendar,
  CheckCircle2, 
  XCircle, 
  Clock, 
  Info,
  ChevronLeft,
  ChevronRight,
  FileText,
  Briefcase,
  Search,
  Filter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/auth-context';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useHRStore } from '@/store/hrStore';

const statusMap = {
  approved: { label: 'Approved', color: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle2 },
  pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-500', icon: Clock },
  rejected: { label: 'Rejected', color: 'bg-destructive/10 text-destructive', icon: XCircle },
};

export default function LeavesPage() {
  const [mounted, setMounted] = useState(false);
  const { leaves, leaveBalances, requestLeave } = useHRStore();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [formData, setFormData] = useState({
    type: '',
    start: '',
    end: '',
    reason: ''
  });

  const holidays = [
    { name: 'Independence Day', date: '2026-08-15' },
    { name: 'Republic Day', date: '2026-01-26' },
    { name: 'May Day', date: '2026-05-01' },
    { name: 'New Year', date: '2026-01-01' },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentName = profile?.name || 'Team Member';
  const currentUserId = profile?.uid || '';
  const isHR = profile?.role === 'hr' || false;

  const userRequests = isHR ? leaves : leaves.filter((l) => l.name === currentName);
  const userBalances = isHR
    ? [
        { type: 'Casual Leave', total: 10, used: 2, color: 'bg-indigo-500' },
        { type: 'Sick Leave', total: 8, used: 1, color: 'bg-rose-500' },
        { type: 'Paid Leave', total: 15, used: 5, color: 'bg-emerald-500' },
      ]
    : leaveBalances[currentName] || [
        { type: 'Casual Leave', total: 10, used: 2, color: 'bg-indigo-500' },
        { type: 'Sick Leave', total: 8, used: 1, color: 'bg-rose-500' },
        { type: 'Paid Leave', total: 15, used: 5, color: 'bg-emerald-500' },
      ];

  const filteredRequests = userRequests.filter(req => {
    const matchesSearch = req.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         req.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (isHR ? req.name.toLowerCase().includes(searchQuery.toLowerCase()) : false);
    const matchesStatus =
      statusFilter === 'all' ||
      req.status === statusFilter ||
      (statusFilter === 'accepted' && req.status === 'approved');
    return matchesSearch && matchesStatus;
  });

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const isHoliday = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.find(h => h.date === dateStr);
  };

  const isWeekend = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const hasLeave = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return userRequests.find(r => {
      if (r.status !== 'approved') return false;
      const start = new Date(r.start);
      const end = new Date(r.end);
      // Normalize times for date comparison
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      return targetDate >= start && targetDate <= end;
    });
  };

  const countBusinessDays = (startDate: Date, endDate: Date) => {
    let count = 0;
    const date = new Date(startDate);
    while (date <= endDate) {
      const weekday = date.getDay();
      if (weekday !== 0 && weekday !== 6) {
        count += 1;
      }
      date.setDate(date.getDate() + 1);
    }
    return count;
  };

  const handleRequestLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.start || !formData.end || !formData.reason) {
      toast.error('Please fill all fields');
      return;
    }

    const start = new Date(formData.start);
    const end = new Date(formData.end);
    
    if (end < start) {
      toast.error('End date cannot be before start date');
      return;
    }

    const businessDays = countBusinessDays(start, end);
    if (businessDays === 0) {
      toast.error('Leave must include at least one workday (Monday to Friday).');
      return;
    }

    requestLeave({
      userId: currentUserId,
      name: currentName,
      type: formData.type,
      start: formData.start,
      end: formData.end,
      days: businessDays,
      reason: formData.reason,
      avatar: profile?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentName)}`,
    });

    setIsModalOpen(false);
    setFormData({ type: '', start: '', end: '', reason: '' });
    toast.success('Leave request submitted!');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leaves</h1>
            <p className="text-muted-foreground mt-1">Manage your leave requests and balances.</p>
          </div>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger render={
              <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20">
                <Plus size={18} /> Request Leave
              </Button>
            } />
            <DialogContent className="sm:max-w-[425px] rounded-[24px] glass dark:glass-dark border-border/50">
              <form onSubmit={handleRequestLeave}>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">New Leave Request</DialogTitle>
                  <DialogDescription>
                    Submit your leave application for manager approval.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest ml-1">Leave Type</Label>
                    <Select onValueChange={(v) => setFormData({...formData, type: v as string})}>
                      <SelectTrigger className="w-full h-12 rounded-xl bg-accent/30 border-none">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                        <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                        <SelectItem value="Paid Leave">Paid Leave</SelectItem>
                        <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Start Date</Label>
                      <Input 
                        type="date" 
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={formData.start}
                        onChange={(e) => setFormData({...formData, start: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">End Date</Label>
                      <Input 
                        type="date" 
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={formData.end}
                        onChange={(e) => setFormData({...formData, end: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-widest ml-1">Reason</Label>
                    <Input 
                      placeholder="e.g. Family function" 
                      className="h-12 rounded-xl bg-accent/30 border-none"
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full h-12 rounded-xl font-bold">Submit Request</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {userBalances.map((leave) => {
            const percentage = (leave.used / leave.total) * 100;
            return (
              <Card key={leave.type} className="glass dark:glass-dark border-none shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold">{leave.type}</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Available: {Math.max(0, leave.total - leave.used)}</span>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <h3 className="text-3xl font-bold">{leave.used} <span className="text-sm font-normal text-muted-foreground">/ {leave.total} Days Used</span></h3>
                </div>
                <Progress value={percentage} className="h-2 bg-accent" />
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Info size={12} /> Accrued monthly
                </p>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 glass dark:glass-dark border-none shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-xl">My Requests</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    placeholder="Filter requests..." 
                    className="pl-9 h-9 rounded-xl bg-accent/30 border-none text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger render={(props) => (
                    <Button {...props} variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-accent/30 text-muted-foreground">
                      <Filter size={16} />
                    </Button>
                  )} />
                  <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 glass dark:glass-dark border-border/50 shadow-2xl">
                    <DropdownMenuItem onClick={() => setStatusFilter('all')} className="rounded-xl p-3 cursor-pointer focus:bg-primary focus:text-white focus:**:text-white transition-colors font-medium">All Statuses</DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem onClick={() => setStatusFilter('approved')} className="rounded-xl p-3 cursor-pointer focus:bg-emerald-500 focus:text-white focus:**:text-white text-emerald-500 transition-colors font-medium">Approved</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('accepted')} className="rounded-xl p-3 cursor-pointer focus:bg-emerald-500 focus:text-white focus:**:text-white text-emerald-500 transition-colors font-medium">Accepted</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('pending')} className="rounded-xl p-3 cursor-pointer focus:bg-amber-500 focus:text-white focus:**:text-white text-amber-500 transition-colors font-medium">Pending</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('rejected')} className="rounded-xl p-3 cursor-pointer focus:bg-destructive focus:text-white focus:**:text-white text-destructive transition-colors font-medium">Rejected</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {filteredRequests.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground italic">No requests found matching your search.</div>
                ) : filteredRequests.map((request) => {
                  const status = statusMap[request.status as keyof typeof statusMap] || statusMap.pending;
                  // Format dates from YYYY-MM-DD to MMM DD, YYYY
                  const formatDate = (dateStr: string) => {
                    try {
                      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    } catch (e) {
                      return dateStr;
                    }
                  };
                  return (
                    <div key={request.id} className="p-6 flex items-center justify-between hover:bg-accent/20 transition-colors group">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-accent/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="font-semibold">{request.type}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {formatDate(request.start)} - {formatDate(request.end)} ({request.days} day{request.days === 1 ? '' : 's'})
                          </p>
                          <p className="text-xs text-muted-foreground mt-2 italic">"{request.reason}"</p>
                        </div>
                      </div>
                      <Badge className={cn("px-4 py-1.5 rounded-full border-none font-medium gap-2", status.color)}>
                        <status.icon size={16} />
                        {status.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="glass dark:glass-dark border-none shadow-sm p-6">
            <div className="flex items-center justify-between mb-6 border-b border-border/30 pb-4">
              <CardTitle className="text-xl">Leave Calendar</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={prevMonth}>
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-sm font-bold self-center px-1">
                  {monthName} {currentDate.getFullYear()}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={nextMonth}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
            <div>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={`${d}-${i}`} className="h-8 flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{d}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const holiday = isHoliday(day);
                  const weekend = isWeekend(day);
                  const leave = hasLeave(day);
                  const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                  
                  return (
                    <Dialog key={day}>
                      <DialogTrigger render={
                        <button 
                          suppressHydrationWarning
                          className={cn(
                            "h-10 flex flex-col items-center justify-center rounded-xl text-sm transition-all relative group w-full",
                            isToday ? "bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20" : 
                            holiday ? "bg-rose-500/10 text-rose-500 font-semibold" :
                            weekend ? "bg-orange-500/10 text-orange-500 font-semibold" :
                            leave ? "bg-indigo-500/10 text-indigo-500 font-semibold" :
                            "hover:bg-accent/50 text-foreground"
                          )}
                        >
                          {day}
                          {(holiday || weekend || leave) && (
                            <div className={cn(
                              "absolute bottom-1 w-1 h-1 rounded-full",
                              holiday ? "bg-rose-500" : weekend ? "bg-orange-500" : "bg-indigo-500"
                            )} />
                          )}
                        </button>
                      } />
                      <DialogContent className="sm:max-w-[400px] glass-dark border-none shadow-2xl p-0 overflow-hidden rounded-3xl">
                        <div className={cn(
                          "h-2 w-full",
                          holiday ? "bg-rose-500" : weekend ? "bg-orange-500" : leave ? "bg-indigo-500" : "bg-primary"
                        )} />
                        <div className="p-8 space-y-6">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                              {monthName} {day}, {currentDate.getFullYear()}
                            </DialogTitle>
                            <DialogDescription className="text-base">
                              Event details for this day.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            {holiday && (
                              <div className="flex items-start gap-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                                <div className="p-2 rounded-xl bg-rose-500 text-white">
                                  <Briefcase size={16} />
                                </div>
                                <div>
                                  <p className="font-bold text-rose-500">Public Holiday</p>
                                  <p className="text-sm text-rose-500/80">{holiday.name}</p>
                                </div>
                              </div>
                            )}
                            {weekend && !holiday && (
                              <div className="flex items-start gap-4 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                                <div className="p-2 rounded-xl bg-orange-500 text-white">
                                  <Briefcase size={16} />
                                </div>
                                <div>
                                  <p className="font-bold text-orange-500">Weekend</p>
                                  <p className="text-sm text-orange-500/80">Weekly Off</p>
                                </div>
                              </div>
                            )}
                            {leave && (
                              <div className="flex items-start gap-4 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                                <div className="p-2 rounded-xl bg-indigo-500 text-white">
                                  <Calendar size={16} />
                                </div>
                                <div>
                                  <p className="font-bold text-indigo-500">Leave Applied</p>
                                  <p className="text-sm text-indigo-500/80">{leave.type}</p>
                                  <p className="text-xs text-indigo-500/60 mt-1 italic">"{leave.reason}"</p>
                                </div>
                              </div>
                            )}
                            {!holiday && !weekend && !leave && (
                              <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                <div className="p-2 rounded-xl bg-emerald-500 text-white">
                                  <CheckCircle2 size={16} />
                                </div>
                                <div>
                                  <p className="font-bold text-emerald-500">Regular Working Day</p>
                                  <p className="text-sm text-emerald-500/80">No holidays or leaves recorded.</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20 mt-4">
                            Log Working Hours
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  );
                })}
              </div>
              <div className="mt-8 space-y-3 max-h-64 overflow-y-auto pr-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest sticky top-0 bg-background/90 backdrop-blur z-10 py-1">Upcoming Holidays</p>
                {holidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .filter(h => new Date(h.date) >= new Date())
                  .map((holiday, idx) => {
                    const hDate = new Date(holiday.date);
                    const formattedDate = hDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const dayOfWeek = hDate.toLocaleDateString('en-US', { weekday: 'short' });
                    
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-accent/30 border border-transparent hover:border-primary/20 transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-background group-hover:bg-primary/10 transition-colors">
                            <FileText size={14} className="group-hover:text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{holiday.name}</span>
                            <span className="text-[10px] text-muted-foreground">{dayOfWeek}</span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-primary">{formattedDate}</span>
                      </div>
                    );
                })}
                {holidays.filter(h => new Date(h.date) >= new Date()).length === 0 && (
                  <div className="text-sm text-muted-foreground italic text-center p-4">No upcoming holidays scheduled.</div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
