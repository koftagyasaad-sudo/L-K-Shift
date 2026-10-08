import { pgTable, serial, text, timestamp, integer, boolean, date } from "drizzle-orm/pg-core";

// 1. الأدوار الأساسية
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. الأدوار المخصصة (Custom Roles)
export const customRoles = pgTable("custom_roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 3. تعيين الأدوار المخصصة (Custom Role Assignments)
export const customRoleAssignments = pgTable("custom_role_assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  roleId: integer("role_id").notNull(),
});

// 4. الفروع (Branches)
export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  geofenceRadius: integer("geofence_radius").default(100).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 5. النطاق الجغرافي لمدراء الفروع (Admin Branch Scopes)
export const adminBranchScopes = pgTable("admin_branch_scopes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  branchId: integer("branch_id").notNull(),
});

// 6. المستخدمين (Users)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique(),
  phone: text("phone"),
  employeeNumber: text("employee_number").unique(),
  password: text("password").notNull(),
  roleId: integer("role_id").references(() => roles.id),
  branchId: integer("branch_id").references(() => branches.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 7. سجلات الحضور والانصراف (Attendance Logs)
export const attendanceLogs = pgTable("attendance_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  branchId: integer("branch_id").notNull().references(() => branches.id),
  workDate: date("work_date").notNull(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  checkInLat: text("check_in_lat"),
  checkInLng: text("check_in_lng"),
  checkOutLat: text("check_out_lat"),
  checkOutLng: text("check_out_lng"),
  checkInPhotoUrl: text("check_in_photo_url"),
  checkOutPhotoUrl: text("check_out_photo_url"),
  checkInApprovalStatus: text("check_in_approval_status").default("PENDING"),
  checkOutApprovalStatus: text("check_out_approval_status").default("PENDING"),
  lateReason: text("late_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 8. الإجازات (Leave Requests)
export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").default("PENDING"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 9. الورديات والقوالب (Shift Templates & Assignments)
export const shiftTemplates = pgTable("shift_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
});

export const shiftAssignments = pgTable("shift_assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  shiftTemplateId: integer("shift_template_id").references(() => shiftTemplates.id),
  workDate: date("work_date").notNull(),
});

// 10. الإشعارات (Notifications)
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
