'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Briefcase, 
  Calendar,
  AlertCircle,
  FileBarChart2,
  FolderDot
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useHRStore } from '@/store/hrStore';

const COLORS = ['#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function HRAnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const { employees, projects, timesheets, leaves } = useHRStore();

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

  // 1. KPI Calculations (Real database store data)
  const totalEmployees = employees.length;
  const activeEmployeesCount = employees.filter(e => e.status === 'active').length;
  const activeProjectsCount = projects.filter(p => p.status === 'active').length;
  const totalApprovedHours = timesheets
    .filter(t => t.status === 'approved')
    .reduce((sum, t) => sum + t.hours, 0);
  const totalApprovedLeaveDays = leaves
    .filter(l => l.status === 'approved')
    .reduce((sum, l) => sum + l.days, 0);

  // 2. Department Headcount distribution
  const deptCounts: Record<string, number> = {};
  employees.forEach(emp => {
    const dept = emp.dept || 'Unassigned';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });
  const departmentData = Object.entries(deptCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 3. Approved Leave types breakdown
  const leaveCounts: Record<string, number> = {};
  leaves
    .filter(l => l.status === 'approved')
    .forEach(l => {
      const type = l.type || 'Other';
      leaveCounts[type] = (leaveCounts[type] || 0) + l.days;
    });
  const leaveTypeData = Object.entries(leaveCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 4. Logged hours per Project breakdown (Approved)
  const projectHours: Record<string, number> = {};
  timesheets
    .filter(t => t.status === 'approved')
    .forEach(t => {
      const proj = t.project || 'Unassigned Project';
      projectHours[proj] = (projectHours[proj] || 0) + t.hours;
    });
  const projectHoursData = Object.entries(projectHours)
    .map(([name, hours]) => ({ name, hours }))
    .sort((a, b) => b.hours - a.hours);

  // 5. General store metric ratios
  const activeProjectRatio = projects.length > 0 
    ? Math.round((activeProjectsCount / projects.length) * 100) 
    : 0;

  const approvedLeavesCount = leaves.filter(l => l.status === 'approved').length;
  const avgLeaveDuration = approvedLeavesCount > 0
    ? Math.round((totalApprovedLeaveDays / approvedLeavesCount) * 10) / 10
    : 0;

  const timesheetCompliance = activeEmployeesCount > 0
    ? Math.round((timesheets.length / activeEmployeesCount) * 10) / 10
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Analytics</h1>
          <p className="text-muted-foreground mt-1">Live calculations and workforce insights from active databases.</p>
        </div>

        {/* Real Metrics KPI Header Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass dark:glass-dark border-none shadow-sm p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Staff</p>
              <h3 className="text-2xl font-bold mt-1">
                {activeEmployeesCount} <span className="text-xs text-muted-foreground font-normal">/ {totalEmployees} total</span>
              </h3>
            </div>
          </Card>

          <Card className="glass dark:glass-dark border-none shadow-sm p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
              <FolderDot size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Projects</p>
              <h3 className="text-2xl font-bold mt-1">
                {activeProjectsCount} <span className="text-xs text-muted-foreground font-normal">/ {projects.length} total</span>
              </h3>
            </div>
          </Card>

          <Card className="glass dark:glass-dark border-none shadow-sm p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approved Hours</p>
              <h3 className="text-2xl font-bold mt-1">{totalApprovedHours}h</h3>
            </div>
          </Card>

          <Card className="glass dark:glass-dark border-none shadow-sm p-6 flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leave Days Taken</p>
              <h3 className="text-2xl font-bold mt-1">{totalApprovedLeaveDays} days</h3>
            </div>
          </Card>
        </div>

        {/* Dynamic Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Department Headcount */}
          <Card className="lg:col-span-2 glass dark:glass-dark border-none shadow-sm p-6">
            <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Headcount by Department</CardTitle>
                <CardDescription>Live breakdown of workforce distribution.</CardDescription>
              </div>
              <Briefcase className="text-primary" size={24} />
            </CardHeader>
            <div className="h-[320px] w-full">
              {departmentData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground italic">No employee directory data available.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'gray', fontSize: 12}} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: 'gray', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', color: 'white' }}
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Leave Categories Breakdown */}
          <Card className="glass dark:glass-dark border-none shadow-sm p-6 flex flex-col justify-between">
            <CardHeader className="px-0 pt-0 pb-6">
              <CardTitle className="text-xl">Leave Category Shares</CardTitle>
              <CardDescription>Total approved leave days by type.</CardDescription>
            </CardHeader>
            <div className="h-[220px] w-full relative">
              {leaveTypeData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground italic">No approved leave records found.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leaveTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {leaveTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', color: 'white' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="space-y-3 mt-4 overflow-y-auto max-h-[140px] pr-1">
              {leaveTypeData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="font-semibold text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-bold text-foreground">{item.value} days</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Project logged hours & compliance grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Approved Hours per Project */}
          <Card className="glass dark:glass-dark border-none shadow-sm p-6">
            <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Hours Allocated per Project</CardTitle>
                <CardDescription>Total approved timesheet hours grouped by active projects.</CardDescription>
              </div>
              <FileBarChart2 className="text-emerald-500" size={24} />
            </CardHeader>
            <div className="h-[280px] w-full">
              {projectHoursData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground italic">No timesheet hours logged for projects.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectHoursData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'gray', fontSize: 11}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'gray', fontSize: 11}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', color: 'white' }}
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    />
                    <Bar dataKey="hours" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Operational Metrics KPIs */}
          <Card className="glass dark:glass-dark border-none shadow-sm p-6">
            <CardHeader className="px-0 pt-0 pb-6">
              <CardTitle className="text-xl">Operational KPI Ratios</CardTitle>
              <CardDescription>Core database indicators showing workload metrics.</CardDescription>
            </CardHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Project Launch Rate (Active ratio)</span>
                  <span className="text-emerald-500 font-bold">{activeProjectRatio}%</span>
                </div>
                <div className="h-2 w-full bg-accent/40 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${activeProjectRatio}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground">Ratio of active launches to total project entries registered.</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Avg Leave Request Length</span>
                  <span className="text-amber-500 font-bold">{avgLeaveDuration} days</span>
                </div>
                <div className="h-2 w-full bg-accent/40 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (avgLeaveDuration / 15) * 100)}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground">Mean business days requested across all approved employee applications.</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Logged Timesheet Entry Density</span>
                  <span className="text-purple-500 font-bold">{timesheetCompliance} entries/staff</span>
                </div>
                <div className="h-2 w-full bg-accent/40 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (timesheetCompliance / 20) * 100)}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground">Average timesheet logs uploaded per currently active employee.</p>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
              <AlertCircle className="text-primary mt-0.5 shrink-0" size={16} />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground">Database Notice:</span> These analytics reflect database changes instantly. For customized reporting or printing logs, please use the sidebar's <span className="font-bold text-primary">Reports</span> section.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
