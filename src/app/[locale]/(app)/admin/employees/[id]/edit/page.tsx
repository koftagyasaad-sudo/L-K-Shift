import { getEmployeeByIdAction } from "@/actions/employeeActions";
import { getBranchesAction } from "@/actions/branchActions";
import { getRolesAction } from "@/actions/roleActions";
import { EmployeeForm } from "@/components/admin/employee-form";
import { notFound } from "next/navigation";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;

  const [employeeRes, branchesRes, rolesRes] = await Promise.all([
    getEmployeeByIdAction(id),
    getBranchesAction(),
    getRolesAction(),
  ]);

  if (!employeeRes.success || !employeeRes.data) {
    notFound();
  }

  const branches = branchesRes.data || [];
  const roles = rolesRes.data || [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <EmployeeForm
        locale={locale}
        mode="edit"
        initialData={employeeRes.data}
        branches={branches}
        roles={roles}
        redirectTo={`/${locale}/admin/employees`}
      />
    </div>
  );
}
