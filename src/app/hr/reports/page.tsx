'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useHRStore } from '@/store/hrStore';
import { 
  FileText, 
  Search, 
  Printer, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Fallback default balances if none exist in firebase yet
const defaultBalances = [
  { type: 'Casual Leave', total: 10, used: 0, color: 'bg-indigo-500' },
  { type: 'Sick Leave', total: 8, used: 0, color: 'bg-rose-500' },
  { type: 'Paid Leave', total: 15, used: 0, color: 'bg-emerald-500' },
];

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  const [employeeIdInput, setEmployeeIdInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEmployee, setActiveEmployee] = useState<any>(null);

  const { employees, leaves, timesheets, leaveBalances } = useHRStore();

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter an Employee ID');
      return;
    }

    const matchedEmp = employees.find(
      (emp) => emp.employeeId?.toLowerCase() === searchQuery.trim().toLowerCase()
    );

    if (matchedEmp) {
      setActiveEmployee(matchedEmp);
      setEmployeeIdInput(searchQuery.trim());
      toast.success(`Loaded report for ${matchedEmp.name}`);
    } else {
      toast.error(`Employee ID "${searchQuery}" not found`);
    }
  };

  // Find all leaves for active employee
  const employeeLeaves = activeEmployee
    ? leaves.filter(
        (l) =>
          l.userId === activeEmployee.id ||
          l.name.toLowerCase() === activeEmployee.name.toLowerCase()
      )
    : [];

  // Find all timesheets for active employee
  const employeeTimesheets = activeEmployee
    ? timesheets.filter(
        (t) =>
          t.userId === activeEmployee.id ||
          t.name.toLowerCase() === activeEmployee.name.toLowerCase()
      )
    : [];

  // Find leave balances
  const rawBalances = activeEmployee ? leaveBalances[activeEmployee.name] : null;
  const employeeBalances = rawBalances && rawBalances.length > 0 
    ? rawBalances 
    : defaultBalances;

  // Working Hours calculations
  // Target is 160h
  const targetHours = 160;
  const approvedHours = employeeTimesheets
    .filter((t) => t.status === 'approved')
    .reduce((sum, t) => sum + t.hours, 0);
  const remainingHours = Math.max(0, targetHours - approvedHours);

  // Leave calculations
  const totalAccrued = employeeBalances.reduce((sum, b) => sum + b.total, 0);
  const totalUsedLeaves = employeeBalances.reduce((sum, b) => sum + b.used, 0);
  const totalRemainingLeaves = Math.max(0, totalAccrued - totalUsedLeaves);

  const statusColors = {
    approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Style block for print formatting */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            /* Hide UI controls */
            aside, nav, header, button, .no-print, [role="navigation"], .no-print-wrapper {
              display: none !important;
            }
            /* Reset body styling for paper layout */
            body, html, main, div.flex, div.flex-1 {
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              height: auto !important;
              display: block !important;
              box-shadow: none !important;
              border: none !important;
            }
            /* Printable report content container */
            .print-report-container {
              background: white !important;
              color: black !important;
              padding: 40px !important;
              margin: 0 !important;
              width: 100% !important;
              display: block !important;
            }
            .print-card {
              background: transparent !important;
              border: 1px solid #e2e8f0 !important;
              box-shadow: none !important;
              color: black !important;
              border-radius: 12px !important;
              padding: 20px !important;
              margin-bottom: 24px !important;
            }
            h1, h2, h3, h4, p, span, td, th {
              color: black !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin-top: 15px !important;
            }
            th, td {
              border: 1px solid #cbd5e1 !important;
              padding: 8px 12px !important;
              text-align: center !important;
              color: black !important;
            }
            th {
              background-color: #f8fafc !important;
              font-weight: bold !important;
            }
            .badge-print {
              border: 1px solid #000 !important;
              background: transparent !important;
              color: black !important;
            }
            .page-break {
              page-break-before: always;
            }
          }
        `}} />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Employee Reports</h1>
            <p className="text-muted-foreground mt-1">Visualize and export comprehensive employee summaries.</p>
          </div>
          {activeEmployee && (
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => window.print()} 
                className="rounded-xl gap-2 shadow-lg shadow-primary/20"
              >
                <Printer size={18} /> Print / Save as PDF
              </Button>
            </div>
          )}
        </div>

        {/* Search Input Card */}
        <Card className="glass dark:glass-dark border-none shadow-sm no-print">
          <CardHeader>
            <CardTitle>Search Employee Directory</CardTitle>
            <CardDescription>Enter the Employee ID below to retrieve leaf balances, logs, and timesheet reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="e.g. BUDB001"
                  className="pl-10 rounded-xl bg-accent/30 border-none h-12 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="rounded-xl h-12 px-6">
                Generate Report
              </Button>
            </form>
          </CardContent>
        </Card>

        {activeEmployee ? (
          <div className="print-report-container space-y-8">
            
            {/* Header for print only */}
            <div className="hidden print:flex flex-row items-center justify-between border-b pb-6 mb-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">BUD-B Innovations</h2>
                <p className="text-sm text-slate-500 font-medium mt-0.5">HR Employee Summary & Logs Report</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Report Generated On</p>
                <p className="font-semibold text-slate-800">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Profile Overview Card */}
            <Card className="glass dark:glass-dark border-none shadow-sm p-6 print-card">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/20 print:border-slate-300">
                    <User size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{activeEmployee.name}</h2>
                    <p className="text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                      <Briefcase size={14} className="text-primary" /> {activeEmployee.role}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span className="font-semibold px-2.5 py-0.5 bg-primary/10 text-primary rounded-full print:border print:border-slate-400 print:text-black">
                        ID: {activeEmployee.employeeId || 'BUDB—'}
                      </span>
                      <span>•</span>
                      <span>Dept: {activeEmployee.dept}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-8">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={16} className="text-muted-foreground" />
                    <span className="text-foreground font-semibold">{activeEmployee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={16} className="text-muted-foreground" />
                    <span className="text-foreground font-semibold">{activeEmployee.phone || 'No phone recorded'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-muted-foreground" />
                    <span className="text-foreground font-semibold">Joined: {activeEmployee.joinDate || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={16} className="text-muted-foreground" />
                    <span className="text-foreground font-semibold">Status: <span className="capitalize">{activeEmployee.status}</span></span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Stat summaries Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Leaves Summary Card */}
              <Card className="glass dark:glass-dark border-none shadow-sm p-6 print-card">
                <CardHeader className="p-0 pb-4 mb-4 border-b border-border/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="text-primary" size={20} /> Leaves Summary
                  </CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-primary/5 p-3 rounded-xl print:border print:border-slate-200">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Accrued</p>
                      <h4 className="text-2xl font-bold mt-1 text-slate-800">{totalAccrued}</h4>
                    </div>
                    <div className="bg-amber-500/5 p-3 rounded-xl print:border print:border-slate-200">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Used</p>
                      <h4 className="text-2xl font-bold mt-1 text-amber-500">{totalUsedLeaves}</h4>
                    </div>
                    <div className="bg-emerald-500/5 p-3 rounded-xl print:border print:border-slate-200">
                      <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Remaining</p>
                      <h4 className="text-2xl font-bold mt-1 text-emerald-500">{totalRemainingLeaves}</h4>
                    </div>
                  </div>

                  <div className="divide-y divide-border/50 pt-2">
                    {employeeBalances.map((balance, index) => {
                      const avail = Math.max(0, balance.total - balance.used);
                      return (
                        <div key={`${balance.type || 'balance'}-${index}`} className="flex justify-between items-center py-3">
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", balance.color || 'bg-slate-400')} />
                            <span className="font-semibold text-sm">{balance.type}</span>
                          </div>
                          <div className="text-sm font-bold">
                            {balance.used} used <span className="text-muted-foreground font-normal">/ {balance.total} total</span>
                            <span className="ml-3 text-emerald-500">({avail} left)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              {/* Working Hours Card */}
              <Card className="glass dark:glass-dark border-none shadow-sm p-6 print-card">
                <CardHeader className="p-0 pb-4 mb-4 border-b border-border/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="text-primary" size={20} /> Working Hours Summary
                  </CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-primary/5 p-3 rounded-xl print:border print:border-slate-200">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Target</p>
                      <h4 className="text-2xl font-bold mt-1 text-slate-800">{targetHours}h</h4>
                    </div>
                    <div className="bg-emerald-500/5 p-3 rounded-xl print:border print:border-slate-200">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Logged</p>
                      <h4 className="text-2xl font-bold mt-1 text-emerald-500">{approvedHours}h</h4>
                    </div>
                    <div className="bg-amber-500/5 p-3 rounded-xl print:border print:border-slate-200">
                      <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Remaining</p>
                      <h4 className="text-2xl font-bold mt-1 text-amber-500">{remainingHours}h</h4>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-muted-foreground">Approved Progress</span>
                        <span>{Math.min(100, Math.round((approvedHours / targetHours) * 100))}%</span>
                      </div>
                      <div className="w-full bg-accent/50 rounded-full h-3 overflow-hidden border border-border/20 print:border-slate-300">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (approvedHours / targetHours) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl bg-accent/30 p-4 border border-border/20 print:bg-slate-50 print:border-slate-200">
                      <h5 className="font-bold text-xs uppercase tracking-wider mb-2 text-foreground">Timesheet Statistics</h5>
                      <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                        <div>
                          <p className="text-muted-foreground">Approved Entries</p>
                          <p className="text-lg font-bold text-emerald-500">{employeeTimesheets.filter(t => t.status === 'approved').length}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pending Approval</p>
                          <p className="text-lg font-bold text-amber-500">{employeeTimesheets.filter(t => t.status === 'pending').length} ({employeeTimesheets.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.hours, 0)}h)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

            </div>

            {/* Leaves Request History */}
            <Card className="glass dark:glass-dark border-none shadow-sm overflow-hidden print-card page-break">
              <CardHeader className="border-b border-border/50 p-6">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="text-primary" size={20} /> Leave Request History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table suppressHydrationWarning>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="py-4 font-bold text-foreground text-center">Type</TableHead>
                        <TableHead className="py-4 font-bold text-foreground text-center">Dates</TableHead>
                        <TableHead className="py-4 font-bold text-foreground text-center">Days</TableHead>
                        <TableHead className="py-4 font-bold text-foreground text-center">Reason</TableHead>
                        <TableHead className="py-4 font-bold text-foreground text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeLeaves.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">No leave history recorded</TableCell>
                        </TableRow>
                      ) : (
                        employeeLeaves.map((leave) => (
                          <TableRow key={leave.id} className="border-border/50">
                            <TableCell className="py-4 font-semibold text-center">{leave.type}</TableCell>
                            <TableCell className="py-4 text-center">
                              {new Date(leave.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(leave.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="py-4 font-bold text-center">{leave.days}</TableCell>
                            <TableCell className="py-4 text-center text-muted-foreground italic">"{leave.reason}"</TableCell>
                            <TableCell className="py-4 text-center">
                              <div className="flex justify-center">
                                <Badge 
                                  variant="secondary" 
                                  className={cn("px-3 py-1 rounded-full border border-transparent font-semibold capitalize", statusColors[leave.status] || 'bg-slate-400/10 text-slate-400')}
                                >
                                  {leave.status}
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Timesheets Log History */}
            <Card className="glass dark:glass-dark border-none shadow-sm overflow-hidden print-card page-break">
              <CardHeader className="border-b border-border/50 p-6">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileSpreadsheet className="text-primary" size={20} /> Timesheet Log History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table suppressHydrationWarning>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="py-4 font-bold text-foreground text-center">Date</TableHead>
                        <TableHead className="py-4 font-bold text-foreground text-center">Project</TableHead>
                        <TableHead className="py-4 font-bold text-foreground text-center">Task Details</TableHead>
                        <TableHead className="py-4 font-bold text-foreground text-center">Hours</TableHead>
                        <TableHead className="py-4 font-bold text-foreground text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeTimesheets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">No timesheet history logged</TableCell>
                        </TableRow>
                      ) : (
                        employeeTimesheets.map((ts) => (
                          <TableRow key={ts.id} className="border-border/50">
                            <TableCell className="py-4 font-medium text-center">
                              {new Date(ts.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="py-4 font-semibold text-center">{ts.project}</TableCell>
                            <TableCell className="py-4 text-center text-muted-foreground">{ts.task}</TableCell>
                            <TableCell className="py-4 font-bold text-center text-lg">{ts.hours}h</TableCell>
                            <TableCell className="py-4 text-center">
                              <div className="flex justify-center">
                                <Badge 
                                  variant="secondary" 
                                  className={cn("px-3 py-1 rounded-full border border-transparent font-semibold capitalize", statusColors[ts.status] || 'bg-slate-400/10 text-slate-400')}
                                >
                                  {ts.status}
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            
          </div>
        ) : (
          <Card className="glass dark:glass-dark border-none shadow-sm py-24 text-center text-muted-foreground italic flex flex-col items-center justify-center space-y-4">
            <FileText size={48} className="text-muted-foreground/50 animate-bounce" />
            <div>
              <p className="text-base font-semibold">No active report loaded</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">Please enter an Employee ID above to compile and view statistics and printable summaries.</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
