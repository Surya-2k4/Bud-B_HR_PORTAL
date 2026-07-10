'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Mail,
  Phone,
  Building2,
  Calendar,
  UserPlus
} from 'lucide-react';
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import Link from 'next/link';

const statusMap = {
  active: { label: 'Active', color: 'bg-emerald-500/10 text-emerald-500' },
  'on-leave': { label: 'On Leave', color: 'bg-amber-500/10 text-amber-500' },
  inactive: { label: 'Inactive', color: 'bg-slate-500/10 text-slate-500' },
};

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

export default function EmployeesPage() {
  const [mounted, setMounted] = useState(false);
  const { employees, departments, addEmployee, updateEmployee, deactivateEmployee, activateEmployee, deleteEmployee } = useHRStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<null | typeof employees[0]>(null);
  const [confirmNameInput, setConfirmNameInput] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<null | typeof employees[0]>(null);
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

  const [formData, setFormData] = useState({
    name: '',
    employeeNumber: '',
    role: '',
    dept: '',
    email: '',
    joinDate: '',
    phone: '',
    password: '',
    aadhar: '',
    pan: '',
    address: ''
  });
  const [editFormData, setEditFormData] = useState({
    employeeId: '',
    role: '',
    dept: '',
    status: 'active',
    joinDate: '',
    phone: '',
    aadhar: '',
    pan: '',
    address: ''
  });

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    const employeeName = employeeToDelete.name || employeeToDelete.email;
    if (confirmNameInput.trim().toLowerCase() !== employeeName.trim().toLowerCase()) {
      toast.error("Confirmation name does not match.");
      return;
    }
    try {
      await deleteEmployee(employeeToDelete.id);
      setIsDeleteModalOpen(false);
      setEmployeeToDelete(null);
      setConfirmNameInput('');
      toast.success("Employee deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete employee.");
    }
  };

  const { role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (role && role !== 'hr') {
      router.push('/dashboard');
    }
  }, [role, router]);

  if (!mounted || role !== 'hr') {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.dept.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.employeeNumber || !formData.role || !formData.dept || !formData.email || !formData.joinDate || !formData.phone || !formData.password || !formData.aadhar || !formData.pan || !formData.address) {
      toast.error('Please fill all fields');
      return;
    }

    const employeeNumber = formData.employeeNumber.replace(/[^0-9]/g, '');
    if (!employeeNumber) {
      toast.error('Employee number must contain digits only');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Initial password must be at least 6 characters.');
      return;
    }

    const cleanAadhar = formData.aadhar.replace(/[\s-]/g, '');
    if (!/^\d{12}$/.test(cleanAadhar)) {
      toast.error('Aadhaar number must be exactly 12 digits');
      return;
    }

    const cleanPan = formData.pan.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan)) {
      toast.error('PAN card must be a valid 10-character alphanumeric (e.g. ABCDE1234F)');
      return;
    }

    if (!formData.address.trim()) {
      toast.error('Address cannot be empty');
      return;
    }

    const paddedId = `BUDB${employeeNumber.padStart(3, '0')}`;

    try {
      await addEmployee({
        name: formData.name,
        employeeId: paddedId,
        role: formData.role,
        dept: formData.dept,
        email: formData.email,
        joinDate: formData.joinDate,
        phone: formData.phone,
        status: 'active',
        avatar: '',
        aadhar: formatAadhaar(cleanAadhar),
        pan: cleanPan,
        address: formData.address.trim(),
      }, formData.password);

      setIsModalOpen(false);
      setFormData({ name: '', employeeNumber: '', role: '', dept: '', email: '', joinDate: '', phone: '', password: '', aadhar: '', pan: '', address: '' });
      toast.success('Employee added successfully!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to add employee');
    }
  };

  const handleDeactivate = (id: string) => {
    deactivateEmployee(id);
    toast.info('Employee status updated to Inactive');
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) {
      return;
    }
    if (!editFormData.employeeId || !editFormData.role || !editFormData.dept || !editFormData.joinDate || !editFormData.phone || !editFormData.aadhar || !editFormData.pan || !editFormData.address) {
      toast.error('Please fill all fields');
      return;
    }

    const cleanAadhar = editFormData.aadhar.replace(/[\s-]/g, '');
    if (!/^\d{12}$/.test(cleanAadhar)) {
      toast.error('Aadhaar number must be exactly 12 digits');
      return;
    }

    const cleanPan = editFormData.pan.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan)) {
      toast.error('PAN card must be a valid 10-character alphanumeric (e.g. ABCDE1234F)');
      return;
    }

    if (!editFormData.address.trim()) {
      toast.error('Address cannot be empty');
      return;
    }

    await updateEmployee(selectedEmployee.id, {
      employeeId: editFormData.employeeId,
      role: editFormData.role,
      dept: editFormData.dept,
      status: editFormData.status as 'active' | 'on-leave' | 'inactive',
      joinDate: editFormData.joinDate,
      phone: editFormData.phone,
      aadhar: formatAadhaar(cleanAadhar),
      pan: cleanPan,
      address: editFormData.address.trim(),
    });

    setIsEditModalOpen(false);
    setSelectedEmployee(null);
    toast.success('Employee profile updated successfully!');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
            <p className="text-muted-foreground mt-1">Manage your team members and their roles.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/hr/organization">
              <Button variant="outline" className="rounded-xl gap-2 border-border/50">
                <Building2 size={18} /> Departments
              </Button>
            </Link>
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger render={
                <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20">
                  <UserPlus size={18} /> Add Employee
                </Button>
              } />
              <DialogContent className="sm:max-w-[425px] rounded-[24px] glass dark:glass-dark border-border/50">
                <form onSubmit={handleAddEmployee}>
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Add Team Member</DialogTitle>
                    <DialogDescription>
                      Create a new profile for an employee in the system.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Full Name</Label>
                      <Input 
                        placeholder="John Doe" 
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Initial Password</Label>
                      <Input 
                        type="password"
                        placeholder="Minimum 6 characters" 
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">Employee ID</Label>
                        <div className="flex rounded-xl overflow-hidden border border-border/50 bg-accent/30">
                          <span className="inline-flex items-center px-3 text-sm font-semibold text-muted-foreground bg-slate-950/5 border-r border-border/50">BUDB</span>
                          <Input
                            placeholder="001"
                            className="h-12 rounded-none rounded-r-xl bg-transparent border-none focus:ring-0"
                            value={formData.employeeNumber}
                            onChange={(e) => setFormData({...formData, employeeNumber: e.target.value.replace(/[^0-9]/g, '')})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">Work Email</Label>
                        <Input 
                          type="email"
                          placeholder="john@budbinnovations.com" 
                          className="h-12 rounded-xl bg-accent/30 border-none"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">Role</Label>
                        <Input 
                          placeholder="e.g. Developer" 
                          className="h-12 rounded-xl bg-accent/30 border-none"
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">Department</Label>
                        <Select onValueChange={(v) => setFormData({...formData, dept: v as string})}>
                          <SelectTrigger className="w-full h-12 rounded-xl bg-accent/30 border-none text-left">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.length > 0 ? (
                              departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                              ))
                            ) : (
                              <>
                                <SelectItem value="Engineering">Engineering</SelectItem>
                                <SelectItem value="Product">Product</SelectItem>
                                <SelectItem value="Design">Design</SelectItem>
                                <SelectItem value="Marketing">Marketing</SelectItem>
                                <SelectItem value="Human Resources">Human Resources</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">Joined Month</Label>
                        <Input
                          placeholder="Mar 2025"
                          className="h-12 rounded-xl bg-accent/30 border-none"
                          value={formData.joinDate}
                          onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">Phone</Label>
                        <Input
                          placeholder="+91 98765 43210"
                          className="h-12 rounded-xl bg-accent/30 border-none"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">Aadhaar Number</Label>
                        <Input
                          placeholder="1234 5678 9012"
                          className="h-12 rounded-xl bg-accent/30 border-none"
                          value={formData.aadhar}
                          onChange={(e) => setFormData({ ...formData, aadhar: formatAadhaar(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">PAN Card</Label>
                        <Input
                          placeholder="ABCDE1234F"
                          className="h-12 rounded-xl bg-accent/30 border-none"
                          value={formData.pan}
                          onChange={(e) => setFormData({ ...formData, pan: formatPAN(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Address</Label>
                      <Input
                        placeholder="123 Main St, Bangalore, India"
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full h-12 rounded-xl font-bold">Create Profile</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={isEditModalOpen} onOpenChange={(open) => {
              setIsEditModalOpen(open);
              if (!open) setSelectedEmployee(null);
            }}>
              <DialogContent className="sm:max-w-[425px] rounded-[24px] glass dark:glass-dark border-border/50">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleEditEmployee();
                  }}
                >
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Edit Team Member</DialogTitle>
                    <DialogDescription>
                      Update the department and status for the selected employee.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Employee ID</Label>
                      <Input
                        placeholder="BUDB001"
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={editFormData.employeeId}
                        onChange={(e) => setEditFormData({ ...editFormData, employeeId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Joined Month</Label>
                      <Input
                        placeholder="Mar 2025"
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={editFormData.joinDate}
                        onChange={(e) => setEditFormData({ ...editFormData, joinDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Phone</Label>
                      <Input
                        placeholder="+91 98765 43210"
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">Aadhaar Number</Label>
                        <Input
                          placeholder="1234 5678 9012"
                          className="h-12 rounded-xl bg-accent/30 border-none"
                          value={editFormData.aadhar}
                          onChange={(e) => setEditFormData({ ...editFormData, aadhar: formatAadhaar(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">PAN Card</Label>
                        <Input
                          placeholder="ABCDE1234F"
                          className="h-12 rounded-xl bg-accent/30 border-none"
                          value={editFormData.pan}
                          onChange={(e) => setEditFormData({ ...editFormData, pan: formatPAN(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Address</Label>
                      <Input
                        placeholder="123 Main St, Bangalore, India"
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Role</Label>
                      <Input
                        placeholder="e.g. Developer"
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={editFormData.role}
                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Department</Label>
                      <Select onValueChange={(v) => setEditFormData({ ...editFormData, dept: v as string })} value={editFormData.dept}>
                        <SelectTrigger className="w-full h-12 rounded-xl bg-accent/30 border-none text-left">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.length > 0 ? (
                            departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="Engineering">Engineering</SelectItem>
                              <SelectItem value="Human Resources">Human Resources</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Status</Label>
                      <select
                        className="w-full h-12 rounded-xl bg-accent/30 border-none px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      >
                        <option value="active">Active</option>
                        <option value="on-leave">On Leave</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full h-12 rounded-xl font-bold">Save Changes</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
              <DialogContent className="sm:max-w-[425px] rounded-[24px] glass dark:glass-dark border-border/50">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-destructive">Delete Employee</DialogTitle>
                  <DialogDescription className="text-sm mt-2">
                    This action will permanently delete the employee profile and user account for <strong className="text-foreground">{employeeToDelete?.name || employeeToDelete?.email}</strong>. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-xs text-muted-foreground">
                    To confirm, please type the employee's name: <strong className="text-foreground select-none">{employeeToDelete?.name || employeeToDelete?.email}</strong>
                  </p>
                  <Input 
                    placeholder="Type employee's name here"
                    className="h-12 rounded-xl bg-accent/30 border-none"
                    value={confirmNameInput}
                    onChange={(e) => setConfirmNameInput(e.target.value)}
                  />
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button 
                    variant="secondary" 
                    className="rounded-xl h-12" 
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setEmployeeToDelete(null);
                      setConfirmNameInput('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive"
                    className="rounded-xl h-12"
                    disabled={confirmNameInput.trim().toLowerCase() !== (employeeToDelete?.name || employeeToDelete?.email || '').trim().toLowerCase()}
                    onClick={handleDeleteEmployee}
                  >
                    Confirm Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Search by name, role, or department..." 
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
              <DropdownMenuItem onClick={() => setStatusFilter('active')} className="rounded-xl p-3 cursor-pointer focus:bg-emerald-500 focus:text-white focus:**:text-white text-emerald-500 transition-colors font-medium">Active Only</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('on-leave')} className="rounded-xl p-3 cursor-pointer focus:bg-amber-500/10 text-amber-500 transition-colors font-medium">On Leave</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('inactive')} className="rounded-xl p-3 cursor-pointer focus:bg-slate-500/10 text-slate-500 transition-colors font-medium">Inactive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card className="glass dark:glass-dark border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="py-4 font-bold text-foreground text-center w-[300px]">Employee</TableHead>
                <TableHead className="py-4 font-bold text-foreground text-center">Employee ID</TableHead>
                <TableHead className="py-4 font-bold text-foreground text-center">Department</TableHead>
                <TableHead className="py-4 font-bold text-foreground text-center">Status</TableHead>
                <TableHead className="py-4 font-bold text-foreground text-center">Joined</TableHead>
                <TableHead className="py-4 font-bold text-foreground text-center">Contact</TableHead>
                <TableHead className="py-4 font-bold text-foreground text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground italic">No employees found matching your search</TableCell>
                </TableRow>
              ) : filteredEmployees.map((emp) => {
                const status = statusMap[emp.status as keyof typeof statusMap] || statusMap.active;
                return (
                  <TableRow key={emp.id} className="border-border/50 group">
                    <TableCell className="py-5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-primary/10">
                          <AvatarImage src={emp.avatar} />
                          <AvatarFallback>{(emp.name || emp.email).split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-foreground">{emp.name || emp.email}</span>
                          <span className="text-xs text-muted-foreground">{emp.role || 'Employee'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 text-center">
                      <span className="text-sm font-medium">{emp.employeeId || '—'}</span>
                    </TableCell>
                    <TableCell className="py-5 text-center">
                      <span className="text-sm font-medium">{emp.dept || '—'}</span>
                    </TableCell>
                    <TableCell className="py-5 text-center">
                      <div className="flex justify-center">
                        <Badge variant="secondary" className={cn("px-3 py-1 rounded-full border-none font-medium text-xs", status.color)}>
                          {status.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 text-center">
                      <span className="text-sm font-medium">{emp.joinDate || '—'}</span>
                    </TableCell>
                    <TableCell className="py-5 text-center">
                      <div className="space-y-1">
                        <a href={`mailto:${emp.email}`} className="block text-sm font-medium text-primary hover:underline">{emp.email}</a>
                        <p className="text-xs text-muted-foreground">{emp.phone || 'No phone'}</p>
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
                        <DropdownMenuContent align="end" className="rounded-xl w-48">
                          <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-primary focus:text-white focus:**:text-white">
                            <Calendar size={16} /> View Schedule
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer gap-2 focus:bg-primary focus:text-white focus:**:text-white"
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setEditFormData({
                                employeeId: emp.employeeId || '',
                                role: emp.role,
                                dept: emp.dept,
                                status: emp.status,
                                joinDate: emp.joinDate || '',
                                phone: emp.phone || '',
                                aadhar: emp.aadhar || '',
                                pan: emp.pan || '',
                                address: emp.address || '',
                              });
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Building2 size={16} /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {emp.status === 'inactive' ? (
                            <DropdownMenuItem 
                              className="cursor-pointer text-emerald-600 dark:text-emerald-400 focus:text-white focus:bg-emerald-500 focus:**:text-white"
                              onClick={() => {
                                activateEmployee(emp.id);
                                toast.success("Employee status updated to Active");
                              }}
                            >
                              Activate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              className="cursor-pointer text-destructive focus:text-white focus:bg-destructive focus:**:text-white"
                              onClick={() => handleDeactivate(emp.id)}
                            >
                              Deactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="cursor-pointer text-destructive font-semibold focus:text-white focus:bg-destructive focus:**:text-white"
                            onClick={() => {
                              setEmployeeToDelete(emp);
                              setConfirmNameInput('');
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            Delete Employee
                          </DropdownMenuItem>
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
