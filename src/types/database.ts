export type UserRole = 'super_admin' | 'manager' | 'employee';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department?: string;
  manager_id?: string;
  created_at: string;
}

export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface Timesheet {
  id: string;
  user_id: string;
  project_name: string;
  task_name: string;
  description?: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  status: TimesheetStatus;
  created_at: string;
}

export type LeaveType = 'casual' | 'sick' | 'paid' | 'wfh' | 'emergency';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveStatus;
  approved_by?: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  client?: string;
  status: 'active' | 'completed' | 'on_hold';
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
