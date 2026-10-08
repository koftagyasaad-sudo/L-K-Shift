import { auth } from "@/auth";
import { db } from "@/db";
import { attendanceLogs, branches, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "@/i18n/navigation";

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect({ href: "/login", locale });
    return null;
  }

  const userId = Number(session.user.id);

  // جلب بيانات الموظف مع الفرع
  const [employee] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      employeeNumber: users.employeeNumber,
      branchId: users.branchId,
      branchName: branches.nameAr,
    })
    .from(users)
    .leftJoin(branches, eq(users.branchId, branches.id))
    .where(eq(users.id, userId))
    .limit(1);

  // جلب سجلات الحضور الخاصة بالمستخدم
  const myAttendance = await db
    .select()
    .from(attendanceLogs)
    .where(eq(attendanceLogs.userId, userId))
    .orderBy(desc(attendanceLogs.workDate));

  const totalRecords = myAttendance.length;
  // التصحيح هنا: استخدام الحقل الصحيح checkInApprovalStatus بدلاً من status غير الموجودة
  const approvedCount = myAttendance.filter((a) => a.checkInApprovalStatus === "APPROVED" || a.checkInApprovalStatus === "AUTO_APPROVED").length;
  const pendingCount = myAttendance.filter((a) => a.checkInApprovalStatus === "PENDING").length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 dir-rtl text-right">
      <div className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">
          {locale === "ar" ? "الملف الشخصي للموظف" : "Employee Profile"}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {locale === "ar" ? "معلومات الحساب وسجلات الحضور والانصراف" : "Account details and attendance records"}
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-background-secondary border border-border">
            <span className="text-xs text-foreground-muted">{locale === "ar" ? "الاسم" : "Name"}</span>
            <p className="text-base font-semibold text-foreground mt-1">{employee?.name || "-"}</p>
          </div>
          <div className="p-4 rounded-2xl bg-background-secondary border border-border">
            <span className="text-xs text-foreground-muted">{locale === "ar" ? "رقم الموظف" : "Employee Number"}</span>
            <p className="text-base font-semibold text-foreground mt-1">{employee?.employeeNumber || "-"}</p>
          </div>
          <div className="p-4 rounded-2xl bg-background-secondary border border-border">
            <span className="text-xs text-foreground-muted">{locale === "ar" ? "الفرع" : "Branch"}</span>
            <p className="text-base font-semibold text-foreground mt-1">{employee?.branchName || "غير محدد"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-surface p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-foreground">
          {locale === "ar" ? "إحصائيات وحالة الحضور" : "Attendance Statistics"}
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-600 text-center">
            <span className="text-xs block">{locale === "ar" ? "إجمالي السجلات" : "Total Records"}</span>
            <span className="text-2xl font-bold mt-1 block">{totalRecords}</span>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-600 text-center">
            <span className="text-xs block">{locale === "ar" ? "المقبولة" : "Approved"}</span>
            <span className="text-2xl font-bold mt-1 block">{approvedCount}</span>
          </div>
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-600 text-center">
            <span className="text-xs block">{locale === "ar" ? "قيد المراجعة" : "Pending"}</span>
            <span className="text-2xl font-bold mt-1 block">{pendingCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
