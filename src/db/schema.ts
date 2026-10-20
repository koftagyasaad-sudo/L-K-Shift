import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";

export const branches = pgTable("branches", {
  id: text("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  address: text("address"),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  radiusMeters: integer("radius_meters").default(100).notNull(),
  geofenceRadius: integer("geofence_radius").default(100).notNull(),
  qrSecretKey: text("qr_secret_key").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").default("employee").notNull(), // admin, manager, employee
  branchId: text("branch_id").references(() => branches.id),
  department: text("department"),
  jobTitle: text("job_title"),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  monthlySalary: numeric("monthly_salary", { precision: 12, scale: 2 }),
  isActive: boolean("is_active").default(true).notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const customRoles = pgTable("custom_roles", {
  id: text("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  permissions: jsonb("permissions").default([]).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const customRoleAssignments = pgTable("custom_role_assignments", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roleId: text("role_id")
    .notNull()
    .references(() => customRoles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const attendanceLogs = pgTable("attendance_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  branchId: text("branch_id").references(() => branches.id),
  checkIn: timestamp("check_in", { withTimezone: true }).notNull(),
  checkOut: timestamp("check_out", { withTimezone: true }),
  checkInLatitude: text("check_in_latitude"),
  checkInLongitude: text("check_in_longitude"),
  checkInSelfieUrl: text("check_in_selfie_url"),
  checkOutLatitude: text("check_out_latitude"),
  checkOutLongitude: text("check_out_longitude"),
  checkOutSelfieUrl: text("check_out_selfie_url"),
  status: text("status").default("present").notNull(), // present, late, absent, left_early
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const shifts = pgTable("shifts", {
  id: text("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  startTime: text("start_time").notNull(), // HH:mm
  endTime: text("end_time").notNull(), // HH:mm
  gracePeriodMinutes: integer("grace_period_minutes").default(15).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
