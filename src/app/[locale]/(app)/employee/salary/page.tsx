import { db } from "@/db";
import { users, attendanceLogs, branches } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

interface SalaryPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function EmployeeSalaryPage({ params }: SalaryPageProps) {
  const { locale } = await params;
  const isAr = locale !== "en";

  const session = await getServerSession();
  const sessionUserEmail = session?.user?.email;
  const sessionUserName = session?.user?.name;

  let userRecord = null;

  if (sessionUserEmail) {
    const found = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        email: users.email,
        hourlyRate: users.hourlyRate,
        monthlySalary: users.monthlySalary,
        jobTitle: users.jobTitle,
        employeeCode: users.employeeCode,
        branchId: users.branchId,
        branchNameAr: branches.nameAr,
        branchNameEn: branches.nameEn,
      })
      .from(users)
      .leftJoin(branches, eq(users.branchId, branches.id))
      .where(eq(users.email, sessionUserEmail))
      .limit(1);

    if (found.length > 0) {
      userRecord = found[0];
    }
  }

  if (!userRecord && sessionUserName) {
    const found = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        email: users.email,
        hourlyRate: users.hourlyRate,
        monthlySalary: users.monthlySalary,
        jobTitle: users.jobTitle,
        employeeCode: users.employeeCode,
        branchId: users.branchId,
        branchNameAr: branches.nameAr,
        branchNameEn: branches.nameEn,
      })
      .from(users)
      .leftJoin(branches, eq(users.branchId, branches.id))
      .where(eq(users.phone, sessionUserName))
      .limit(1);

    if (found.length > 0) {
      userRecord = found[0];
    }
  }

  if (!userRecord) {
    const found = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        email: users.email,
        hourlyRate: users.hourlyRate,
        monthlySalary: users.monthlySalary,
        jobTitle: users.jobTitle,
        employeeCode: users.employeeCode,
        branchId: users.branchId,
        branchNameAr: branches.nameAr,
        branchNameEn: branches.nameEn,
      })
      .from(users)
      .leftJoin(branches, eq(users.branchId, branches.id))
      .limit(1);

    if (found.length > 0) {
      userRecord = found[0];
    }
  }

  if (!userRecord) {
    notFound();
  }

  const userIdString = String(userRecord.id);

  // حساب تسجيلات الحضور للشهر الحالي
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const logs = await db
    .select()
    .from(attendanceLogs)
    .where(
      and(
        eq(attendanceLogs.userId, userIdString),
        gte(attendanceLogs.timestamp, startOfMonth)
      )
    );

  const checkInCount = logs.filter((l) => l.type === "check_in").length;

  const hourlyRateNum = userRecord.hourlyRate ? Number(userRecord.hourlyRate) : 0;
  const monthlySalaryNum = userRecord.monthlySalary ? Number(userRecord.monthlySalary) : 0;

  const branchName = isAr
    ? userRecord.branchNameAr || userRecord.branchNameEn || "غير معين"
    : userRecord.branchNameEn || userRecord.branchNameAr || "Unassigned";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          {isAr ? "كشف الراتب والأجر" : "Salary & Payroll Details"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {isAr
            ? "تفاصيل المستحقات المالية والساعات المسجلة للشهر الحالي"
            : "Overview of earnings and attendance logs for the current month"}
        </p>
      </div>

      {/* Cards Overview */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">
            {isAr ? "الأجر بالساعة" : "Hourly Rate"}
          </span>
          <p className="mt-2 text-2xl font-bold text-sky-700">
            {hourlyRateNum > 0 ? `${hourlyRateNum.toFixed(2)} EGP` : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">
            {isAr ? "الراتب الشهري الأساسي" : "Base Monthly Salary"}
          </span>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {monthlySalaryNum > 0 ? `${monthlySalaryNum.toFixed(2)} EGP` : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">
            {isAr ? "تسجيلات الحضور هذا الشهر" : "Monthly Check-Ins"}
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {checkInCount} <span className="text-xs font-normal text-slate-500">{isAr ? "مرّة" : "times"}</span>
          </p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 border-b border-slate-100 pb-2 text-lg font-bold text-slate-900">
          {isAr ? "تفاصيل الموظف والفرع" : "Employee & Branch Breakdown"}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
          <div className="flex justify-between border-b border-slate-50 pb-2">
            <span className="text-slate-500">{isAr ? "الاسم:" : "Name:"}</span>
            <span className="font-semibold text-slate-800">{userRecord.name}</span>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-2">
            <span className="text-slate-500">{isAr ? "رقم الهاتف:" : "Phone:"}</span>
            <span className="font-mono font-semibold text-slate-800">{userRecord.phone}</span>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-2">
            <span className="text-slate-500">{isAr ? "كود الموظف:" : "Code:"}</span>
            <span className="font-mono font-semibold text-slate-800">
              {userRecord.employeeCode || "—"}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-2">
            <span className="text-slate-500">{isAr ? "الفرع:" : "Branch:"}</span>
            <span className="font-semibold text-sky-700">{branchName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
