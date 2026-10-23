import { db } from "@/db";
import { users, branches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

interface ProfilePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function EmployeeProfilePage({ params }: ProfilePageProps) {
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
        role: users.role,
        jobTitle: users.jobTitle,
        employeeCode: users.employeeCode,
        hourlyRate: users.hourlyRate,
        monthlySalary: users.monthlySalary,
        notes: users.notes,
        isActive: users.isActive,
        canUseAttendanceTerminal: users.canUseAttendanceTerminal,
        createdAt: users.createdAt,
        branchId: users.branchId,
        branchNameAr: branches.nameAr,
        branchNameEn: branches.nameEn,
        branchAddress: branches.address,
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
        role: users.role,
        jobTitle: users.jobTitle,
        employeeCode: users.employeeCode,
        hourlyRate: users.hourlyRate,
        monthlySalary: users.monthlySalary,
        notes: users.notes,
        isActive: users.isActive,
        canUseAttendanceTerminal: users.canUseAttendanceTerminal,
        createdAt: users.createdAt,
        branchId: users.branchId,
        branchNameAr: branches.nameAr,
        branchNameEn: branches.nameEn,
        branchAddress: branches.address,
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
        role: users.role,
        jobTitle: users.jobTitle,
        employeeCode: users.employeeCode,
        hourlyRate: users.hourlyRate,
        monthlySalary: users.monthlySalary,
        notes: users.notes,
        isActive: users.isActive,
        canUseAttendanceTerminal: users.canUseAttendanceTerminal,
        createdAt: users.createdAt,
        branchId: users.branchId,
        branchNameAr: branches.nameAr,
        branchNameEn: branches.nameEn,
        branchAddress: branches.address,
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

  const branchName = isAr
    ? userRecord.branchNameAr || userRecord.branchNameEn || "غير معين"
    : userRecord.branchNameEn || userRecord.branchNameAr || "Unassigned";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8" dir={isAr ? "rtl" : "ltr"}>
      {/* Profile Header */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600 text-2xl font-bold text-white shadow-md">
              {userRecord.name ? userRecord.name.charAt(0).toUpperCase() : "M"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{userRecord.name}</h1>
              <p className="text-sm font-medium text-slate-500">
                {userRecord.jobTitle || (isAr ? "موظف" : "Employee")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                userRecord.isActive
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {userRecord.isActive
                ? isAr
                  ? "حساب نشط"
                  : "Active Account"
                : isAr
                  ? "حساب معطل"
                  : "Disabled Account"}
            </span>
            <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
              {userRecord.role.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Details Sections */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Personal & Login Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 border-b border-slate-100 pb-2 text-lg font-bold text-slate-900">
            {isAr ? "معلومات الحساب والاتصال" : "Account & Contact Info"}
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{isAr ? "اسم الموظف:" : "Full Name:"}</span>
              <span className="font-semibold text-slate-800">{userRecord.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">
                {isAr ? "رقم الهاتف (معرف الدخول):" : "Phone (Login ID):"}
              </span>
              <span className="font-mono font-semibold text-slate-800">{userRecord.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{isAr ? "البريد الإلكتروني:" : "Email:"}</span>
              <span className="font-semibold text-slate-800">{userRecord.email || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{isAr ? "كود الموظف:" : "Employee Code:"}</span>
              <span className="font-mono font-semibold text-slate-800">
                {userRecord.employeeCode || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Work & Branch Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 border-b border-slate-100 pb-2 text-lg font-bold text-slate-900">
            {isAr ? "معلومات العمل والفرع" : "Work & Branch Info"}
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{isAr ? "الفرع المعين:" : "Assigned Branch:"}</span>
              <span className="font-semibold text-sky-700">{branchName}</span>
            </div>
            {userRecord.branchAddress ? (
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? "عنوان الفرع:" : "Branch Address:"}</span>
                <span className="font-medium text-slate-700">{userRecord.branchAddress}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-slate-500">{isAr ? "المسمى الوظيفي:" : "Job Title:"}</span>
              <span className="font-semibold text-slate-800">{userRecord.jobTitle || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{isAr ? "بصمة الحضور:" : "Terminal Access:"}</span>
              <span
                className={`font-semibold ${
                  userRecord.canUseAttendanceTerminal ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {userRecord.canUseAttendanceTerminal
                  ? isAr
                    ? "مسموح"
                    : "Allowed"
                  : isAr
                    ? "غير مسموح"
                    : "Disabled"}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
          <h2 className="mb-4 border-b border-slate-100 pb-2 text-lg font-bold text-slate-900">
            {isAr ? "بيانات الأجر والراتب" : "Salary & Financial Info"}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <span className="mb-1 block text-xs font-medium text-slate-500">
                {isAr ? "الأجر بالساعة" : "Hourly Rate"}
              </span>
              <span className="text-xl font-bold text-slate-900">
                {userRecord.hourlyRate ? `${userRecord.hourlyRate} EGP` : "—"}
              </span>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <span className="mb-1 block text-xs font-medium text-slate-500">
                {isAr ? "الراتب الشهري" : "Monthly Salary"}
              </span>
              <span className="text-xl font-bold text-slate-900">
                {userRecord.monthlySalary ? `${userRecord.monthlySalary} EGP` : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
