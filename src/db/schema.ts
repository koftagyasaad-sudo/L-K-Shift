// أضف هذه الحقول داخل جدول attendanceLogs في src/db/schema.ts
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
  lateReason: text("late_reason"), // سبب التأخير (إن وجد)
  notes: text("notes"), // ملاحظات الآدمن
  createdAt: timestamp("created_at").defaultNow(),
});
