import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { users, branches } from "@/db/schema";
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

  // جلب بيانات الموظف
  const [employee] = await db
    .select()
    .from(users)
    .where(eq(users.id, employeeId))
    .limit(1);

  if (!employee) {
    notFound();
  }

  // جلب الفروع
  const allBranches = await db.select().from(branches);

  // تحويل الفروع للصيغة المتوافقة BranchOption[]
  const formattedBranches = allBranches.map((b) => ({
    id: b.id,
    nameAr: b.nameAr,
    nameEn: b.nameEn,
  }));

  // تجهيز القيم الأولية للنموذج
  const initialValues = {
    id: employee.id,
    name: employee.name,
    email: employee.email ?? undefined,
    phone: employee.phone ?? undefined,
    employeeNumber: employee.employeeNumber ?? undefined,
    branchId: employee.branchId ?? undefined,
    roleId: employee.roleId ?? undefined,
    isActive: employee.isActive ?? true,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 dir-rtl text-right">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          تعديل بيانات الموظف
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {employee.name}
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
