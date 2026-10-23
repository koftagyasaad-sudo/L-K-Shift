import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
} from "drizzle-orm/pg-core";

// 1. Branches Table
export const branches = pgTable("branches", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  address: text("address"),
  latitude: text("latitude").notNull().default("0"),
  longitude: text("longitude").notNull().default("0"),
  radiusMeters: integer("radius_meters").notNull().default(100),
  geofenceRadius: integer("geofence_radius").notNull().default(100),
  qrSecretKey: text("qr_secret_key").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 2. Custom Roles Table
export const customRoles = pgTable("custom_roles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  description: text("description"),
  permissions: jsonb("permissions").notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 3. Users / Employees Table
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  password: text("password").notNull(),
  role: text("role").notNull().default("employee"), // 'admin' | 'manager' | 'supervisor' | 'employee'
  jobTitle: text("job_title"),
  employeeCode: text("employee_code"),
  branchId: text("branch_id").references(() => branches.id, {
    onDelete: "set null",
  }),
  roleId: text("role_id").references(() => customRoles.id, {
    onDelete: "set null",
  }),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  monthlySalary: decimal("monthly_salary", { precision: 12, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  canUseAttendanceTerminal: boolean("can_use_attendance_terminal")
    .notNull()
    .default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 4. Custom Role Assignments Table
export const customRoleAssignments = pgTable("custom_role_assignments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roleId: text("role_id")
    .notNull()
    .references(() => customRoles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// 5. Admin Branch Scopes Table
export const adminBranchScopes = pgTable("admin_branch_scopes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  branchId: text("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// 6. Shifts Table
export const shifts = pgTable("shifts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  branchId: text("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("scheduled"), // 'scheduled' | 'completed' | 'cancelled'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 7. Attendance Logs Table
export const attendanceLogs = pgTable("attendance_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  branchId: text("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'check_in' | 'check_out'
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  distanceMeters: integer("distance_meters"),
  isWithinGeofence: boolean("is_within_geofence").notNull().default(true),
  selfieUrl: text("selfie_url"),
  verificationStatus: text("verification_status").notNull().default("approved"), // 'approved' | 'rejected' | 'pending'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 8. Leave Requests Table
export const leaveRequests = pgTable("leave_requests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
  reviewerNotes: text("reviewer_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 9. Notifications Table
export const notifications = pgTable("notifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  type: text("type").notNull().default("info"),
  createdAt: timestamp("created_at").defaultNow(),
});
