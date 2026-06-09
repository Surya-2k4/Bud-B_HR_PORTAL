import { create } from 'zustand';
import {
  addEmployee as addEmployeeService,
  addTimesheet as addTimesheetService,
  approveLeave as approveLeaveService,
  approveTimesheet as approveTimesheetService,
  archiveProject as archiveProjectService,
  createDepartment as createDepartmentService,
  createProject as createProjectService,
  deactivateEmployee as deactivateEmployeeService,
  activateEmployee as activateEmployeeService,
  deleteEmployee as deleteEmployeeService,
  deleteDepartment as deleteDepartmentService,
  getDepartments as getDepartmentsService,
  updateDepartment as updateDepartmentService,
  getEmployees as getEmployeesService,
  getLeaveBalances as getLeaveBalancesService,
  getLeaveRequests as getLeaveRequestsService,
  getNotifications as getNotificationsService,
  markNotificationRead as markNotificationReadService,
  getProjects as getProjectsService,
  getTimesheets as getTimesheetsService,
  rejectLeave as rejectLeaveService,
  rejectTimesheet as rejectTimesheetService,
  requestLeave as requestLeaveService,
  deleteTimesheet as deleteTimesheetService,
  updateEmployee as updateEmployeeService,
  updateProject as updateProjectService,
  Employee,
  Project,
  Department,
  TimesheetEntry,
  LeaveRequest,
  LeaveBalance,
  Notification,
} from '@/lib/firebase-services';

interface HRState {
  initialized: boolean;
  timesheets: TimesheetEntry[];
  leaves: LeaveRequest[];
  leaveBalances: Record<string, LeaveBalance[]>;
  employees: Employee[];
  projects: Project[];
  departments: Department[];
  notifications: Notification[];
  initializeData: () => Promise<void>;
  getNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  addTimesheet: (entry: Omit<TimesheetEntry, 'id' | 'status'>) => Promise<void>;
  approveTimesheet: (id: string) => Promise<void>;
  rejectTimesheet: (id: string) => Promise<void>;
  deleteTimesheet: (id: string) => Promise<void>;
  requestLeave: (request: Omit<LeaveRequest, 'id' | 'status'>) => Promise<void>;
  approveLeave: (id: string) => Promise<void>;
  rejectLeave: (id: string) => Promise<void>;
  addEmployee: (employee: Omit<Employee, 'id'>, password?: string) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deactivateEmployee: (id: string) => Promise<void>;
  activateEmployee: (id: string) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  createProject: (project: Omit<Project, 'id' | 'progress' | 'members' | 'status' | 'color'> & { members?: string[] }) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  createDepartment: (dept: Omit<Department, 'id' | 'members' | 'color'>) => Promise<void>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
}

