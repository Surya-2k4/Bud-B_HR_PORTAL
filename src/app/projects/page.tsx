'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Search, 
  Filter, 
  Briefcase,
  Users,
  Calendar,
  MoreVertical,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  AlertCircle
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';
import { useHRStore } from '@/store/hrStore';

const statusMap = {
  active: { label: 'Active', color: 'bg-blue-500/10 text-blue-500', icon: Clock },
  completed: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle2 },
  'on-hold': { label: 'On Hold', color: 'bg-amber-500/10 text-amber-500', icon: Clock },
};

import { useRouter } from 'next/navigation';

export default function ProjectsPage() {
  const [mounted, setMounted] = useState(false);
  const { role } = useAuth();
  const router = useRouter();
  const { projects, employees, createProject, archiveProject } = useHRStore();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', client: '', dueDate: '', members: [] as string[] });

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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'hr') {
      toast.error('Only HR Administrators can launch projects.');
      return;
    }
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
    
    setIsModalOpen(false);
    setNewProject({ name: '', client: '', dueDate: '', members: [] });
    toast.success('Project created successfully!');
  };

  const handleArchiveProject = (id: string) => {
    archiveProject(id);
    toast.info('Project archived successfully');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-1">Track progress and manage project assignments.</p>
          </div>
          <div className="flex gap-3">
            <div className="flex bg-accent/30 p-1 rounded-xl">
              <Button 
                variant={view === 'grid' ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-9 w-9 rounded-lg"
                onClick={() => setView('grid')}
              >
                <LayoutGrid size={18} />
              </Button>
              <Button 
                variant={view === 'list' ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-9 w-9 rounded-lg"
                onClick={() => setView('list')}
              >
                <List size={18} />
              </Button>
            </div>
            {role === 'hr' && (
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger render={
                  <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20">
                    <Plus size={18} /> New Project
                  </Button>
                } />
                <DialogContent className="sm:max-w-[500px] glass-dark border-none shadow-2xl p-0 overflow-hidden rounded-3xl">
                  <div className="h-2 w-full bg-primary" />
                  <form onSubmit={handleCreateProject} className="p-8 space-y-6">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold">Launch New Project</DialogTitle>
                      <DialogDescription>Define project scope and timeline.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
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
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Search projects or clients..." 
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
              <DropdownMenuItem onClick={() => setStatusFilter('all')} className="rounded-xl p-3 cursor-pointer focus:bg-primary/10 transition-colors font-medium">All Statuses</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={() => setStatusFilter('active')} className="rounded-xl p-3 cursor-pointer focus:bg-blue-500/10 text-blue-500 transition-colors font-medium">Active Only</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('completed')} className="rounded-xl p-3 cursor-pointer focus:bg-emerald-500/10 text-emerald-500 transition-colors font-medium">Completed</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('on-hold')} className="rounded-xl p-3 cursor-pointer focus:bg-amber-500/10 text-amber-500 transition-colors font-medium">On Hold</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground italic glass dark:glass-dark rounded-3xl">
            No projects found matching your criteria.
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="glass dark:glass-dark border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className={cn("h-2 w-full bg-gradient-to-r", project.color)} />
                <CardHeader className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{project.name}</CardTitle>
                      <CardDescription className="mt-1">{project.client}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={(props) => (
                        <Button {...props} variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <MoreVertical size={18} />
                        </Button>
                      )} />
                      <DropdownMenuContent align="end" className="rounded-xl p-2 glass dark:glass-dark border-border/50 shadow-2xl">
                        <DropdownMenuItem className="rounded-lg p-2 font-medium cursor-pointer">View Project</DropdownMenuItem>
                        {role === 'hr' && (
                          <>
                            <DropdownMenuItem className="rounded-lg p-2 font-medium cursor-pointer">Assign Employee</DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg p-2 font-medium cursor-pointer">Edit Details</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <DropdownMenuItem 
                              className="rounded-lg p-2 font-medium text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                              onClick={() => handleArchiveProject(project.id)}
                            >
                              Archive Project
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground font-medium">Progress</span>
                      <span className="font-bold">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2 bg-accent" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-3">
                      {project.members.map((m, i) => (
                        <Avatar key={i} className="h-8 w-8 border-2 border-background ring-2 ring-primary/5">
                          <AvatarFallback className="text-[10px] font-bold">{m}</AvatarFallback>
                        </Avatar>
                      ))}
                      {project.members.length > 3 && (
                        <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center border-2 border-background text-[10px] font-bold">
                          +{project.members.length - 3}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className={cn("rounded-full border-none px-3 py-1 text-xs font-medium gap-1.5", statusMap[project.status as keyof typeof statusMap]?.color || 'bg-accent text-foreground')}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {statusMap[project.status as keyof typeof statusMap]?.label || 'Active'}
                    </Badge>
                  </div>

                  <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar size={14} className="text-primary" />
                      Due {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Users size={14} className="text-primary" />
                      {project.members.length} Members
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass dark:glass-dark border-none shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-accent/30">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="py-4 font-semibold">Project Name</TableHead>
                  <TableHead className="py-4 font-semibold">Client / Org</TableHead>
                  <TableHead className="py-4 font-semibold">Due Date</TableHead>
                  <TableHead className="py-4 font-semibold">Members</TableHead>
                  <TableHead className="py-4 font-semibold">Progress</TableHead>
                  <TableHead className="py-4 font-semibold">Status</TableHead>
                  <TableHead className="py-4 text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => {
                  const status = statusMap[project.status as keyof typeof statusMap] || statusMap.active;
                  return (
                    <TableRow key={project.id} className="border-border/50 group">
                      <TableCell className="py-4 font-semibold text-foreground">{project.name}</TableCell>
                      <TableCell className="py-4 text-muted-foreground">{project.client}</TableCell>
                      <TableCell className="py-4">
                        {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex -space-x-2">
                          {project.members.slice(0, 3).map((m, i) => (
                            <Avatar key={i} className="h-7 w-7 border border-background">
                              <AvatarFallback className="text-[9px] font-bold">{m}</AvatarFallback>
                            </Avatar>
                          ))}
                          {project.members.length > 3 && (
                            <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center border border-background text-[9px] font-bold">
                              +{project.members.length - 3}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 w-40">
                        <div className="flex items-center gap-2">
                          <Progress value={project.progress} className="h-1.5 bg-accent w-24" />
                          <span className="text-xs font-bold">{project.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="secondary" className={cn("rounded-full border-none px-3 py-1 text-xs font-medium gap-1.5", status.color)}>
                          <status.icon size={12} />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon" className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical size={18} />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="rounded-xl w-48">
                            <DropdownMenuItem className="cursor-pointer">View Details</DropdownMenuItem>
                            {role === 'hr' && (
                              <>
                                <DropdownMenuItem className="cursor-pointer">Assign Employees</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">Edit Scope</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                  onClick={() => handleArchiveProject(project.id)}
                                >
                                  Archive
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
