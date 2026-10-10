import {
  pgTable,
  pgEnum,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  date,
  time,
  doublePrecision,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";

/* ============================================================
   1) ENUM TYPES - مطابقة تمامًا لما هو موجود في قاعدة البيانات
   ============================================================ */

export const userRoleEnum = pgEnum("user_role", ["SUPER_ADMIN", "EMPLOYEE"]);

export const managementRoleEnum = pgEnum("management_role", [
  "NONE",
  "BRANCH_MANAGER",
  "AREA_MANAGER",
]);

export const verificationModeEnum = pgEnum("verification_mode", [
  "QR_GPS",
  "GPS_ONLY",
  "GPS_WIFI",
  "MANUAL",
]);

export const branchTypeEnum = pgEnum("branch_type", ["BRANCH", "CENTRAL_KITCHEN"]);

export const checkMethodEnum = pgEnum("check_method", [
  "QR",
  "GPS",
  "WIFI",
  "MANUAL_OVERRIDE",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "ON_TIME",
  "LATE",
  "ABSENT",
  "INCOMPLETE",
  "EXCUSED",
  "HOLIDAY",
  "LEAVE",
  "SICK_LEAVE",
  "DAY_OFF",
]);

export const approvalStatusEnum = pgEnum("approval_status", [
  "AUTO_APPROVED",
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
]);

export const exceptionTypeEnum = pgEnum("exception_type", [
  "FORGOT_CHECK_IN",
  "FORGOT_CHECK_OUT",
  "DEVICE_ISSUE",
  "GPS_ISSUE",
  "EMERGENCY",
  "OTHER",
]);

export const leaveStatusEnum = pgEnum("leave_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

/* ============================================================
   2) المستخدمين (Users)
   ============================================================ */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullNameAr: text("full_name_ar").notNull(),
  fullNameEn: text("full_name_en"),
  phone: text("phone").notNull(),
  nationalId: text("national_id"),
  passwordHash: text("password_hash").notNull(),
  systemRole: userRoleEnum("system_role").notNull().default("EMPLOYEE"),
  jobRole: text("job_role").notNull(),
  primaryBranchId: integer("primary_branch_id"),
  verificationMode: verificationModeEnum("verification_mode")
    .notNull()
    .default("QR_GPS"),
  hireDate: timestamp("hire_date", { withTimezone: true }),
  salaryType: text("salary_type").notNull().default("MONTHLY"),
  hourlyRate: numeric("hourly_rate"),
  monthlySalary: numeric("monthly_salary"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  address: text("address"),
  governorate: text("governorate"),
  employeeNumber: text("employee_number"),
  managementRole: managementRoleEnum("management_role").notNull().default("NONE"),
  workingHoursPerDay: integer("working_hours_per_day").notNull().default(8),
  workingDaysPerMonth: integer("working_days_per_month").notNull().default(26),
  annualLeaveDays: integer("annual_leave_days").notNull().default(21),
});

/* ============================================================
   3) الفروع (Branches)
   ============================================================ */

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  type: branchTypeEnum("type").notNull().default("BRANCH"),
  address: text("address"),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  geofenceRadius: integer("geofence_radius").notNull().default(100),
  qrSecretKey: text("qr_secret_key").notNull(),
  qrRefreshSec: integer("qr_refresh_sec").notNull().default(60),
  wifiSsid: text("wifi_ssid"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
   4) النطاق الجغرافي لمدراء الفروع (Admin Branch Scopes)
   ============================================================ */

export const adminBranchScopes = pgTable("admin_branch_scopes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  branchId: integer("branch_id").notNull().references(() => branches.id),
});

/* ============================================================
   5) الفروع المسموح بها للمستخدم (User Allowed Branches)
   ============================================================ */

export const userAllowedBranches = pgTable("user_allowed_branches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  branchId: integer("branch_id").notNull().references(() => branches.id),
});

/* ============================================================
   6) أجهزة المستخدمين (User Devices)
   ============================================================ */

export const userDevices = pgTable("user_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  deviceUuid: text("device_uuid").notNull(),
  deviceModel: text("device_model"),
  isPrimary: boolean("is_primary").notNull().default(true),
  isBlocked: boolean("is_blocked").notNull().default(false),
  registeredAt: timestamp("registered_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ============================================================
   7) الأدوار المخصصة (Custom Roles)
   ============================================================ */

export const customRoles = pgTable("custom_roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  permissions: jsonb("permissions").notNull(),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
   8) تعيين الأدوار المخصصة (Custom Role Assignments)
   ============================================================ */

export const customRoleAssignments = pgTable("custom_role_assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  roleId: integer("role_id").notNull().references(() => customRoles.id),
});

