import { notFound } from "next/navigation";
import { getEmployeeByIdAction } from "@/actions/employeeActions";
import { getBranchesAction } from "@/actions/branchActions";
import { getRolesAction } from "@/actions/roleActions";
import { EmployeeForm } from "@/components/admin/employee-form";

interface EditEmployeePageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const [employeeRes, branchesRes, rolesRes] = await Promise.all([
    getEmployeeByIdAction(id),
    getBranchesAction(),
    getRolesAction(),
  ]);

  if (!employeeRes) {
    notFound();
  }

  const employee = (employeeRes as any).data || ((employeeRes as any).id ? employeeRes : null);
  if (!employee) {
    notFound();
  }

  const branches = Array.isArray(branchesRes)
    ? branchesRes
    : (branchesRes as any)?.data && Array.isArray((branchesRes as any).data)
    ? (branchesRes as any).data
    : [];

  const roles = Array.isArray(rolesRes)
    ? rolesRes
    : (rolesRes as any)?.data && Array.isArray((rolesRes as any).data)
    ? (rolesRes as any).data
    : [];

  return (
    <div className="container mx-auto py-6 max-w-4xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">تعديل بيانات الموظف</h1>
        <p className="text-slate-400 text-sm mt-1">تحديث معلومات الحساب والفرع والدور المسند</p>
      </div>
      <EmployeeForm
        initialData={employee}
        branches={branches}
        roles={roles}
        mode="edit"
      />
    </div>
  );
}
