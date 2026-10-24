import { 
  pgTable, 
  uuid, 
  varchar, 
  timestamp, 
  boolean, 
  text, 
  doublePrecision, 
  integer,
  jsonb
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ----------------------------------------------------------------------
// 1. جدول الفروع (Branches)
// ----------------------------------------------------------------------
export const branches = pgTable('branches', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  nameEn: varchar('name_en', { length: 255 }),
  address: text('address'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  radiusMeters: integer('radius_meters').default(100), // النطاق الجغرافي المسموح للحضور
  qrSecretKey: varchar('qr_secret_key', { length: 255 }).notNull(), // مفتاح سري ضروري
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ----------------------------------------------------------------------
// 2. جدول الأدوار والصلاحيات (Roles)
// ----------------------------------------------------------------------
export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  nameAr: varchar('name_ar', { length: 255 }),
  nameEn: varchar('name_en', { length: 255 }),
  description: text('description'),
  permissions: jsonb('permissions').default('[]'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ----------------------------------------------------------------------
// 3. جدول الموظفين (Users / Employees)
// نظام الدخول يعتمد على رقم الهاتف (Phone)
// ----------------------------------------------------------------------
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: varchar('phone', { length: 50 }).notNull().unique(), // مُعرف الدخول
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  fullNameAr: varchar('full_name_ar', { length: 255 }),
  fullNameEn: varchar('full_name_en', { length: 255 }),
  email: varchar('email', { length: 255 }),
  role: varchar('role', { length: 50 }).default('employee'),
  systemRole: varchar('system_role', { length: 50 }).default('employee'),
  jobTitle: varchar('job_title', { length: 255 }),
  branchId: uuid('branch_id').references(() => branches.id),
  primaryBranchId: uuid('primary_branch_id').references(() => branches.id),
  roleId: uuid('role_id').references(() => roles.id),
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ----------------------------------------------------------------------
// 4. جدول سجلات الحضور والانصراف (Attendance Logs)
// يدعم الصورة الشخصية وإحداثيات الموقع للمطابقة مع الفرع
// ----------------------------------------------------------------------
export const attendanceLogs = pgTable('attendance_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  type: varchar('type', { length: 20 }).notNull(), // 'CHECK_IN' or 'CHECK_OUT'
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  distanceMeters: doublePrecision('distance_meters'), // البعد عن الفرع وقت التسجيل
  isWithinGeofence: boolean('is_within_geofence'),
  selfieUrl: text('selfie_url'), // رابط الصورة أو مسارها في التخزين
  status: varchar('status', { length: 50 }).default('PENDING'), // PENDING, APPROVED, REJECTED
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ----------------------------------------------------------------------
// العلاقات بين الجداول (Relations) لـ Drizzle ORM
// ----------------------------------------------------------------------
export const usersRelations = relations(users, ({ one, many }) => ({
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id],
  }),
  primaryBranch: one(branches, {
    fields: [users.primaryBranchId],
    references: [branches.id],
  }),
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  attendanceLogs: many(attendanceLogs),
}));

export const branchesRelations = relations(branches, ({ many }) => ({
  users: many(users),
  attendanceLogs: many(attendanceLogs),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const attendanceLogsRelations = relations(attendanceLogs, ({ one }) => ({
  user: one(users, {
    fields: [attendanceLogs.userId],
    references: [users.id],
  }),
  branch: one(branches, {
    fields: [attendanceLogs.branchId],
    references: [branches.id],
  }),
}));
