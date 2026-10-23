import EmployeeForm from "@/components/admin/employee-form";
import { getBranchesAction } from "@/actions/branchActions";
import { getRolesAction } from "@/actions/roleActions";

interface NewEmployeePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function NewEmployeePage({ params }: NewEmployeePageProps) {
  const { locale } = await params;

  const [branchesRes, rolesRes] = await Promise.all([
    getBranchesAction(),
    getRolesAction(),
  ]);

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
        branches={branches}
        roles={roles}
        mode="create"
        redirectTo={`/${locale}/admin/employees`}
      />
    </div>
  );
}
