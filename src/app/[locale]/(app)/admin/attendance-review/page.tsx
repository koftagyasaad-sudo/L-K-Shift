import React from "react";
import { db } from "@/db";
import { attendanceLogs, users, branches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import EmployeesSearchExport from "@/components/admin/employees-search-export";

export default async function AdminAttendanceReviewPage() {
  // جلب سجلات الحضور المباشرة من Neon DB مع ربط بيانات الموظف والفرع
  const logs = await db
    .select({
      id: attendanceLogs.id,
      employeeName: users.name,
      performanceId: users.employeeNumber,
      phone: users.phone,
      branchName: branches.nameAr,
      checkInTime: attendanceLogs.checkInTime,
      checkOutTime: attendanceLogs.checkOutTime,
      status: attendanceLogs.checkInApprovalStatus,
    })
    .from(attendanceLogs)
    .leftJoin(users, eq(attendanceLogs.userId, users.id))
    .leftJoin(branches, eq(attendanceLogs.branchId, branches.id))
    .orderBy(desc(attendanceLogs.checkInTime));

  // تحويل البيانات لتناسب المكون
  const formattedData = logs.map((log) => ({
    id: log.id,
    employeeName: log.employeeName || "غير محدد",
    performanceId: log.performanceId || "-",
    phone: log.phone || "-",
    branchName: log.branchName || "الفرع الرئيسي",
    checkInTime: log.checkInTime ? new LogDate(log.checkInTime).toISOString() : new Date().toISOString(),
    checkOutTime: log.checkOutTime ? new Date(log.checkOutTime).toISOString() : undefined,
    status: log.status === "AUTO_APPROVED" ? "مقبول تلقائياً" : "قيد المراجعة",
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-right dir-rtl">
        📋 تقارير سجلات الحضور والانصراف
      </h1>

      {/* مكون البحث والفلترة والتصدير إلى Excel */}
      <EmployeesSearchExport data={formattedData} />
    </div>
  );
}
