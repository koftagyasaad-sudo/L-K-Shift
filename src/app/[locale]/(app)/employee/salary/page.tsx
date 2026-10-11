import { auth } from "@/auth";
import { db } from "@/db";
import { users, leaveRequests } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { redirect } from "@/i18n/navigation";

export default async function EmployeeSalaryPage({
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

  const [employee] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const currentYear = new Date().getFullYear();
  const yearStart = `${currentYear}-01-01`;
  const yearEnd = `${currentYear}-12-31`;

  const leaves = await db
    .select()
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.userId, userId),
        eq(leaveRequests.status, "APPROVED"),
        gte(leaveRequests.startDate, yearStart),
        lte(leaveRequests.startDate, yearEnd)
      )
    );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 dir-rtl text-right">
      <div className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">
          {locale === "ar" ? "الراتب والسجلاّت المالية" : "Salary & Financial Records"}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {locale === "ar"
            ? "عرض تفاصيل الراتب والخصومات والإجازات السنوية"
            : "View salary details, deductions, and annual leaves"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-[24px] border border-border bg-surface p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            {locale === "ar" ? "معلومات الراتب الأساسي" : "Base Salary Information"}
          </h2>
          <div className="p-4 rounded-2xl bg-background-secondary border border-border flex justify-between items-center">
            <span className="text-sm text-foreground-muted">{locale === "ar" ? "الموظف" : "Employee"}</span>
            <span className="font-semibold text-foreground">
              {(locale === "ar" ? employee?.fullNameAr : employee?.fullNameEn ?? employee?.fullNameAr) || "-"}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-background-secondary border border-border flex justify-between items-center">
            <span className="text-sm text-foreground-muted">{locale === "ar" ? "رقم الموظف" : "Employee ID"}</span>
            <span className="font-semibold text-foreground">{employee?.employeeNumber || "-"}</span>
          </div>
          <div className="p-4 rounded-2xl bg-background-secondary border border-border flex justify-between items-center">
            <span className="text-sm text-foreground-muted">{locale === "ar" ? "نظام الراتب" : "Salary Type"}</span>
            <span className="font-semibold text-foreground">
              {employee?.salaryType === "HOURLY"
                ? (locale === "ar" ? "بالساعة" : "Hourly")
                : (locale === "ar" ? "شهري" : "Monthly")}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-background-secondary border border-border flex justify-between items-center">
            <span className="text-sm text-foreground-muted">
              {employee?.salaryType === "HOURLY"
                ? (locale === "ar" ? "سعر الساعة" : "Hourly Rate")
                : (locale === "ar" ? "الراتب الشهري" : "Monthly Salary")}
            </span>
            <span className="font-semibold text-foreground">
              {employee?.salaryType === "HOURLY"
                ? employee?.hourlyRate ?? "-"
                : employee?.monthlySalary ?? "-"}{" "}
              {locale === "ar" ? "ج.م" : "EGP"}
            </span>
          </div>
        </div>

        <div className="rounded-[24px] border border-border bg-surface p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            {locale === "ar" ? "ملخص إجازات العام" : "Annual Leaves Summary"}
          </h2>
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center text-emerald-600">
            <span className="text-sm">{locale === "ar" ? "الإجازات المعتمدة" : "Approved Leaves"}</span>
            <span className="text-xl font-bold">{leaves.length}</span>
          </div>
          <div className="p-4 rounded-2xl bg-background-secondary border border-border flex justify-between items-center">
            <span className="text-sm text-foreground-muted">{locale === "ar" ? "الرصيد السنوي" : "Annual Balance"}</span>
            <span className="font-semibold text-foreground">{employee?.annualLeaveDays ?? "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
