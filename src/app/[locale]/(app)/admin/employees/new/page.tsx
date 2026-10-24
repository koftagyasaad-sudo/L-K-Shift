import { getBranchesAction } from "@/actions/branchActions";
import { getRolesAction } from "@/actions/roleActions";
import { EmployeeForm } from "@/components/admin/employee-form";

export default async function NewEmployeePage() {
  const [branchesRes, rolesRes] = await Promise.all([
    getBranchesAction(),
    getRolesAction(),
  ]);

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
        <h1 className="text-2xl font-bold text-white">إضافة موظف جديد</h1>
        <p className="text-slate-400 text-sm mt-1">
          أدخل بيانات الموظف برقم التليفون (اسم المستخدم) وكلمة المرور والفرع المسند
        </p>
      </div>
      <EmployeeForm branches={branches} roles={roles} mode="create" />
    </div>
  );
}
