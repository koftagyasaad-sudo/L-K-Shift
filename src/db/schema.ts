// src/db/schema.ts
import {
  boolean,
  date,
  doublePrecision,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  time,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["SUPER_ADMIN", "EMPLOYEE"]);
export const branchTypeEnum = pgEnum("branch_type", ["BRANCH", "CENTRAL_KITCHEN", "HQ"]);
export const verificationModeEnum = pgEnum("verification_mode", [
  "QR_GPS",
  "GPS_ONLY",
  "GPS_WIFI",
  "MANUAL",
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
export const checkMethodEnum = pgEnum("check_method", ["QR", "GPS", "WIFI", "MANUAL_OVERRIDE"]);
export const leaveStatusEnum = pgEnum("leave_status", ["PENDING", "APPROVED", "REJECTED", "CANCELLED"]);
export const exceptionTypeEnum = pgEnum("exception_type", [
  "FORGOT_CHECK_IN",
  "FORGOT_CHECK_OUT",
  "DEVICE_ISSUE",
  "GPS_ISSUE",
  "EMERGENCY",
  "OTHER",
]);

export const managementRoleEnum = pgEnum("management_role", [
  "NONE",
  "BRANCH_MANAGER",
  "AREA_MANAGER",
]);

// 🆕 حالة اعتماد الحضور/الانصراف
export const approvalStatusEnum = pgEnum("approval_status", [
  "AUTO_APPROVED",
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
]);

const createdAt = timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = timestamp("updated_at", { withTimezone: true })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date());

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  type: branchTypeEnum("type").default("BRANCH").notNull(),
  address: text("address"),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  geofenceRadius: integer("geofence_radius").default(100).notNull(),
  qrSecretKey: text("qr_secret_key").notNull(),
  qrRefreshSec: integer("qr_refresh_sec").default(60).notNull(),
  wifiSsid: text("wifi_ssid"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt,
  updatedAt,
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullNameAr: text("full_name_ar").notNull(),
  fullNameEn: text("full_name_en"),
  phone: text("phone").notNull().unique(),
  nationalId: text("national_id").unique(),
  address: text("address"),
  governorate: text("governorate"),
  employeeNumber: text("employee_number").unique(),
  managementRole: managementRoleEnum("management_role").default("NONE").notNull(),
  passwordHash: text("password_hash").notNull(),
  systemRole: userRoleEnum("system_role").default("EMPLOYEE").notNull(),
  jobRole: text("job_role").notNull(),
  primaryBranchId: integer("primary_branch_id").references(() => branches.id),
  verificationMode: verificationModeEnum("verification_mode").default("QR_GPS").notNull(),
  hireDate: timestamp("hire_date", { withTimezone: true }),
  salaryType: text("salary_type").default("MONTHLY").notNull(),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  monthlySalary: numeric("monthly_salary", { precision: 12, scale: 2 }),
  workingHoursPerDay: integer("working_hours_per_day").default(8).notNull(),
  workingDaysPerMonth: integer("working_days_per_month").default(26).notNull(),
  annualLeaveDays: integer("annual_leave_days").default(21).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt,
  updatedAt,
});

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    link: text("link"),
    createdAt,
  },
  (table) => ({
    userIdx: index("notifications_user_idx").on(table.userId),
    unreadIdx: index("notifications_unread_idx").on(table.isRead),
  }),
);

export const userDevices = pgTable(
  "user_devices",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deviceUuid: text("device_uuid").notNull(),
    deviceModel: text("device_model"),
    isPrimary: boolean("is_primary").default(true).notNull(),
    isBlocked: boolean("is_blocked").default(false).notNull(),
    registeredAt: timestamp("registered_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserDevice: unique("user_devices_user_device_uuid_unique").on(table.userId, table.deviceUuid),
  }),
);

export const userAllowedBranches = pgTable(
  "user_allowed_branches",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    branchId: integer("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueUserBranch: unique("user_allowed_branches_user_branch_unique").on(table.userId, table.branchId),
  }),
);

export const shiftTemplates = pgTable("shift_templates", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en"),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isCrossMidnight: boolean("is_cross_midnight").default(false).notNull(),
  gracePeriodMinutes: integer("grace_period_minutes").default(15).notNull(),
  lateThresholdMinutes: integer("late_threshold_minutes").default(60).notNull(),
  overtimeThresholdMin: integer("overtime_threshold_min").default(30).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const shiftAssignments = pgTable(
  "shift_assignments",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    shiftId: integer("shift_id")
      .notNull()
      .references(() => shiftTemplates.id),
    branchId: integer("branch_id")
      .notNull()
      .references(() => branches.id),
    workDate: date("work_date", { mode: "date" }).notNull(),
    isDayOff: boolean("is_day_off").default(false).notNull(),
    notes: text("notes"),
    createdAt,
  },
  (table) => ({
    uniqueUserWorkDate: unique("shift_assignments_user_work_date_unique").on(table.userId, table.workDate),
  }),
);

