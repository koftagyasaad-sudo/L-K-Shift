import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { users, branches, adminBranchScopes, customRoleAssignments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EmployeeForm } from "@/components/admin/employee-form";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const employeeId = Number(id);

  if (isNaN(employeeId)) {
    notFound();
  }

  const [employee] = await db
    .select()
    .from(users)
    .where(eq(users.id, employeeId))
    .limit(1);

  if (!employee) {
    notFound();
  }

  const allBranches = await db.select().from(branches);

  const scopes = await db
    .select()
    .from(adminBranchScopes)
    .where(eq(adminBranchScopes.userId, employeeId));

  const assignments = await db
    .select()
    .from(customRoleAssignments)
    .where(eq(customRoleAssignments.userId, employeeId));

  const formattedBranches = allBranches.map((b) => ({
    id: b.id,
    nameAr: b.nameAr,
    nameEn: b.nameEn,
  }));

  const initialValues = {
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
    salaryType: employee.salaryType as "MONTHLY" | "HOURLY",
    monthlySalary: employee.monthlySalary ?? "",
    hourlyRate: employee.hourlyRate ?? "",
    workingHoursPerDay: String(employee.workingHoursPerDay),
    workingDaysPerMonth: String(employee.workingDaysPerMonth),
    annualLeaveDays: String(employee.annualLeaveDays),
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 dir-rtl text-right">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          تعديل بيانات الموظف
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {employee.fullNameAr}
        </p>
      </div>

      <EmployeeForm
        mode="edit"
        initialValues={initialValues}
        branches={formattedBranches}
        locale={locale as "ar" | "en"}
      />
    </div>
  );
}
