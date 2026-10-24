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
  radiusMeters: integer('radius_meters').default(100),
  geofenceRadius: integer('geofence_radius').default(100),
  qrSecretKey: varchar('qr_secret_key', { length: 255 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ----------------------------------------------------------------------
// 2. جدول الأدوار والصلاحيات (Roles) + تصدير customRoles للـ Backward Compatibility
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

// تصدير اسم بديل لتجنب أخطاء الاستيراد في roleActions و api/roles
export const customRoles = roles;

// ----------------------------------------------------------------------
// 3. جدول الموظفين (Users / Employees)
// ----------------------------------------------------------------------
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: varchar('phone', { length: 50 }).notNull().unique(),
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
// 4. جدول نطاق صلاحيات المسؤول بالفروع (Admin Branch Scopes)
// ----------------------------------------------------------------------
export const adminBranchScopes = pgTable('admin_branch_scopes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

// ----------------------------------------------------------------------
// 5. جدول الإشعارات (Notifications)
// ----------------------------------------------------------------------
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).default('INFO'),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ----------------------------------------------------------------------
// 6. جدول سجلات الحضور والانصراف (Attendance Logs)
// ----------------------------------------------------------------------
export const attendanceLogs = pgTable('attendance_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  type: varchar('type', { length: 20 }).notNull(), // CHECK_IN / CHECK_OUT
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  distanceMeters: doublePrecision('distance_meters'),
  isWithinGeofence: boolean('is_within_geofence'),
  selfieUrl: text('selfie_url'),
  status: varchar('status', { length: 50 }).default('PENDING'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// تصدير اسم بديل لتوافق الواجهات المتنوعة
export const attendance = attendanceLogs;

// ----------------------------------------------------------------------
// العلاقات بين الجداول (Relations)
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
  adminBranchScopes: many(adminBranchScopes),
  notifications: many(notifications),
  attendanceLogs: many(attendanceLogs),
}));

export const branchesRelations = relations(branches, ({ many }) => ({
  users: many(users),
  adminBranchScopes: many(adminBranchScopes),
  attendanceLogs: many(attendanceLogs),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const adminBranchScopesRelations = relations(adminBranchScopes, ({ one }) => ({
  user: one(users, {
    fields: [adminBranchScopes.userId],
    references: [users.id],
  }),
  branch: one(branches, {
    fields: [adminBranchScopes.branchId],
    references: [branches.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
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
