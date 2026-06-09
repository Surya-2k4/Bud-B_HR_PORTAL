'use client';

import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Target, 
  Download,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const headcountData = [
  { month: 'Jan', count: 120 },
  { month: 'Feb', count: 128 },
  { month: 'Mar', count: 135 },
  { month: 'Apr', count: 142 },
  { month: 'May', count: 156 },
];

const leaveTrends = [
  { month: 'Jan', sick: 12, casual: 25, paid: 15 },
  { month: 'Feb', sick: 15, casual: 20, paid: 12 },
  { month: 'Mar', sick: 8, casual: 30, paid: 20 },
  { month: 'Apr', sick: 10, casual: 22, paid: 18 },
  { month: 'May', sick: 18, casual: 28, paid: 25 },
];

const genderData = [
  { name: 'Male', value: 85 },
  { name: 'Female', value: 65 },
  { name: 'Non-binary', value: 6 },
];

const COLORS = ['#3b82f6', '#ec4899', '#8b5cf6'];

export default function HRAnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
            <p className="text-muted-foreground mt-1">Deep dive into organization performance and workforce trends.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl gap-2 border-border/50">
              <Calendar size={18} /> Last 6 Months
            </Button>
            <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20">
              <Download size={18} /> Export Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 glass dark:glass-dark border-none shadow-sm p-6">
            <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Headcount Growth</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Net hiring rate increased by 12% this quarter.</p>
              </div>
              <TrendingUp className="text-emerald-500" size={24} />
            </CardHeader>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={headcountData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'gray', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'gray', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', color: 'white' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="glass dark:glass-dark border-none shadow-sm p-6">
            <CardHeader className="px-0 pt-0 pb-6">
              <CardTitle className="text-xl">Workforce Diversity</CardTitle>
            </CardHeader>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', color: 'white' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 mt-6">
              {genderData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="glass dark:glass-dark border-none shadow-sm p-6">
            <CardHeader className="px-0 pt-0 pb-6">
              <CardTitle className="text-xl">Leave Utilization Trends</CardTitle>
            </CardHeader>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leaveTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'gray', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'gray', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', color: 'white' }}
                  />
                  <Line type="monotone" dataKey="sick" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="casual" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="paid" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-8 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-xs font-medium text-muted-foreground">Sick</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs font-medium text-muted-foreground">Casual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-muted-foreground">Paid</span>
              </div>
            </div>
          </Card>

          <Card className="glass dark:glass-dark border-none shadow-sm p-6">
            <div className="flex items-center justify-between mb-8">
              <CardTitle className="text-xl">Performance KPIs</CardTitle>
              <Badge className="bg-primary/10 text-primary border-none">Q2 Goal: 92%</Badge>
            </div>
            <div className="space-y-8">
              {[
                { label: 'Retention Rate', value: 94, color: 'bg-emerald-500', trend: '+2%' },
                { label: 'Time to Hire', value: 24, color: 'bg-blue-500', trend: '-3 days', sub: 'days' },
                { label: 'Employee Satisfaction', value: 88, color: 'bg-purple-500', trend: '+5%' },
              ].map((kpi) => (
                <div key={kpi.label} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{kpi.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{kpi.value}{kpi.sub || '%'}</span>
                      <span className="text-[10px] font-black text-emerald-500">{kpi.trend}</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-1000", kpi.color)} style={{ width: `${kpi.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
              <AlertCircle className="text-primary mt-0.5" size={16} />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground">AI Insight:</span> Hiring velocity has increased by 15% due to new automated screening processes. Retention remains above the industry average.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
