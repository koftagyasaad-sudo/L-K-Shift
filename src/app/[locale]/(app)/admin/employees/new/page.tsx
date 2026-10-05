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
  const session = await auth();

  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    redirect({ href: "/employee/profile", locale });
    return null;
  }

  const allBranches = await db.select().from(branches).orderBy(branches.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {locale === "ar" ? "إضافة موظف جديد" : "Add New Employee"}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {locale === "ar" ? "أدخل بيانات الموظف وحدد صلاحياته" : "Enter employee data and set permissions"}
        </p>
      </div>

      <div className="rounded-[24px] border border-border bg-surface p-6 shadow-sm">
        <EmployeeForm locale={locale as "ar" | "en"} branches={allBranches} mode="create" />
      </div>
    </div>
  );
}
