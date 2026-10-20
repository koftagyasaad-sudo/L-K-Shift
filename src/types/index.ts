export interface BranchData {
  id?: string;
  name: string;
  location?: string;
  manager?: string;
  phone?: string;
  ext?: string;
  address?: string;
  radius_meters?: number;
  latitude?: number;
  longitude?: number;
  created_at?: string;
}

export interface EmployeeData {
  id?: string;
  name: string;
  employee_code: string;
  branch_id?: string | null;
  role_id?: string | null;
  base_salary?: number;
  monthly_leave_days?: number;
  status?: string;
  branch_name?: string;
  role_name?: string;
  created_at?: string;
}

export interface RoleData {
  id?: string;
  name: string;
  description?: string;
  permissions?: string[];
  branch_ids?: string[];
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_code?: string;
  branch_name?: string;
  action_type: string;
  face_verified: boolean;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
}

export interface AttendanceRecordInput {
  employeeId?: string;
  branchId?: string;
  lat?: number;
  lng?: number;
  faceVerified?: boolean;
  actionType?: "IN" | "OUT";
  employee_id?: string;
  branch_id?: string;
  type?: string;
  verified_by_face?: boolean;
  gps_lat?: number;
  gps_lng?: number;
}

export type AttendanceFilterOptions =
  | string
  | {
      employeeId?: string;
      startDate?: string;
      endDate?: string;
      branchId?: string;
    };

export interface LeaveRequestData {
  id?: string;
  employee_id: string;
  employee_name?: string;
  recipient: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status?: string;
  created_at?: string;
}

export type LeaveRequest = LeaveRequestData;
