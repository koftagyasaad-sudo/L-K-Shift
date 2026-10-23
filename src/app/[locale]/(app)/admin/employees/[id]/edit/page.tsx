import { notFound } from "next/navigation";
import EmployeeForm from "@/components/admin/employee-form";
import { getEmployeeByIdAction } from "@/actions/employeeActions";
import { getBranchesAction } from "@/actions/branchActions";
import { getRolesAction } from "@/actions/roleActions";

interface EditEmployeePageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
  const { locale, id } = await params;

  const [employeeRes, branchesRes, rolesRes] = await Promise.all([
    getEmployeeByIdAction(id),
    getBranchesAction(),
    getRolesAction(),
  ]);

  if (!employeeRes.success || !employeeRes.data) {
    notFound();
  }

  const branches = branchesRes.success && Array.isArray(branchesRes.data)
    ? branchesRes.data
    : [];

  const roles = rolesRes.success && Array.isArray(rolesRes.data)
    ? rolesRes.data
    : [];

  return (
    <div className="container mx-auto px-4 py-6">
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
