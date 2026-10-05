import { auth } from "@/auth";
import { db } from "@/db";
import { users, leaveRequests } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { redirect } from "@/i18n/navigation";
import { Wallet, Clock, CalendarDays, TrendingUp } from "lucide-react";

export default async function MySalaryPage({
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
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const currentYear = new Date().getFullYear();
  const yearStart = new Date(`${currentYear}-01-01`);
  const yearEnd = new Date(`${currentYear}-12-31`);

  const approvedLeaves = await db
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

  const usedLeaveDays = approvedLeaves.reduce((sum, l) => sum + l.totalDays, 0);
  const annualLeaveDays = user.annualLeaveDays ?? 21;
  const remainingLeaveDays = Math.max(annualLeaveDays - usedLeaveDays, 0);
  const workingHoursPerDay = user.workingHoursPerDay ?? 8;
  const workingDaysPerMonth = user.workingDaysPerMonth ?? 26;

  const calculatedMonthlySalary =
    user.salaryType === "HOURLY"
      ? Number(user.hourlyRate ?? 0) * workingHoursPerDay * workingDaysPerMonth
      : Number(user.monthlySalary ?? 0);

  const isAr = locale === "ar";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{isAr ? "راتبي" : "My Salary"}</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {isAr ? "تفاصيل الراتب والإجازات الخاصة بك" : "Your salary and leave details"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2 text-accent">
            <Wallet className="h-5 w-5" />
            <span className="text-xs font-semibold text-foreground-muted">
              {isAr ? "الراتب الشهري المقدر" : "Estimated Monthly Salary"}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {calculatedMonthlySalary.toLocaleString()} {isAr ? "ج.م" : "EGP"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2 text-accent">
            <Clock className="h-5 w-5" />
            <span className="text-xs font-semibold text-foreground-muted">
              {isAr ? "نظام الراتب" : "Salary Type"}
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-foreground">
            {user.salaryType === "HOURLY"
              ? isAr ? "بالساعة" : "Hourly"
              : isAr ? "شهري ثابت" : "Fixed Monthly"}
          </p>
          {user.salaryType === "HOURLY" && (
            <p className="mt-1 text-xs text-foreground-muted">
              {Number(user.hourlyRate ?? 0).toLocaleString()} {isAr ? "ج.م/ساعة" : "EGP/hour"} ×{" "}
              {workingHoursPerDay} {isAr ? "ساعة" : "hrs"} × {workingDaysPerMonth} {isAr ? "يوم" : "days"}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2 text-accent">
            <CalendarDays className="h-5 w-5" />
            <span className="text-xs font-semibold text-foreground-muted">
              {isAr ? "رصيد الإجازات المتبقي" : "Remaining Leave Balance"}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {remainingLeaveDays} {isAr ? "يوم" : "days"}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">
            {isAr
              ? `من إجمالي ${annualLeaveDays} يوم سنويًا`
              : `out of ${annualLeaveDays} days annually`}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2 text-accent">
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs font-semibold text-foreground-muted">
              {isAr ? "الإجازات المستخدمة" : "Used Leave Days"}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {usedLeaveDays} {isAr ? "يوم" : "days"}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">
            {isAr ? `خلال عام ${currentYear}` : `during ${currentYear}`}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background-secondary/50 p-5">
        <p className="text-xs text-foreground-muted">
          {isAr
            ? "ملاحظة: هذا الراتب تقديري بناءً على بيانات التوظيف المسجلة، وقد يختلف الراتب الفعلي حسب أيام الحضور الفعلية والخصومات والمكافآت."
            : "Note: This is an estimated salary based on registered employment data. The actual salary may vary based on actual attendance, deductions, and bonuses."}
        </p>
      </div>
    </div>
  );
}
