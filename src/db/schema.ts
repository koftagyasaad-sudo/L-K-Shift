import { 
  pgTable, serial, text, integer, boolean, 
  timestamp, doublePrecision, numeric, pgEnum, jsonb 
} from 'drizzle-orm/pg-core';

// 1. تعريف الـ Enums
export const userRoleEnum = pgEnum('user_role', ['SUPER_ADMIN', 'EMPLOYEE']);
export const verificationModeEnum = pgEnum('verification_mode', ['QR_GPS', 'GPS_ONLY', 'GPS_WIFI', 'MANUAL']);
export const attendanceStatusEnum = pgEnum('attendance_status', [
  'ON_TIME', 'LATE', 'ABSENT', 'INCOMPLETE', 'EXCUSED', 'HOLIDAY', 'LEAVE', 'SICK_LEAVE', 'DAY_OFF'
]);
export const leaveStatusEnum = pgEnum('leave_status', ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);

// 2. جدول المستخدمين (users)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullNameAr: text('full_name_ar').notNull(),
  fullNameEn: text('full_name_en'),
  phone: text('phone').notNull(),
  nationalId: text('national_id'),
  passwordHash: text('password_hash').notNull(),
  systemRole: userRoleEnum('system_role').default('EMPLOYEE').notNull(),
  jobRole: text('job_role').notNull(),
  primaryBranchId: integer('primary_branch_id'),
  verificationMode: verificationModeEnum('verification_mode').default('QR_GPS').notNull(),
  monthlySalary: numeric('monthly_salary'),
  workingHoursPerDay: integer('working_hours_per_day').default(8).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  address: text('address'),
  emergencyContact: text('emergency_contact'),
  employeeNumber: text('employee_number'),
  employeeCode: text('employee_code'),
  resetOtp: text('reset_otp'),
  resetOtpExpiresAt: timestamp('reset_otp_expires_at', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. جدول الفروع (branches) - مدمج به حقول مفتاح الـ QR
export const branches = pgTable('branches', {
  id: serial('id').primaryKey(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  address: text('address'),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  geofenceRadius: integer('geofence_radius').default(100).notNull(),
  qrSecretKey: text('qr_secret_key'),
  qrRefreshSec: integer('qr_refresh_sec').default(60),
  shiftSchedule: text('shift_schedule'),
  shiftStartTime: text('shift_start_time'),
  shiftEndTime: text('shift_end_time'),
  shiftName: text('shift_name'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 4. جدول سجلات الحضور والانصراف (attendance_logs)
export const attendanceLogs = pgTable('attendance_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  branchId: integer('branch_id'),
  workDate: timestamp('work_date', { mode: 'string' }).notNull(),
  checkInTime: timestamp('check_in_time', { withTimezone: true }),
  checkInLat: doublePrecision('check_in_lat'),
  checkInLng: doublePrecision('check_in_lng'),
  checkInDistance: doublePrecision('check_in_distance'),
  checkInPhotoUrl: text('check_in_photo_url'),
  checkOutTime: timestamp('check_out_time', { withTimezone: true }),
  checkOutLat: doublePrecision('check_out_lat'),
  checkOutLng: doublePrecision('check_out_lng'),
  checkOutDistance: doublePrecision('check_out_distance'),
  status: attendanceStatusEnum('status').default('INCOMPLETE').notNull(),
  actualWorkedMinutes: integer('actual_worked_minutes').default(0).notNull(),
  lateMinutes: integer('late_minutes').default(0).notNull(),
  overtimeMinutes: integer('overtime_minutes').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. جدول طلبات الإجازات والسلف (leave_requests)
export const leaveRequests = pgTable('leave_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  leaveType: text('leave_type'),
  requestType: text('request_type'),
  startDate: timestamp('start_date', { mode: 'string' }).notNull(),
  endDate: timestamp('end_date', { mode: 'string' }).notNull(),
  totalDays: integer('total_days').default(1),
  durationDays: integer('duration_days').default(1),
  advanceAmount: numeric('advance_amount').default('0'),
  reason: text('reason'),
  rejectionReason: text('rejection_reason'),
  rejectionNotes: text('rejection_notes'),
  status: leaveStatusEnum('status').default('PENDING').notNull(),
  finalStatus: text('final_status').default('PENDING'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. جدول الأدوار المخصصة (custom_roles)
export const customRoles = pgTable('custom_roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  nameAr: text('name_ar').notNull(),
  permissions: jsonb('permissions').notNull(),
  isSystem: boolean('is_system').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 7. جدول الإشعارات (notifications)
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  link: text('link'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
