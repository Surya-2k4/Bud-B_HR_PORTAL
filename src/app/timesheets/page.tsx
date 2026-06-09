'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Calendar as CalendarIcon,
  Briefcase,
  Layers,
  Search,
  Filter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useHRStore } from '@/store/hrStore';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const statusMap = {
  approved: { label: 'Approved', color: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle2 },
  pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-500', icon: Clock },
  rejected: { label: 'Rejected', color: 'bg-destructive/10 text-destructive', icon: AlertCircle },
};

export default function TimesheetsPage() {
  const [mounted, setMounted] = useState(false);
  const { timesheets, projects, addTimesheet, deleteTimesheet } = useHRStore();
  const { profile, role } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    project: '',
    task: '',
    hours: '',
    date: ''
  });

  useEffect(() => {
    setMounted(true);
    setFormData(prev => ({
      ...prev,
      date: new Date().toISOString().split('T')[0]
    }));
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
  const isHR = role === 'hr';
  const entries = isHR ? timesheets : timesheets.filter((t) => t.name === currentName);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (isHR ? entry.name.toLowerCase().includes(searchQuery.toLowerCase()) : false);
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleLogTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project || !formData.task || !formData.hours || !formData.date) {
      toast.error('Please fill all fields');
      return;
    }

    const dateObject = new Date(formData.date);
    const dayOfWeek = dateObject.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      toast.error('Time logs are accepted only Monday through Friday.');
      return;
    }

    addTimesheet({
      userId: currentUserId,
      name: currentName,
      project: formData.project,
      task: formData.task,
      date: formData.date,
      hours: parseFloat(formData.hours),
    });

    setIsModalOpen(false);
    setFormData({ project: '', task: '', hours: '', date: new Date().toISOString().split('T')[0] });
    toast.success('Time logged successfully!');
  };

  const deleteEntry = (id: string) => {
    deleteTimesheet(id);
    toast.success('Entry deleted');
  };

  // Calculate stats dynamically
  const totalHours = entries.reduce((sum, item) => sum + item.hours, 0);
  const approvedHours = entries.filter(t => t.status === 'approved').reduce((sum, item) => sum + item.hours, 0);
  const pendingHours = entries.filter(t => t.status === 'pending').reduce((sum, item) => sum + item.hours, 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Timesheets</h1>
            <p className="text-muted-foreground mt-1">Log your daily activities and track project hours.</p>
            {isHR && (
              <p className="text-sm text-muted-foreground mt-2">HR view: all employee timesheet entries are shown here. Use filters to review approved or pending logs.</p>
            )}
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass dark:glass-dark border-none shadow-sm p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">{isHR ? 'All Timesheet Hours' : 'Total Hours'}</p>
          <h3 className="text-3xl font-bold">{totalHours} <span className="text-sm font-normal text-muted-foreground">total logged</span></h3>
        </Card>
        <Card className="glass dark:glass-dark border-none shadow-sm p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Approved</p>
          <h3 className="text-3xl font-bold text-emerald-500">{approvedHours} <span className="text-sm font-normal text-muted-foreground italic">hours</span></h3>
        </Card>
        <Card className="glass dark:glass-dark border-none shadow-sm p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Pending</p>
          <h3 className="text-3xl font-bold text-amber-500">{pendingHours} <span className="text-sm font-normal text-muted-foreground italic">hours</span></h3>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder={isHR ? 'Search by employee, project, or task...' : 'Search by project or task...'}
            className="pl-10 rounded-xl bg-accent/30 border-none h-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={(props) => (
            <Button {...props} variant="outline" className="rounded-xl h-11 gap-2 border-border/50">
              <Filter size={18} /> {statusFilter === 'all' ? 'Filter' : `Status: ${statusFilter}`}
            </Button>
          )} />
          <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 glass dark:glass-dark border-border/50 shadow-2xl">
            <DropdownMenuItem onClick={() => setStatusFilter('all')} className="rounded-xl p-3 cursor-pointer focus:bg-primary focus:text-white focus:**:text-white transition-colors font-medium">All Statuses</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem onClick={() => setStatusFilter('approved')} className="rounded-xl p-3 cursor-pointer focus:bg-emerald-500 focus:text-white focus:**:text-white text-emerald-500 transition-colors font-medium">Approved Only</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('pending')} className="rounded-xl p-3 cursor-pointer focus:bg-amber-500 focus:text-white focus:**:text-white text-amber-500 transition-colors font-medium">Pending Only</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('rejected')} className="rounded-xl p-3 cursor-pointer focus:bg-destructive focus:text-white focus:**:text-white text-destructive transition-colors font-medium">Rejected Only</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="glass dark:glass-dark border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow className="border-border/50 hover:bg-transparent">
              {isHR && <TableHead className="py-4 font-bold text-foreground text-center">Employee</TableHead>}
              <TableHead className="py-4 font-bold text-foreground text-center">Project</TableHead>
              <TableHead className="py-4 font-bold text-foreground text-center">Task</TableHead>
              <TableHead className="py-4 font-bold text-foreground text-center">Date</TableHead>
              <TableHead className="py-4 font-bold text-foreground text-center">Hours</TableHead>
              <TableHead className="py-4 font-bold text-foreground text-center">Status</TableHead>
              <TableHead className="py-4 font-bold text-foreground text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isHR && (
              <TableRow className="bg-primary/5 hover:bg-primary/5">
                <TableCell className="py-3 text-center">
                  <Select value={formData.project} onValueChange={(v) => setFormData({ ...formData, project: v as string })}>
                    <SelectTrigger className="w-[180px] h-10 rounded-lg bg-background border-border/50 mx-auto">
                      <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.length > 0 ? (
                        projects.map((project) => (
                          <SelectItem key={project.id} value={project.name}>{project.name}</SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="Cloud Migration">Cloud Migration</SelectItem>
                          <SelectItem value="HRMS Portal">HRMS Portal</SelectItem>
                          <SelectItem value="Internal Admin">Internal Admin</SelectItem>
                          <SelectItem value="Legacy Cleanup">Legacy Cleanup</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="py-3 text-center">
                  <Input
                    placeholder="Task Details"
                    className="h-10 rounded-lg bg-background border-border/50 text-center mx-auto"
                    value={formData.task}
                    onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                  />
                </TableCell>
                <TableCell className="py-3 text-center">
                  <Input
                    type="date"
                    className="h-10 w-[140px] rounded-lg bg-background border-border/50 mx-auto text-center"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </TableCell>
                <TableCell className="py-3 text-center">
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="Hrs"
                    className="h-10 w-[80px] rounded-lg bg-background border-border/50 mx-auto text-center"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  />
                </TableCell>
                <TableCell className="py-3 text-center">
                  <div className="flex justify-center">
                    <Badge variant="secondary" className="bg-primary/10 text-primary whitespace-nowrap">New Entry</Badge>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-center">
                  <div className="flex justify-center">
                    <Button onClick={handleLogTime} className="rounded-full gap-2 shadow-sm px-4 h-10">
                      <Plus size={16} /> Log Time
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isHR ? 7 : 6} className="h-48 text-center text-muted-foreground italic">No entries found matching your search</TableCell>
              </TableRow>
            ) : filteredEntries.map((entry) => {
              const status = statusMap[entry.status as keyof typeof statusMap] || statusMap.pending;
              return (
                <TableRow key={entry.id} className="border-border/50 group">
                  {isHR && (
                    <TableCell className="py-5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Avatar className="h-9 w-9 border border-primary/10">
                          <AvatarFallback>{entry.name.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{entry.name}</span>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="py-5 font-medium text-center">{entry.project}</TableCell>
                  <TableCell className="py-5 text-muted-foreground text-center">{entry.task}</TableCell>
                  <TableCell className="py-5 text-center font-medium">{entry.date}</TableCell>
                  <TableCell className="py-5 font-bold text-center text-lg">{entry.hours}</TableCell>
                  <TableCell className="py-5 text-center">
                    <div className="flex justify-center">
                      <Badge variant="secondary" className={cn("px-3 py-1.5 rounded-full border-none font-medium gap-1.5", status.color)}>
                        <status.icon size={14} />
                        {status.label}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 text-center">
                    <div className="flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon-sm" className="rounded-full opacity-50 hover:opacity-100 hover:bg-accent focus:opacity-100 transition-opacity mx-auto">
                            <MoreVertical size={16} />
                          </Button>
                        } />
                      <DropdownMenuContent align="end" className="rounded-xl w-40">
                        <DropdownMenuItem className="cursor-pointer">View Details</DropdownMenuItem>
                        {!isHR && (
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => deleteEntry(entry.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      </div>
    </DashboardLayout>
  );
}