export const attendanceLogs = pgTable(
  "attendance_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    shiftAssignmentId: integer("shift_assignment_id").unique().references(() => shiftAssignments.id),
    branchId: integer("branch_id")
      .notNull()
      .references(() => branches.id),
    workDate: date("work_date", { mode: "date" }).notNull(),
    checkInTime: timestamp("check_in_time", { withTimezone: true }),
    checkInLat: doublePrecision("check_in_lat"),
    checkInLng: doublePrecision("check_in_lng"),
    checkInDistance: doublePrecision("check_in_distance"),
    checkInMethod: checkMethodEnum("check_in_method"),
    checkInMockDetected: boolean("check_in_mock_detected").default(false).notNull(),
    // 🆕 حقول صورة وحالة اعتماد الحضور
    checkInPhotoUrl: text("check_in_photo_url"),
    checkInApprovalStatus: approvalStatusEnum("check_in_approval_status"),
    checkInReviewedBy: integer("check_in_reviewed_by"),
    checkInReviewedAt: timestamp("check_in_reviewed_at", { withTimezone: true }),
    checkInReviewNotes: text("check_in_review_notes"),
    checkOutTime: timestamp("check_out_time", { withTimezone: true }),
    checkOutLat: doublePrecision("check_out_lat"),
    checkOutLng: doublePrecision("check_out_lng"),
    checkOutDistance: doublePrecision("check_out_distance"),
    checkOutMethod: checkMethodEnum("check_out_method"),
    // 🆕 حقول صورة وحالة اعتماد الانصراف
    checkOutPhotoUrl: text("check_out_photo_url"),
    checkOutApprovalStatus: approvalStatusEnum("check_out_approval_status"),
    checkOutReviewedBy: integer("check_out_reviewed_by"),
    checkOutReviewedAt: timestamp("check_out_reviewed_at", { withTimezone: true }),
    checkOutReviewNotes: text("check_out_review_notes"),
    status: attendanceStatusEnum("status").default("INCOMPLETE").notNull(),
    actualWorkedMinutes: integer("actual_worked_minutes").default(0).notNull(),
    lateMinutes: integer("late_minutes").default(0).notNull(),
    overtimeMinutes: integer("overtime_minutes").default(0).notNull(),
    notes: text("notes"),
    createdAt,
    updatedAt,
  },
  (table) => ({
    uniqueUserAttendanceDate: unique("attendance_logs_user_work_date_unique").on(table.userId, table.workDate),
  }),
);

export const attendanceExceptions = pgTable("attendance_exceptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workDate: date("work_date", { mode: "date" }).notNull(),
  exceptionType: exceptionTypeEnum("exception_type").notNull(),
  description: text("description").notNull(),
  requestedCheckIn: timestamp("requested_check_in", { withTimezone: true }),
  requestedCheckOut: timestamp("requested_check_out", { withTimezone: true }),
  status: leaveStatusEnum("status").default("PENDING").notNull(),
  approvedBy: integer("approved_by"),
  rejectionReason: text("rejection_reason"),
  createdAt,
});

export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  leaveType: text("leave_type").notNull(),
  startDate: date("start_date", { mode: "date" }).notNull(),
  endDate: date("end_date", { mode: "date" }).notNull(),
  totalDays: integer("total_days").notNull(),
  reason: text("reason"),
  status: leaveStatusEnum("status").default("PENDING").notNull(),
  approvedBy: integer("approved_by"),
  rejectionReason: text("rejection_reason"),
  createdAt,
});

export const customRoles = pgTable("custom_roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  permissions: jsonb("permissions").$type<string[]>().notNull(),
  isSystem: boolean("is_system").default(false).notNull(),
  createdAt,
});

export const customRoleAssignments = pgTable(
  "custom_role_assignments",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: integer("role_id")
      .notNull()
      .references(() => customRoles.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueUserRole: unique("custom_role_assignments_user_role_unique").on(table.userId, table.roleId),
  }),
);

export const adminBranchScopes = pgTable(
  "admin_branch_scopes",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    branchId: integer("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueAdminBranchScope: unique("admin_branch_scopes_user_branch_unique").on(table.userId, table.branchId),
  }),
);

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  createdAt,
});

export type UserRole = typeof userRoleEnum.enumValues[number];
export type BranchType = typeof branchTypeEnum.enumValues[number];
export type VerificationMode = typeof verificationModeEnum.enumValues[number];
export type AttendanceStatus = typeof attendanceStatusEnum.enumValues[number];
export type CheckMethod = typeof checkMethodEnum.enumValues[number];
export type LeaveStatus = typeof leaveStatusEnum.enumValues[number];
export type ExceptionType = typeof exceptionTypeEnum.enumValues[number];
export type ManagementRole = typeof managementRoleEnum.enumValues[number];
export type ApprovalStatus = typeof approvalStatusEnum.enumValues[number];

export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type ShiftAssignment = typeof shiftAssignments.$inferSelect;
export type AttendanceLog = typeof attendanceLogs.$inferSelect;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type CustomRole = typeof customRoles.$inferSelect;
