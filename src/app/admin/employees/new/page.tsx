// src/app/[locale]/(app)/admin/employees/new/page.tsx
import { auth } from "@/auth";
import { db } from "@/db";
import { branches } from "@/db/schema";
import { redirect } from "@/i18n/navigation";
import { EmployeeForm } from "@/components/admin/employee-form";

export default async function NewEmployeePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = locale as "ar" | "en";
  const isAr = typedLocale === "ar";
  const session = await auth();

  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    redirect({ href: "/employee/profile", locale: typedLocale });
    return null;
  }

  const allBranches = await db.select().from(branches).orderBy(branches.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isAr ? "إضافة موظف جديد" : "Add New Employee"}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {isAr ? "أدخل بيانات الموظف الجديد" : "Enter the new employee details"}
        </p>
      </div>

      <div className="rounded-[24px] border border-border bg-surface p-6 shadow-sm">
        <EmployeeForm locale={typedLocale} branches={allBranches} mode="create" />
      </div>
    </div>
  );
}
