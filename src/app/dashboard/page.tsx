'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Clock, 
  CalendarDays, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
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
import { Button } from '@/components/ui/button';
import { useHRStore } from '@/store/hrStore';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { timesheets, leaves, leaveBalances, notifications } = useHRStore();
  const { profile } = useAuth();

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
  const welcomeName = profile?.name || 'there';

  const userTimesheets = timesheets.filter((t) => t.name === currentName);
  const userLeaves = leaves.filter((l) => l.name === currentName);
  const userBalances = leaveBalances[currentName] || [
    { type: 'Casual Leave', total: 10, used: 2, color: 'bg-indigo-500' },
    { type: 'Sick Leave', total: 8, used: 1, color: 'bg-rose-500' },
    { type: 'Paid Leave', total: 15, used: 5, color: 'bg-emerald-500' },
  ];

  const totalHours = userTimesheets.reduce((acc, curr) => acc + curr.hours, 0);

  const casualBal = userBalances.find(b => b.type === 'Casual Leave') || { total: 10, used: 2 };
  const sickBal = userBalances.find(b => b.type === 'Sick Leave') || { total: 8, used: 1 };
  const remainingLeaves = (casualBal.total - casualBal.used) + (sickBal.total - sickBal.used);

  const latestTimesheet = userTimesheets[0];
  const timesheetStatus = latestTimesheet 
    ? latestTimesheet.status.charAt(0).toUpperCase() + latestTimesheet.status.slice(1) 
    : 'No entries';

  const pendingLeavesCount = userLeaves.filter(l => l.status === 'pending').length;
  const userNotifications = notifications.filter((notification) => notification.userId === profile?.uid);

  const stats = [
    { 
      title: 'Hours Worked', 
      value: `${totalHours}h`, 
      subtitle: 'All logged entries', 
      icon: Clock, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10',
      href: '/timesheets'
    },
    { 
      title: 'Leave Balance', 
      value: `${remainingLeaves} Days`, 
      subtitle: 'Casual & Sick remaining', 
      icon: CalendarDays, 
      color: 'text-indigo-500', 
      bg: 'bg-indigo-500/10',
      href: '/leaves'
    },
    { 
      title: 'Timesheet Status', 
      value: timesheetStatus, 
      subtitle: latestTimesheet ? `Last: ${latestTimesheet.project}` : 'Awaiting logs', 
      icon: CheckCircle2, 
      color: timesheetStatus === 'Approved' ? 'text-emerald-500' : timesheetStatus === 'Pending' ? 'text-amber-500' : 'text-rose-500', 
      bg: timesheetStatus === 'Approved' ? 'bg-emerald-500/10' : timesheetStatus === 'Pending' ? 'bg-amber-500/10' : 'bg-rose-500/10',
      href: '/timesheets'
    },
    { 
      title: 'Pending Leaves', 
      value: `${pendingLeavesCount} Request${pendingLeavesCount === 1 ? '' : 's'}`, 
      subtitle: 'Awaiting HR decision', 
      icon: AlertCircle, 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10',
      href: '/leaves'
    },
  ];

  // 5. Construct productivity chart data dynamically from latest timesheets
  // Map weekdays Mon-Fri
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const chartData = daysOfWeek.map(day => {
    // Just map mock hours or calculate if dates correspond to Mon-Fri
    // For demo, we can search if there's an entry on specific dates or just map them dynamically
    let hours = 0;
    if (day === 'Mon') hours = userTimesheets.find(t => t.date.includes('12'))?.hours || 8;
    else if (day === 'Tue') hours = userTimesheets.find(t => t.date.includes('13'))?.hours || 7.5;
    else if (day === 'Wed') hours = userTimesheets.find(t => t.date.includes('14'))?.hours || 9;
    else if (day === 'Thu') hours = userTimesheets.find(t => t.date.includes('15'))?.hours || 8;
    else if (day === 'Fri') hours = userTimesheets.find(t => t.date.includes('16'))?.hours || 0;
    
    return { day, hours };
  });

  // Recent activities list from leaves & timesheets
  const recentActivities: Array<{
    time: string;
    event: string;
    desc: string;
    type: 'success' | 'info' | 'warning';
    date: Date;
  }> = [];
  
  userTimesheets.slice(0, 2).forEach(t => {
    recentActivities.push({
      time: 'Logged',
      event: `Timesheet logged - ${t.status}`,
      desc: `${t.project} - ${t.task} (${t.hours}h)`,
      type: t.status === 'approved' ? 'success' : t.status === 'pending' ? 'info' : 'warning',
      date: new Date(t.date)
    });
  });

  userLeaves.slice(0, 2).forEach(l => {
    recentActivities.push({
      time: 'Leave Request',
      event: `Leave ${l.status}`,
      desc: `${l.type} (${l.days} days) - ${l.reason}`,
      type: l.status === 'approved' ? 'success' : l.status === 'pending' ? 'info' : 'warning',
      date: new Date(l.start)
    });
  });

  // Sort activities by date/order
  recentActivities.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {welcomeName}!</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your workspace today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="glass dark:glass-dark border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={stat.bg + " p-3 rounded-xl transition-transform group-hover:scale-110"}>
                      <stat.icon className={stat.color} size={24} />
                    </div>
                    <TrendingUp className="text-emerald-500" size={20} />
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass dark:glass-dark border-none shadow-sm p-6 lg:col-span-1">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-xl">Notifications</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              {userNotifications.length === 0 ? (
                <div className="p-6 rounded-3xl bg-accent/30 text-sm text-muted-foreground text-center">
                  No new notifications yet. HR approvals will appear here once processed.
                </div>
              ) : userNotifications.slice(0, 4).map((notification) => (
                <div key={notification.id} className="p-4 rounded-3xl bg-accent/30 border border-border/50">
                  <p className="text-sm font-semibold">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 glass dark:glass-dark border-none shadow-sm p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <CardTitle className="text-xl">Weekly Productivity</CardTitle>
                <p className="text-sm text-muted-foreground">Hours logged per day (Mon - Fri)</p>
              </div>
              <Briefcase className="text-muted-foreground" size={20} />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.hours > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="glass dark:glass-dark border-none shadow-sm p-6 flex flex-col justify-between">
            <div>
              <CardTitle className="text-xl mb-6">Recent Activities</CardTitle>
              <div className="space-y-6">
                {recentActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-4">No recent activities recorded.</p>
                ) : recentActivities.slice(0, 4).map((activity, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        activity.type === 'success' ? 'bg-emerald-500' :
                        activity.type === 'info' ? 'bg-blue-500' : 'bg-rose-500'
                      )} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{activity.event}</p>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{activity.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Link href="/timesheets" className="w-full mt-6">
              <Button variant="outline" className="w-full rounded-xl border-dashed border-2 hover:border-primary hover:bg-primary/5">
                View All History
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
