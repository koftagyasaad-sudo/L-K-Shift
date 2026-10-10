import { auth } from "@/auth";
import { db } from "@/db";
import { attendanceLogs, users, branches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "@/i18n/navigation";

export default async function AttendanceReviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    redirect({ href: "/employee/profile", locale });
    return null;
  }

  // جلب سجلات الحضور مع ربط جدول الموظفين والفروع بالحقول الصحيحة تماماً
  const logs = await db
    .select({
      id: attendanceLogs.id,
      // تأكد أن الحقل هنا يطابق الـ Schema (مثل fullName أو name حسب ما هو معرّف لديك في جدول users)
      employeeName: users.fullName, 
      employeeNumber: users.employeeNumber,
      phone: users.phone,
      branchName: branches.nameAr,
      workDate: attendanceLogs.workDate,
      status: attendanceLogs.checkInApprovalStatus,
    })
    .from(attendanceLogs)
    .leftJoin(users, eq(attendanceLogs.userId, users.id))
    .leftJoin(branches, eq(attendanceLogs.branchId, branches.id))
    .orderBy(desc(attendanceLogs.createdAt))
    .limit(50);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 dir-rtl text-right">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {locale === "ar" ? "مراجعة الحضور والانصراف" : "Attendance Review"}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {locale === "ar" ? "مراجعة واعتماد سجلات حضور الموظفين" : "Review and approve employee attendance records"}
        </p>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-border bg-surface p-5 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-start text-foreground-muted">
              <th className="p-3 text-start">{locale === "ar" ? "الموظف" : "Employee"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "رقم الموظف" : "Emp Number"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "الفرع" : "Branch"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "التاريخ" : "Date"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "الحالة" : "Status"}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0">
                <td className="p-3 font-semibold text-foreground">{log.employeeName || "-"}</td>
                <td className="p-3 text-foreground-muted">{log.employeeNumber || "-"}</td>
                <td className="p-3 text-foreground-muted">{log.branchName || "-"}</td>
                <td className="p-3 text-foreground-muted" dir="ltr">{log.workDate}</td>
                <td className="p-3">
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600">
                    {log.status || "PENDING"}
                  </span>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-foreground-muted">
                  {locale === "ar" ? "لا توجد سجلات حضور" : "No attendance records found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
