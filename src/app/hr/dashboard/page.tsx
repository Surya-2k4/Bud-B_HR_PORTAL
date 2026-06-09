'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Briefcase,
  UserCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useHRStore } from '@/store/hrStore';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

export default function HRDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { employees, leaves, timesheets, projects, departments } = useHRStore();

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

  // 1. Calculate stats dynamically
  const totalEmployees = employees.length;
  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const pendingTimesheets = timesheets.filter(t => t.status === 'pending').length;

  const stats = [
    { title: 'Total Employees', value: totalEmployees.toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Pending Leaves', value: pendingLeaves.toString(), icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Active Projects', value: activeProjects.toString(), icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Pending Timesheets', value: pendingTimesheets.toString(), icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  // 2. Map department distributions based on actual employee count in store
  const departmentDistribution = departments.map((dept) => {
    const count = employees.filter(e => e.dept === dept.name || (dept.name === 'Human Resources' && e.dept === 'HR')).length;
    return {
      name: dept.name,
      count: count > 0 ? count : dept.members // Fallback to pre-populated count if no exact matches
    };
  });

  // 3. Merged pending approvals queue (max 4)
  const pendingQueue: Array<{ id: string; name: string; type: string; desc: string; initials: string }> = [];
  
  leaves.filter(l => l.status === 'pending').forEach(l => {
    pendingQueue.push({
      id: l.id,
      name: l.name,
      type: 'Leave Request',
      desc: `${l.type} (${l.days} days) - "${l.reason}"`,
      initials: l.name.split(' ').map(n => n[0]).join('')
    });
  });

  timesheets.filter(t => t.status === 'pending').forEach(t => {
    pendingQueue.push({
      id: t.id,
      name: t.name,
      type: 'Timesheet',
      desc: `${t.project} (${t.hours} hours)`,
      initials: t.name.split(' ').map(n => n[0]).join('')
    });
  });

  // Sort queue a bit
  const displayQueue = pendingQueue.slice(0, 3);

  // 4. Project Health items
  const displayProjects = projects.slice(0, 3).map(p => {
    let healthStatus = 'On Track';
    if (p.progress < 40 && p.status === 'active') healthStatus = 'At Risk';
    else if (p.progress >= 90) healthStatus = 'Near Completion';
    else if (p.status === 'completed') healthStatus = 'Completed';
    else if (p.status === 'on-hold') healthStatus = 'On Hold';
    
    return {
      name: p.name,
      progress: p.progress,
      status: healthStatus
    };
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none px-3 font-bold uppercase tracking-widest text-[10px]">HR Admin Portal</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time insights across all departments and projects.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="glass dark:glass-dark border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={stat.bg + " p-3 rounded-xl transition-transform group-hover:scale-110"}>
                    <stat.icon className={stat.color} size={24} />
                  </div>
                  <TrendingUp className="text-emerald-500" size={20} />
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-3xl font-bold mt-1 tracking-tight">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="glass dark:glass-dark border-none shadow-sm p-6 lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <CardTitle className="text-xl">Registered Employees</CardTitle>
              <Link href="/employees">
                <Button variant="link" className="text-xs font-bold text-primary p-0 h-auto uppercase tracking-widest">View Directory</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.slice(0, 4).map((employee) => (
                <div key={employee.id} className="p-4 rounded-3xl bg-accent/20 border border-border/50">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{employee.name}</p>
                      <p className="text-xs text-muted-foreground">{employee.role}</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-none text-[11px] uppercase tracking-widest">{employee.status}</Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{employee.dept || 'Unassigned'}</span>
                    <span>{employee.email || employee.name || 'No email'}</span>
                  </div>
                </div>
              ))}
              {employees.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground italic">No employees registered yet.</div>
              )}
            </div>
          </Card>

          <Card className="lg:col-span-2 glass dark:glass-dark border-none shadow-sm p-6">
            <CardHeader className="px-0 pt-0 pb-6">
              <CardTitle className="text-xl">Department Distribution</CardTitle>
            </CardHeader>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'gray', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'gray', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', color: 'white' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                    {departmentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="glass dark:glass-dark border-none shadow-sm p-6">
            <CardHeader className="px-0 pt-0 pb-6">
              <CardTitle className="text-xl">Project Health</CardTitle>
            </CardHeader>
            <div className="space-y-6">
              {displayProjects.map((project) => (
                <div key={project.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate max-w-[160px]">{project.name}</span>
                    <Badge variant="secondary" className={cn(
                      "text-[9px] font-bold uppercase",
                      project.status === 'On Track' || project.status === 'Completed' ? "text-emerald-500 bg-emerald-500/10" : 
                      project.status === 'At Risk' ? "text-rose-500 bg-rose-500/10" : "text-blue-500 bg-blue-500/10"
                    )}>
                      {project.status}
                    </Badge>
                  </div>
                  <Progress value={project.progress} className="h-2 bg-accent" />
                  <div className="flex justify-end">
                    <span className="text-xs text-muted-foreground">{project.progress}% Complete</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="glass dark:glass-dark border-none shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <CardTitle className="text-xl">Pending Approvals</CardTitle>
              <Link href="/hr/approvals">
                <Button variant="link" className="text-xs font-bold text-primary p-0 h-auto uppercase tracking-widest">View All</Button>
              </Link>
            </div>
            <div className="space-y-4">
              {displayQueue.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground italic bg-accent/10 rounded-2xl">
                  No pending approvals in queue. Excellent!
                </div>
              ) : displayQueue.map((req, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-accent/30 border border-transparent hover:border-primary/20 transition-all group cursor-pointer animate-in fade-in" onClick={() => router.push('/hr/approvals')}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{req.initials}</div>
                    <div className="max-w-[200px] sm:max-w-xs">
                      <p className="text-sm font-bold">{req.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{req.type} • {req.desc}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-amber-500/10 text-amber-500 border-none group-hover:bg-amber-500/20 transition-colors">Review</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}
