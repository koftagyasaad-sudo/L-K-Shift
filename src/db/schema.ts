import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  numeric,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const branches = pgTable("branches", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  nameEn: text("name_en"),
  address: text("address"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  geofenceRadius: integer("geofence_radius").default(100),
  radiusMeters: integer("radius_meters").default(100),
  isActive: boolean("is_active").default(true),
  googleMapsUrl: text("google_maps_url"),
  phone: text("phone"),
  managerName: text("manager_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  nameEn: text("name_en"),
  description: text("description"),
  permissions: text("permissions"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customRoles = roles;

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  roleId: uuid("role_id").references(() => roles.id),
  role: text("role").default("EMPLOYEE"),
  branchId: uuid("branch_id").references(() => branches.id),
  isActive: boolean("is_active").default(true),
  employeeCode: text("employee_code"),
  hourlyRate: numeric("hourly_rate"),
  monthlySalary: numeric("monthly_salary"),
  avatarUrl: text("avatar_url"),
  gender: text("gender"),
  nationalId: text("national_id"),
  hireDate: timestamp("hire_date"),
  birthDate: timestamp("birth_date"),
  canUseAttendanceTerminal: boolean("can_use_attendance_terminal").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adminBranchScopes = pgTable("admin_branch_scopes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendanceLogs = pgTable("attendance_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").references(() => branches.id),
  type: text("type").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  selfieUrl: text("selfie_url"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  status: text("status").default("PENDING"),
  verificationStatus: text("verification_status").default("VERIFIED"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const attendance = attendanceLogs;

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const branchesRelations = relations(branches, ({ many }) => ({
  users: many(users),
  attendanceLogs: many(attendanceLogs),
  adminBranchScopes: many(adminBranchScopes),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id],
  }),
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  attendanceLogs: many(attendanceLogs),
  adminBranchScopes: many(adminBranchScopes),
  notifications: many(notifications),
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

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
