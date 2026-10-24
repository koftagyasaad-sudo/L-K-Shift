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

  const [employeeRes, branches, roles] = await Promise.all([
    getEmployeeByIdAction(id),
    getBranchesAction(),
    getRolesAction(),
  ]);

  if (!employeeRes || !employeeRes.success || !employeeRes.data) {
    notFound();
  }

  const employee = employeeRes.data;

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