/* ============================================================
   9) قوالب الورديات (Shift Templates)
   ============================================================ */

export const shiftTemplates = pgTable("shift_templates", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en"),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isCrossMidnight: boolean("is_cross_midnight").notNull().default(false),
  gracePeriodMinutes: integer("grace_period_minutes").notNull().default(15),
  lateThresholdMinutes: integer("late_threshold_minutes").notNull().default(60),
  overtimeThresholdMin: integer("overtime_threshold_min").notNull().default(30),
  isActive: boolean("is_active").notNull().default(true),
});

/* ============================================================
   10) تعيين الورديات (Shift Assignments)
   ============================================================ */

export const shiftAssignments = pgTable("shift_assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  shiftId: integer("shift_id").notNull().references(() => shiftTemplates.id),
  branchId: integer("branch_id").notNull().references(() => branches.id),
  workDate: date("work_date").notNull(),
  isDayOff: boolean("is_day_off").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
   11) سجلات الحضور والانصراف (Attendance Logs)
   ============================================================ */

export const attendanceLogs = pgTable("attendance_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  shiftAssignmentId: integer("shift_assignment_id").references(() => shiftAssignments.id),
  branchId: integer("branch_id").notNull().references(() => branches.id),
  workDate: date("work_date").notNull(),

  // تسجيل الحضور
  checkInTime: timestamp("check_in_time", { withTimezone: true }),
  checkInLat: doublePrecision("check_in_lat"),
  checkInLng: doublePrecision("check_in_lng"),
  checkInDistance: doublePrecision("check_in_distance"),
  checkInMethod: checkMethodEnum("check_in_method"),
  checkInMockDetected: boolean("check_in_mock_detected").notNull().default(false),

  // تسجيل الانصراف
  checkOutTime: timestamp("check_out_time", { withTimezone: true }),
  checkOutLat: doublePrecision("check_out_lat"),
  checkOutLng: doublePrecision("check_out_lng"),
  checkOutDistance: doublePrecision("check_out_distance"),
  checkOutMethod: checkMethodEnum("check_out_method"),

  // الحالة والإحصائيات
  status: attendanceStatusEnum("status").notNull().default("INCOMPLETE"),
  actualWorkedMinutes: integer("actual_worked_minutes").notNull().default(0),
  lateMinutes: integer("late_minutes").notNull().default(0),
  overtimeMinutes: integer("overtime_minutes").notNull().default(0),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),

  // صور ومراجعة الحضور
  checkInPhotoUrl: text("check_in_photo_url"),
  checkInApprovalStatus: approvalStatusEnum("check_in_approval_status"),
  checkInReviewedBy: integer("check_in_reviewed_by").references(() => users.id),
  checkInReviewedAt: timestamp("check_in_reviewed_at", { withTimezone: true }),
  checkInReviewNotes: text("check_in_review_notes"),

  // صور ومراجعة الانصراف
  checkOutPhotoUrl: text("check_out_photo_url"),
  checkOutApprovalStatus: approvalStatusEnum("check_out_approval_status"),
  checkOutReviewedBy: integer("check_out_reviewed_by").references(() => users.id),
  checkOutReviewedAt: timestamp("check_out_reviewed_at", { withTimezone: true }),
  checkOutReviewNotes: text("check_out_review_notes"),
});

/* ============================================================
   12) استثناءات الحضور (Attendance Exceptions)
   ============================================================ */

export const attendanceExceptions = pgTable("attendance_exceptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  workDate: date("work_date").notNull(),
  exceptionType: exceptionTypeEnum("exception_type").notNull(),
  description: text("description").notNull(),
  requestedCheckIn: timestamp("requested_check_in", { withTimezone: true }),
  requestedCheckOut: timestamp("requested_check_out", { withTimezone: true }),
  status: leaveStatusEnum("status").notNull().default("PENDING"),
  approvedBy: integer("approved_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
   13) الإجازات (Leave Requests)
   ============================================================ */

export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  leaveType: text("leave_type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalDays: integer("total_days").notNull(),
  reason: text("reason"),
  status: leaveStatusEnum("status").notNull().default("PENDING"),
  approvedBy: integer("approved_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
   14) سجل العمليات (Audit Logs)
   ============================================================ */

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
   15) الإشعارات (Notifications)
   ============================================================ */

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  link: text("link"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
