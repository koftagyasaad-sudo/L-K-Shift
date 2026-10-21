import { getBranchesAction } from "@/actions/branchActions";
import { getRolesAction } from "@/actions/roleActions";
import { EmployeeForm } from "@/components/admin/employee-form";
import { ArrowRight, ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function NewEmployeePage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = (resolvedParams.locale || "ar") as "ar" | "en";

  const [branchRes, roleRes] = await Promise.all([
    getBranchesAction(),
    getRolesAction(),
  ]);

  const branches =
    branchRes.success && Array.isArray(branchRes.data) ? branchRes.data : [];
  const roles =
    roleRes.success && Array.isArray(roleRes.data) ? roleRes.data : [];

  const isRtl = locale === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/admin/employees`}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
        >
          <BackIcon className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            {isRtl ? "إضافة موظف جديد" : "Add New Employee"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isRtl
              ? "إنشاء حساب موظف جديد وتعيين الفرع والصلاحيات والراتب"
              : "Create a new employee account, assign branch, role, and salary"}
          </p>
        </div>
      </div>

      <EmployeeForm
        locale={locale}
        branches={branches}
        roles={roles}
        mode="create"
      />
    </div>
  );
}
