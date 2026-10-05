import { auth } from "@/auth";
import { db } from "@/db";
import { users, branches, customRoles, customRoleAssignments } from "@/db/schema";
import { Link, redirect } from "@/i18n/navigation";
import { Plus } from "lucide-react";
import { EmployeeDeleteButton } from "@/components/admin/employee-delete-button";

export default async function EmployeesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    redirect({ href: "/employee/profile", locale });
    return null;
  }

  const [allUsers, allBranches, allRoles, allAssignments] = await Promise.all([
    db.select().from(users).orderBy(users.id),
    db.select().from(branches),
    db.select().from(customRoles),
    db.select().from(customRoleAssignments),
  ]);

  const branchMap = new Map(allBranches.map((b) => [b.id, locale === "ar" ? b.nameAr : b.nameEn]));
  const roleMap = new Map(allRoles.map((r) => [r.id, r.nameAr]));

  const managementLabels: Record<string, { ar: string; en: string }> = {
    NONE: { ar: "مستخدم عادي", en: "Regular User" },
    BRANCH_MANAGER: { ar: "مدير فرع", en: "Branch Manager" },
    AREA_MANAGER: { ar: "مدير منطقة", en: "Area Manager" },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {locale === "ar" ? "إدارة الموظفين" : "Manage Employees"}
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {locale === "ar"
              ? "إضافة وتعديل بيانات الموظفين وتحديد أدوارهم وصلاحياتهم"
              : "Add and manage employee data, roles, and permissions"}
          </p>
        </div>

        <Link
          href="/admin/employees/new"
          locale={locale}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          {locale === "ar" ? "إضافة موظف" : "Add Employee"}
        </Link>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-border bg-surface p-5 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-start text-foreground-muted">
              <th className="p-3 text-start">{locale === "ar" ? "الاسم" : "Name"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "الجوال" : "Phone"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "الوظيفة" : "Job Role"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "الفرع" : "Branch"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "الصلاحية الإدارية" : "Management Role"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "صلاحيات مخصصة" : "Custom Roles"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "الحالة" : "Status"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => {
              const userRoleIds = allAssignments.filter((a) => a.userId === user.id).map((a) => a.roleId);
              return (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="p-3 text-foreground">
                    {locale === "ar" ? user.fullNameAr : (user.fullNameEn ?? user.fullNameAr)}
                  </td>
                  <td className="p-3 text-foreground-muted" dir="ltr">{user.phone}</td>
                  <td className="p-3 text-foreground-muted">{user.jobRole}</td>
                  <td className="p-3 text-foreground-muted">
                    {user.primaryBranchId ? (branchMap.get(user.primaryBranchId) ?? "-") : "-"}
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                      {managementLabels[user.managementRole][locale as "ar" | "en"]}
                    </span>
                  </td>
                  <td className="p-3 text-foreground-muted">
                    {userRoleIds.length > 0
                      ? userRoleIds.map((id) => roleMap.get(id)).filter(Boolean).join("، ")
                      : "-"}
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                      }`}
                    >
                      {user.isActive
                        ? locale === "ar" ? "نشط" : "Active"
                        : locale === "ar" ? "موقوف" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/employees/${user.id}/edit`}
                        locale={locale}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-background-secondary"
                      >
                        {locale === "ar" ? "تعديل" : "Edit"}
                      </Link>
                      <EmployeeDeleteButton
                        userId={user.id}
                        isSelf={Number(session.user.id) === user.id}
                        locale={locale as "ar" | "en"}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {allUsers.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-foreground-muted">
                  {locale === "ar" ? "لا يوجد موظفون" : "No employees found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