export const useHRStore = create<HRState>()((set, get) => ({
  initialized: false,
  timesheets: [],
  leaves: [],
  leaveBalances: {},
  employees: [],
  projects: [],
  departments: [],
  notifications: [],

  initializeData: async () => {
    if (get().initialized) {
      return;
    }

    try {
      const [employees, projects, departments, timesheets, leaves, leaveBalances, notifications] = await Promise.all([
        getEmployeesService(),
        getProjectsService(),
        getDepartmentsService(),
        getTimesheetsService(),
        getLeaveRequestsService(),
        getLeaveBalancesService(),
        getNotificationsService(),
      ]);

      set({ employees, projects, departments, timesheets, leaves, leaveBalances, notifications, initialized: true });
    } catch (error) {
      console.error('Error initializing HR store', error);
      set({ initialized: true });
    }
  },

  addTimesheet: async (entry) => {
    try {
      const result = await addTimesheetService(entry);
      set((state) => ({ timesheets: [result, ...state.timesheets] }));
    } catch (error) {
      console.error('Failed to add timesheet', error);
    }
  },

  approveTimesheet: async (id) => {
    try {
      await approveTimesheetService(id);
      set((state) => ({
        timesheets: state.timesheets.map((item) =>
          item.id === id ? { ...item, status: 'approved' } : item
        ),
      }));
    } catch (error) {
      console.error('Failed to approve timesheet', error);
    }
  },

  rejectTimesheet: async (id) => {
    try {
      await rejectTimesheetService(id);
      set((state) => ({
        timesheets: state.timesheets.map((item) =>
          item.id === id ? { ...item, status: 'rejected' } : item
        ),
      }));
    } catch (error) {
      console.error('Failed to reject timesheet', error);
    }
  },

  deleteTimesheet: async (id) => {
    try {
      await deleteTimesheetService(id);
      set((state) => ({ timesheets: state.timesheets.filter((item) => item.id !== id) }));
    } catch (error) {
      console.error('Failed to delete timesheet', error);
    }
  },

  requestLeave: async (request) => {
    try {
      const result = await requestLeaveService(request);
      const leaveBalances = await getLeaveBalancesService();
      set((state) => ({ leaves: [result, ...state.leaves], leaveBalances }));
    } catch (error) {
      console.error('Failed to request leave', error);
    }
  },

  approveLeave: async (id) => {
    try {
      await approveLeaveService(id);
      const [leaves, leaveBalances] = await Promise.all([
        getLeaveRequestsService(),
        getLeaveBalancesService(),
      ]);
      set({ leaves, leaveBalances });
    } catch (error) {
      console.error('Failed to approve leave', error);
    }
  },

  rejectLeave: async (id) => {
    try {
      await rejectLeaveService(id);
      set((state) => ({
        leaves: state.leaves.map((item) =>
          item.id === id ? { ...item, status: 'rejected' } : item
        ),
      }));
    } catch (error) {
      console.error('Failed to reject leave', error);
    }
  },

  addEmployee: async (employee, password) => {
    try {
      const result = await addEmployeeService(employee, password);
      set((state) => ({ employees: [result, ...state.employees] }));
    } catch (error) {
      console.error('Failed to add employee', error);
      throw error;
    }
  },

  updateEmployee: async (id, updates) => {
    try {
      await updateEmployeeService(id, updates);
      set((state) => ({
        employees: state.employees.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      }));
    } catch (error) {
      console.error('Failed to update employee', error);
    }
  },

  deactivateEmployee: async (id) => {
    try {
      await deactivateEmployeeService(id);
      set((state) => ({
        employees: state.employees.map((item) =>
          item.id === id ? { ...item, status: 'inactive' } : item
        ),
      }));
    } catch (error) {
      console.error('Failed to deactivate employee', error);
    }
  },

  activateEmployee: async (id) => {
    try {
      await activateEmployeeService(id);
      set((state) => ({
        employees: state.employees.map((item) =>
          item.id === id ? { ...item, status: 'active' } : item
        ),
      }));
    } catch (error) {
      console.error('Failed to activate employee', error);
    }
  },

  deleteEmployee: async (id) => {
    try {
      await deleteEmployeeService(id);
      set((state) => ({
        employees: state.employees.filter((item) => item.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete employee', error);
    }
  },

  createProject: async (project) => {
    try {
      const result = await createProjectService(project);
      set((state) => ({ projects: [result, ...state.projects] }));
    } catch (error) {
      console.error('Failed to create project', error);
    }
  },

  updateProject: async (id, updates) => {
    try {
      await updateProjectService(id, updates);
      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === id ? { ...project, ...updates } : project
        ),
      }));
    } catch (error) {
      console.error('Failed to update project', error);
    }
  },

  archiveProject: async (id) => {
    try {
      await archiveProjectService(id);
      set((state) => ({ projects: state.projects.filter((project) => project.id !== id) }));
    } catch (error) {
      console.error('Failed to archive project', error);
    }
  },

  updateDepartment: async (id, updates) => {
    try {
      await updateDepartmentService(id, updates);
      set((state) => ({
        departments: state.departments.map((dept) =>
          dept.id === id ? { ...dept, ...updates } : dept
        ),
      }));
    } catch (error) {
      console.error('Failed to update department', error);
    }
  },

  deleteDepartment: async (id) => {
    try {
      await deleteDepartmentService(id);
      set((state) => ({ departments: state.departments.filter((dept) => dept.id !== id) }));
    } catch (error) {
      console.error('Failed to delete department', error);
    }
  },

  getNotifications: async () => {
    try {
      const notifications = await getNotificationsService();
      set({ notifications });
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  },

  markNotificationRead: async (id) => {
    try {
      await markNotificationReadService(id);
      set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        ),
      }));
    } catch (error) {
      console.error('Failed to mark notification read', error);
    }
  },

  createDepartment: async (dept) => {
    try {
      const result = await createDepartmentService(dept);
      set((state) => ({ departments: [result, ...state.departments] }));
    } catch (error) {
      console.error('Failed to create department', error);
    }
  },
}));
