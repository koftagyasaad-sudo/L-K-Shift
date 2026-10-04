// src/app/[locale]/(app)/admin/employees/[id]/page.tsx
import { auth } from "@/auth";
import { db } from "@/db";
import { adminBranchScopes, branches, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { EmployeeForm } from "@/components/admin/employee-form";
import { DeleteEmployeeButton } from "@/components/admin/delete-employee-button";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const typedLocale = locale as "ar" | "en";
  const isAr = typedLocale === "ar";
  const session = await auth();

  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    redirect({ href: "/employee/profile", locale: typedLocale });
    return null;
  }

  const userId = Number(id);
  if (Number.isNaN(userId)) {
    notFound();
  }

  const [employee] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!employee) {
    notFound();
  }

  const allBranches = await db.select().from(branches).orderBy(branches.id);
  const scopes = await db
    .select({ branchId: adminBranchScopes.branchId })
    .from(adminBranchScopes)
    .where(eq(adminBranchScopes.userId, userId));

  const isSelf = session.user.id && Number(session.user.id) === userId;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isAr ? employee.fullNameAr : (employee.fullNameEn ?? employee.fullNameAr)}
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">{employee.jobRole}</p>
        </div>
        {!isSelf && employee.systemRole !== "SUPER_ADMIN" && (
          <DeleteEmployeeButton employeeId={employee.id} locale={typedLocale} />
        )}
      </div>

      <div className="rounded-[24px] border border-border bg-surface p-6 shadow-sm">
        <EmployeeForm
          locale={typedLocale}
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
            isActive: employee.isActive,
          }}
        />
      </div>
    </div>
  );
}
