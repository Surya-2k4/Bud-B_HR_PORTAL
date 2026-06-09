'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar,
  Search,
  Filter,
  Check,
  X
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useHRStore } from '@/store/hrStore';

export default function HRApprovalsPage() {
  const [mounted, setMounted] = useState(false);
  const { 
    leaves, 
    timesheets, 
    approveLeave, 
    rejectLeave, 
    approveTimesheet, 
    rejectTimesheet,
    projects
  } = useHRStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'leaves' | 'timesheets'>('leaves');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTypeFilter('all');
  }, [activeTab]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingLeavesList = leaves.filter(l => l.status === 'pending');
  const pendingTimesheetsList = timesheets.filter(t => t.status === 'pending');

  const filteredLeaves = leaves.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         l.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || l.type === typeFilter;
    const matchesStatus = l.status === 'pending';
    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredTimesheets = timesheets.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || t.project === typeFilter;
    const matchesStatus = t.status === 'pending';
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleAction = (id: string, type: 'leave' | 'timesheet', action: 'approve' | 'reject') => {
    if (type === 'leave') {
      if (action === 'approve') {
        approveLeave(id);
        toast.success('Leave approved successfully!');
      } else {
        rejectLeave(id);
        toast.error('Leave request rejected.');
      }
    } else {
      if (action === 'approve') {
        approveTimesheet(id);
        toast.success('Timesheet approved successfully!');
      } else {
        rejectTimesheet(id);
        toast.error('Timesheet rejected.');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
          <p className="text-muted-foreground mt-1">Review and manage organization-wide requests.</p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'leaves' | 'timesheets')} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="bg-accent/30 p-1 rounded-xl h-12 self-start">
              <TabsTrigger value="leaves" className="rounded-lg px-6 font-bold text-xs uppercase tracking-widest">
                Leaves <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none">{pendingLeavesList.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="timesheets" className="rounded-lg px-6 font-bold text-xs uppercase tracking-widest">
                Timesheets <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none">{pendingTimesheetsList.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-4 self-end sm:self-auto">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  placeholder="Search employee..." 
                  className="pl-10 rounded-xl bg-accent/30 border-none h-11"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger render={(props) => (
                  <Button {...props} variant="outline" className="rounded-xl h-11 gap-2 border-border/50">
                    <Filter size={18} /> {typeFilter === 'all' ? 'Filter' : `${activeTab === 'leaves' ? 'Type' : 'Project'}: ${typeFilter}`}
                  </Button>
                )} />
                <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 glass dark:glass-dark border-border/50 shadow-2xl">
                  <DropdownMenuItem onClick={() => setTypeFilter('all')} className="rounded-xl p-3 cursor-pointer focus:bg-primary focus:text-white focus:**:text-white transition-colors font-medium">All {activeTab === 'leaves' ? 'Types' : 'Projects'}</DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  {activeTab === 'leaves' ? (
                    <>
                      <DropdownMenuItem onClick={() => setTypeFilter('Sick Leave')} className="rounded-xl p-3 cursor-pointer focus:bg-primary focus:text-white focus:**:text-white transition-colors font-medium">Sick Leave</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTypeFilter('Casual Leave')} className="rounded-xl p-3 cursor-pointer focus:bg-primary focus:text-white focus:**:text-white transition-colors font-medium">Casual Leave</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTypeFilter('Paid Leave')} className="rounded-xl p-3 cursor-pointer focus:bg-primary focus:text-white focus:**:text-white transition-colors font-medium">Paid Leave</DropdownMenuItem>
                    </>
                  ) : (
                    projects.map((proj) => (
                      <DropdownMenuItem 
                        key={proj.id} 
                        onClick={() => setTypeFilter(proj.name)} 
                        className="rounded-xl p-3 cursor-pointer focus:bg-primary focus:text-white focus:**:text-white transition-colors font-medium"
                      >
                        {proj.name}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <TabsContent value="leaves">
            <Card className="glass dark:glass-dark border-none shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="py-4 font-bold text-foreground text-center">Employee</TableHead>
                    <TableHead className="py-4 font-bold text-foreground text-center">Type</TableHead>
                    <TableHead className="py-4 font-bold text-foreground text-center">Period</TableHead>
                    <TableHead className="py-4 font-bold text-foreground text-center">Reason</TableHead>
                    <TableHead className="py-4 font-bold text-foreground text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaves.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">No leave requests found</TableCell>
                    </TableRow>
                  ) : filteredLeaves.map((leave) => (
                    <TableRow key={leave.id} className="border-border/50 group">
                      <TableCell className="py-5 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Avatar className="h-9 w-9 border border-primary/10">
                            <AvatarImage src={leave.avatar} />
                            <AvatarFallback>{leave.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold">{leave.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        <div className="flex justify-center">
                          <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-medium">{leave.type}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        <span className="text-sm font-medium">
                          {new Date(leave.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(leave.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ({leave.days} days)
                        </span>
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        <span className="text-sm text-muted-foreground italic">"{leave.reason}"</span>
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        <div className="flex justify-center gap-3">
                          <Button 
                            variant="ghost" 
                            size="icon-sm" 
                            className="rounded-full text-emerald-500 hover:bg-emerald-500/20 bg-emerald-500/10"
                            onClick={() => handleAction(leave.id, 'leave', 'approve')}
                          >
                            <Check size={18} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon-sm" 
                            className="rounded-full text-rose-500 hover:bg-rose-500/20 bg-rose-500/10"
                            onClick={() => handleAction(leave.id, 'leave', 'reject')}
                          >
                            <X size={18} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="timesheets">
            <Card className="glass dark:glass-dark border-none shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="py-4 font-bold text-foreground text-center">Employee</TableHead>
                    <TableHead className="py-4 font-bold text-foreground text-center">Project</TableHead>
                    <TableHead className="py-4 font-bold text-foreground text-center">Date</TableHead>
                    <TableHead className="py-4 font-bold text-foreground text-center">Total Hours</TableHead>
                    <TableHead className="py-4 font-bold text-foreground text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTimesheets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">No timesheets found</TableCell>
                    </TableRow>
                  ) : filteredTimesheets.map((ts) => (
                    <TableRow key={ts.id} className="border-border/50 group">
                      <TableCell className="py-5 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Avatar className="h-9 w-9 border border-primary/10">
                            <AvatarImage src={ts.name === 'John Doe' ? 'https://github.com/shadcn.png' : ''} />
                            <AvatarFallback>{ts.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold">{ts.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 text-sm font-medium text-center">{ts.project}</TableCell>
                      <TableCell className="py-5 text-sm text-center">
                        {new Date(ts.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="py-5 font-bold text-center text-lg">{ts.hours}h</TableCell>
                      <TableCell className="py-5 text-center">
                        <div className="flex justify-center gap-3">
                          <Button 
                            variant="ghost" 
                            size="icon-sm" 
                            className="rounded-full text-emerald-500 hover:bg-emerald-500/20 bg-emerald-500/10"
                            onClick={() => handleAction(ts.id, 'timesheet', 'approve')}
                          >
                            <Check size={18} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon-sm" 
                            className="rounded-full text-rose-500 hover:bg-rose-500/20 bg-rose-500/10"
                            onClick={() => handleAction(ts.id, 'timesheet', 'reject')}
                          >
                            <X size={18} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
