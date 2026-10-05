import { auth } from "@/auth";
import { db } from "@/db";
import { users, branches, adminBranchScopes, customRoleAssignments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "@/i18n/navigation";
import { EmployeeForm } from "@/components/admin/employee-form";
import { notFound } from "next/navigation";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();

  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    redirect({ href: "/employee/profile", locale });
    return null;
  }

  const userId = Number(id);
  const [employee] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!employee) {
    notFound();
  }

  const allBranches = await db.select().from(branches).orderBy(branches.id);
  const scopes = await db.select().from(adminBranchScopes).where(eq(adminBranchScopes.userId, userId));
  const assignments = await db
    .select()
    .from(customRoleAssignments)
    .where(eq(customRoleAssignments.userId, userId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {locale === "ar" ? "تعديل بيانات الموظف" : "Edit Employee"}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {locale === "ar" ? employee.fullNameAr : (employee.fullNameEn ?? employee.fullNameAr)}
        </p>
      </div>

      <div className="rounded-[24px] border border-border bg-surface p-6 shadow-sm">
        <EmployeeForm
          locale={locale as "ar" | "en"}
          branches={allBranches}
          mode="edit"
          initialValues={{
            id: employee.id,
            fullNameAr: employee.fullNameAr,
            fullNameEn: employee.fullNameEn ?? "",
            phone: employee.phone,
            nationalId: employee.nationalId ?? "",
            address: employee.address ?? "",
            governorate: employee.governorate ?? "",
            employeeNumber: employee.employeeNumber ?? "",
            jobRole: employee.jobRole,
            primaryBranchId: employee.primaryBranchId ? String(employee.primaryBranchId) : "",
            managementRole: employee.managementRole,
            managedBranchIds: scopes.map((s) => s.branchId),
            customRoleIds: assignments.map((a) => a.roleId),
            isActive: employee.isActive,
          }}
        />
      </div>
    </div>
  );
}
