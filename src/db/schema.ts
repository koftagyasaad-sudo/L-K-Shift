import { pgTable, serial, text, timestamp, integer, boolean, date } from "drizzle-orm/pg-core";

// 1. جدول الأدوار والصلاحيات (Roles)
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. جدول الفروع والإحداثيات الجغرافية (Branches)
export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  geofenceRadius: integer("geofence_radius").default(100).notNull(), // النطاق بالأمتار
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 3. جدول المستخدمين والموظفين (Users)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique(),
  phone: text("phone"),
  employeeNumber: text("employee_number").unique(), // رقم الأداء / الموظف
  password: text("password").notNull(),
  roleId: integer("role_id").references(() => roles.id),
  branchId: integer("branch_id").references(() => branches.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 4. جدول سجلات الحضور والانصراف المطور (Attendance Logs)
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
  checkInApprovalStatus: text("check_in_approval_status").default("PENDING"), // PENDING, APPROVED, REJECTED, AUTO_APPROVED
  checkOutApprovalStatus: text("check_out_approval_status").default("PENDING"),
  lateReason: text("late_reason"), // سبب التأخير
  notes: text("notes"), // ملاحظات المسؤول
  createdAt: timestamp("created_at").defaultNow(),
});
