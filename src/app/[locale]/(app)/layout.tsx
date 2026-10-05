// src/app/[locale]/(app)/layout.tsx
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GlobalHeader } from "@/components/layout/global-header";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("header");
  const typedLocale = locale as "ar" | "en";
  const dir = typedLocale === "ar" ? "rtl" : "ltr";
  const isSuperAdmin = session.user.systemRole === "SUPER_ADMIN";

  // جلب الصلاحية الإدارية من قاعدة البيانات (غير موجودة في الـ session مباشرة)
  const [currentUser] = await db
    .select({ managementRole: users.managementRole })
    .from(users)
    .where(eq(users.id, Number(session.user.id)))
    .limit(1);

  const isManager = isSuperAdmin || (currentUser?.managementRole && currentUser.managementRole !== "NONE");

  const logoutLabel = typedLocale === "ar" ? "تسجيل الخروج" : "Logout";
  const manageEmployeesLabel = typedLocale === "ar" ? "إدارة الموظفين" : "Manage Employees";
  const attendanceLabel = typedLocale === "ar" ? "تسجيل الحضور" : "Attendance";
  const attendanceReviewLabel = typedLocale === "ar" ? "مراجعة الحضور" : "Attendance Review";
  const mySalaryLabel = typedLocale === "ar" ? "راتبي" : "My Salary";

  return (
    <div dir={dir} className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        locale={typedLocale}
        isSuperAdmin={isSuperAdmin}
        isManager={Boolean(isManager)}
        isAuthenticated
        labels={{
          overview: t("overview"),
          adminRoles: t("adminRoles"),
          employeeProfile: t("employeeProfile"),
          manageEmployees: manageEmployeesLabel,
          logout: logoutLabel,
          attendance: attendanceLabel,
          attendanceReview: attendanceReviewLabel,
          mySalary: mySalaryLabel,
        }}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <GlobalHeader locale={typedLocale} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
