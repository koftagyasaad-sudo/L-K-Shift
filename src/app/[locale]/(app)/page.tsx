import { auth } from "@/auth";
import { db } from "@/db";
import { users, branches, attendanceLogs } from "@/db/schema";
import { redirect } from "@/i18n/navigation";

export default async function DashboardPage({
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

  const branchRows = await db.select().from(branches).orderBy(branches.id);
  
  // الاستعلام يعتمد فقط على الحقول الموجودة في قاعدة البيانات (branchId)
  const userRows = await db
    .select({
      id: users.id,
      branchId: users.branchId,
    })
    .from(users);

  const attendanceRows = await db
    .select({
      branchId: attendanceLogs.branchId,
    })
    .from(attendanceLogs);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 dir-rtl text-right">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {locale === "ar" ? "لوحة التحكم الرئيسية" : "Main Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {locale === "ar" ? "نظرة عامة على الحضور والفروع" : "Overview of attendance and branches"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-[24px] border border-border bg-surface shadow-sm">
          <span className="text-sm text-foreground-muted">{locale === "ar" ? "إجمالي الفروع" : "Total Branches"}</span>
          <p className="text-3xl font-bold text-foreground mt-2">{branchRows.length}</p>
        </div>
        <div className="p-6 rounded-[24px] border border-border bg-surface shadow-sm">
          <span className="text-sm text-foreground-muted">{locale === "ar" ? "إجمالي الموظفين" : "Total Employees"}</span>
          <p className="text-3xl font-bold text-foreground mt-2">{userRows.length}</p>
        </div>
        <div className="p-6 rounded-[24px] border border-border bg-surface shadow-sm">
          <span className="text-sm text-foreground-muted">{locale === "ar" ? "سجلات الحضور" : "Attendance Logs"}</span>
          <p className="text-3xl font-bold text-foreground mt-2">{attendanceRows.length}</p>
        </div>
      </div>
    </div>
  );
}
