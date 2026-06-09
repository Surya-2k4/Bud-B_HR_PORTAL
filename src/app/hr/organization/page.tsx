'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  Search, 
  Filter, 
  ChevronRight,
  ArrowUpRight,
  UserPlus,
  Briefcase,
  Plus,
  MoreVertical,
  Calendar,
  Clock,
  CheckCircle2,
  Edit3,
  Trash2
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useHRStore } from '@/store/hrStore';
import Link from 'next/link';

export default function HROrganizationPage() {
  const [mounted, setMounted] = useState(false);
  const { departments, employees, projects, createDepartment, createProject, archiveProject, updateProject, updateDepartment, deleteDepartment } = useHRStore();
  const [activeTab, setActiveTab] = useState<'departments' | 'employees' | 'projects'>('departments');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', lead: '' });
  const [editingDept, setEditingDept] = useState<{ id: string; name: string; lead: string }>({ id: '', name: '', lead: '' });
  const [isEditDeptModalOpen, setIsEditDeptModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', client: '', dueDate: '', members: [] as string[] });
  const [editingProject, setEditingProject] = useState<{id: string, name: string, client: string, dueDate: string, status: string, members: string[]}>({ id: '', name: '', client: '', dueDate: '', status: 'active', members: [] });
  
  const statusMap = {
    active: { label: 'Active', color: 'bg-blue-500/10 text-blue-500', icon: Clock },
    completed: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle2 },
    'on-hold': { label: 'On Hold', color: 'bg-amber-500/10 text-amber-500', icon: Clock },
  };

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

  const filteredDepts = departments.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dept.lead.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.name || !newDept.lead) {
      toast.error('Please fill all fields');
      return;
    }

    createDepartment({
      name: newDept.name,
      lead: newDept.lead
    });

    setIsModalOpen(false);
    setNewDept({ name: '', lead: '' });
    toast.success('Department established successfully!');
  };

  const handleEditDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept.name || !editingDept.lead) {
      toast.error('Please fill all fields');
      return;
    }

    updateDepartment(editingDept.id, {
      name: editingDept.name,
      lead: editingDept.lead,
    });
    setIsEditDeptModalOpen(false);
    setEditingDept({ id: '', name: '', lead: '' });
    toast.success('Department updated successfully!');
  };

  const handleDeleteDept = (id: string) => {
    if (!window.confirm('Remove this department? This cannot be undone.')) {
      return;
    }
    deleteDepartment(id);
    toast.success('Department removed successfully!');
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.client || !newProject.dueDate) {
      toast.error('Please fill all fields');
      return;
    }
    
    createProject({
      name: newProject.name,
      client: newProject.client,
      dueDate: newProject.dueDate,
      members: newProject.members,
    });
    
    setIsProjectModalOpen(false);
    setNewProject({ name: '', client: '', dueDate: '', members: [] });
    toast.success('Project created successfully!');
  };

  const handleEditProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject.name || !editingProject.client || !editingProject.dueDate) {
      toast.error('Please fill all fields');
      return;
    }
    
    updateProject(editingProject.id, {
      name: editingProject.name,
      client: editingProject.client,
      dueDate: editingProject.dueDate,
      status: editingProject.status as 'active' | 'completed' | 'on-hold',
      members: editingProject.members,
    });
    
    setIsEditProjectModalOpen(false);
    toast.success('Project updated successfully!');
  };

  const openEditProjectModal = (project: any) => {
    setEditingProject({
      id: project.id,
      name: project.name,
      client: project.client,
      dueDate: project.dueDate,
      status: project.status,
      members: project.members || [],
    });
    setIsEditProjectModalOpen(true);
  };

  const filteredProjects = projects.filter(project => {
    return project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           project.client.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organization</h1>
            <p className="text-muted-foreground mt-1">Manage departments, reporting lines, and company structure.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/employees">
              <Button variant="outline" className="rounded-xl gap-2 border-border/50">
                <ArrowUpRight size={18} /> View Global Directory
              </Button>
            </Link>
            {activeTab === 'departments' && (
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger render={
                  <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20">
                    <Building2 size={18} /> New Department
                  </Button>
                } />
                <DialogContent className="sm:max-w-[425px] rounded-[24px] glass dark:glass-dark border-border/50">
                  <form onSubmit={handleCreateDept}>
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold">Create Department</DialogTitle>
                      <DialogDescription>
                        Add a new functional unit to your organization.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">Department Name</Label>
                        <Input 
                          placeholder="e.g. Finance" 
                          className="h-12 rounded-xl bg-accent/30 border-none"
                          value={newDept.name}
                          onChange={(e) => setNewDept({...newDept, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">Department Lead</Label>
                        <Input 
                          placeholder="e.g. Alice Smith" 
                          className="h-12 rounded-xl bg-accent/30 border-none"
                          value={newDept.lead}
                          onChange={(e) => setNewDept({...newDept, lead: e.target.value})}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full h-12 rounded-xl font-bold">Establish Department</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            <Dialog open={isEditDeptModalOpen} onOpenChange={setIsEditDeptModalOpen}>
              <DialogContent className="sm:max-w-[425px] rounded-[24px] glass dark:glass-dark border-border/50">
                <form onSubmit={handleEditDeptSubmit}>
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Edit Department</DialogTitle>
                    <DialogDescription>
                      Update the department name or lead.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Department Name</Label>
                      <Input 
                        placeholder="e.g. Finance"
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={editingDept.name}
                        onChange={(e) => setEditingDept({...editingDept, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Department Lead</Label>
                      <Input 
                        placeholder="e.g. Alice Smith"
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={editingDept.lead}
                        onChange={(e) => setEditingDept({...editingDept, lead: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full h-12 rounded-xl font-bold">Save Changes</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {activeTab === 'projects' && (
              <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
                <DialogTrigger render={
                  <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20">
                    <Plus size={18} /> New Project
                  </Button>
                } />
                <DialogContent className="sm:max-w-[500px] rounded-[24px] glass dark:glass-dark border-border/50">
                  <form onSubmit={handleCreateProject}>
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold">Launch New Project</DialogTitle>
                      <DialogDescription>Define project scope and timeline.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">Project Name</Label>
                        <Input 
                          placeholder="e.g. AI Engine Integration" 
                          className="h-12 rounded-xl bg-accent/30 border-none"
                          value={newProject.name}
                          onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">Client / Department</Label>
                        <Input 
                          placeholder="e.g. Marketing Dept" 
                          className="h-12 rounded-xl bg-accent/30 border-none"
                          value={newProject.client}
                          onChange={(e) => setNewProject({...newProject, client: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">Team Members</Label>
                        <select
                          multiple
                          className="w-full h-32 rounded-xl bg-accent/30 border-none px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          value={newProject.members}
                          onChange={(e) => {
                            const values = Array.from(e.target.selectedOptions, option => option.value);
                            setNewProject({ ...newProject, members: values });
                          }}
                        >
                          {employees.length > 0 ? (
                            employees.map((emp) => (
                              <option key={emp.id} value={emp.name}>{emp.name}</option>
                            ))
                          ) : (
                            <>
                              <option value="John Doe">John Doe</option>
                              <option value="Jane Smith">Jane Smith</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">Due Date</Label>
                        <Input 
                          type="date"
                          className="h-12 rounded-xl bg-accent/30 border-none"
                          value={newProject.dueDate}
                          onChange={(e) => setNewProject({...newProject, dueDate: e.target.value})}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full h-12 rounded-xl font-bold">Initialize Project</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            <Dialog open={isEditProjectModalOpen} onOpenChange={setIsEditProjectModalOpen}>
              <DialogContent className="sm:max-w-[500px] rounded-[24px] glass dark:glass-dark border-border/50">
                <form onSubmit={handleEditProjectSubmit}>
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Edit Project</DialogTitle>
                    <DialogDescription>Update project scope, timeline, and status.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Project Name</Label>
                      <Input 
                        placeholder="e.g. AI Engine Integration" 
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={editingProject.name}
                        onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Client / Department</Label>
                      <Input 
                        placeholder="e.g. Marketing Dept" 
                        className="h-12 rounded-xl bg-accent/30 border-none"
                        value={editingProject.client}
                        onChange={(e) => setEditingProject({...editingProject, client: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase tracking-widest ml-1">Team Members</Label>
                      <select
                        multiple
                        className="w-full h-32 rounded-xl bg-accent/30 border-none px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={editingProject.members}
                        onChange={(e) => {
                          const values = Array.from(e.target.selectedOptions, option => option.value);
                          setEditingProject({ ...editingProject, members: values });
                        }}
                      >
                        {employees.length > 0 ? (
                          employees.map((emp) => (
                            <option key={emp.id} value={emp.name}>{emp.name}</option>
                          ))
                        ) : (
                          <>
                            <option value="John Doe">John Doe</option>
                            <option value="Jane Smith">Jane Smith</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">Due Date</Label>
                        <Input 
                          type="date"
                          className="h-12 rounded-xl bg-accent/30 border-none"
                          value={editingProject.dueDate}
                          onChange={(e) => setEditingProject({...editingProject, dueDate: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest ml-1">Status</Label>
                        <select 
                          className="w-full h-12 rounded-xl bg-accent/30 border-none px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          value={editingProject.status}
                          onChange={(e) => setEditingProject({...editingProject, status: e.target.value})}
                        >
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="on-hold">On Hold</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full h-12 rounded-xl font-bold">Save Changes</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex gap-6 border-b border-border/50 items-center justify-between">
          <div className="flex gap-6">
            <button 
              suppressHydrationWarning
              onClick={() => setActiveTab('departments')}
              className={cn(
                "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative",
                activeTab === 'departments' ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Departments
              {activeTab === 'departments' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
            </button>
            <button 
              suppressHydrationWarning
              onClick={() => setActiveTab('employees')}
              className={cn(
                "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative",
                activeTab === 'employees' ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              All Employees
              {activeTab === 'employees' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
            </button>
            <button 
              suppressHydrationWarning
              onClick={() => setActiveTab('projects')}
              className={cn(
                "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative",
                activeTab === 'projects' ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Projects
              {activeTab === 'projects' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
            </button>
          </div>

          {(activeTab === 'departments' || activeTab === 'projects') && (
            <div className="relative w-64 mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                placeholder={`Search ${activeTab}...`} 
                className="pl-9 h-9 rounded-xl bg-accent/30 border-none text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {activeTab === 'departments' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepts.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground italic">No departments found matching your search.</div>
            ) : filteredDepts.map((dept) => {
              // Calculate members count dynamically
              const dynamicMembers = employees.filter(e => e.dept === dept.name || (dept.name === 'Human Resources' && e.dept === 'HR')).length;
              const displayMembers = dynamicMembers > 0 ? dynamicMembers : dept.members;

              return (
                <Card key={dept.id} className="glass dark:glass-dark border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
                  <div className={cn("h-2 w-full", dept.color)} />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6 gap-4">
                      <div className="p-3 rounded-xl bg-accent/50">
                        <Building2 className="text-muted-foreground" size={24} />
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-lg text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setEditingDept({ id: dept.id, name: dept.name, lead: dept.lead });
                            setIsEditDeptModalOpen(true);
                          }}
                        >
                          <Edit3 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-lg text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteDept(dept.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{dept.name}</h3>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                      <Avatar className="h-8 w-8 border">
                        <AvatarFallback>{dept.lead[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Department Lead</span>
                        <span className="text-sm font-semibold">{dept.lead}</span>
                      </div>
                      <Link href="/employees" className="ml-auto">
                        <Button variant="ghost" size="icon" className="rounded-lg">
                          <ChevronRight size={18} />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : activeTab === 'employees' ? (
          <div className="space-y-6">
            <Card className="glass dark:glass-dark border-none shadow-sm p-6 text-center h-64 flex flex-col items-center justify-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10 text-primary">
                <Users size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Global Employee Directory</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                  As an HR Admin, you have access to the full company records, including payroll and compliance documents.
                </p>
              </div>
              <Link href="/employees">
                <Button className="rounded-xl gap-2">
                  <UserPlus size={18} /> Open Global Directory
                </Button>
              </Link>
            </Card>
          </div>
        ) : (
          <Card className="glass dark:glass-dark border-none shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-primary/5">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="py-4 font-bold text-foreground text-center">Project Name</TableHead>
                  <TableHead className="py-4 font-bold text-foreground text-center">Client / Org</TableHead>
                  <TableHead className="py-4 font-bold text-foreground text-center">Due Date</TableHead>
                  <TableHead className="py-4 font-bold text-foreground text-center">Members</TableHead>
                  <TableHead className="py-4 font-bold text-foreground text-center">Progress</TableHead>
                  <TableHead className="py-4 font-bold text-foreground text-center">Status</TableHead>
                  <TableHead className="py-4 font-bold text-foreground text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground italic">No projects found matching your search</TableCell>
                  </TableRow>
                ) : filteredProjects.map((project) => {
                  const status = statusMap[project.status as keyof typeof statusMap] || statusMap.active;
                  return (
                    <TableRow key={project.id} className="border-border/50 group">
                      <TableCell className="py-5 font-semibold text-foreground text-center">{project.name}</TableCell>
                      <TableCell className="py-5 text-muted-foreground text-center">{project.client}</TableCell>
                      <TableCell className="py-5 text-center font-medium">
                        {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        <div className="flex justify-center -space-x-2">
                          {project.members.slice(0, 3).map((m, i) => (
                            <Avatar key={i} className="h-8 w-8 border-2 border-background">
                              <AvatarFallback className="text-[10px] font-bold">{m}</AvatarFallback>
                            </Avatar>
                          ))}
                          {project.members.length > 3 && (
                            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center border-2 border-background text-[10px] font-bold z-10">
                              +{project.members.length - 3}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={project.progress} className="h-2 bg-accent w-24" />
                          <span className="text-xs font-bold">{project.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        <div className="flex justify-center">
                          <Badge variant="secondary" className={cn("rounded-full border-none px-3 py-1.5 text-xs font-medium gap-1.5", status.color)}>
                            <status.icon size={12} />
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
                            <DropdownMenuContent align="end" className="rounded-xl w-48">
                              <DropdownMenuItem className="cursor-pointer" onClick={() => openEditProjectModal(project)}>Edit Details</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => {
                                  archiveProject(project.id);
                                  toast.success('Project archived.');
                                }}
                              >
                                Archive Project
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
        )}
      </div>
    </DashboardLayout>
  );
}
