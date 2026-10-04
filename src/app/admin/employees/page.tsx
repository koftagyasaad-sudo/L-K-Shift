// src/app/[locale]/(app)/admin/employees/page.tsx
import { auth } from "@/auth";
import { db } from "@/db";
import { branches, users } from "@/db/schema";
import { Link, redirect } from "@/i18n/navigation";
import { Plus, MapPin, Phone, IdCard, Briefcase } from "lucide-react";

export default async function EmployeesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = locale as "ar" | "en";
  const isAr = typedLocale === "ar";
  const session = await auth();

  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    redirect({ href: "/employee/profile", locale: typedLocale });
    return null;
  }

  const allUsers = await db.select().from(users).orderBy(users.id);
  const allBranches = await db.select().from(branches).orderBy(branches.id);
  const branchMap = Object.fromEntries(allBranches.map((b) => [b.id, b]));

  const managementRoleLabel = (role: string) => {
    if (role === "BRANCH_MANAGER") return isAr ? "مدير فرع" : "Branch Manager";
    if (role === "AREA_MANAGER") return isAr ? "مدير منطقة" : "Area Manager";
    return isAr ? "مستخدم عادي" : "Normal User";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isAr ? "إدارة الموظفين" : "Employee Management"}
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {isAr ? "عرض وإضافة وتعديل بيانات الموظفين" : "View, add, and edit employee records"}
          </p>
        </div>
        <Link
          href="/admin/employees/new"
          locale={typedLocale}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          {isAr ? "إضافة موظف" : "Add Employee"}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {allUsers.map((user) => {
          const branch = user.primaryBranchId ? branchMap[user.primaryBranchId] : null;
          return (
            <Link
              key={user.id}
              href={`/admin/employees/${user.id}`}
              locale={typedLocale}
              className="group rounded-[24px] border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-1 hover:border-accent hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {isAr ? user.fullNameAr : (user.fullNameEn ?? user.fullNameAr)}
                  </h3>
                  <p className="mt-0.5 text-xs text-foreground-muted">{user.jobRole}</p>
                </div>
                <span
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    user.isActive
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-red-500/10 text-red-600"
                  }`}
                >
                  {user.isActive ? (isAr ? "نشط" : "Active") : (isAr ? "موقوف" : "Inactive")}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-foreground-muted">
                <div className="flex items-center gap-2" dir="ltr">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{user.phone}</span>
                </div>
                {user.nationalId && (
                  <div className="flex items-center gap-2" dir="ltr">
                    <IdCard className="h-3.5 w-3.5 shrink-0" />
                    <span>{user.nationalId}</span>
                  </div>
                )}
                {branch && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{isAr ? branch.nameAr : branch.nameEn}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-semibold text-accent">
                  <Briefcase className="h-3 w-3" />
                  {user.systemRole === "SUPER_ADMIN" ? "SUPER ADMIN" : managementRoleLabel(user.managementRole)}
                </span>
                {user.employeeNumber && (
                  <span className="text-[10px] text-foreground-subtle" dir="ltr">
                    #{user.employeeNumber}
                  </span>
                )}
              </div>
            </Link>
          );
        })}

        {allUsers.length === 0 && (
          <div className="col-span-full rounded-[24px] border border-dashed border-border p-10 text-center text-sm text-foreground-muted">
            {isAr ? "لا يوجد موظفون بعد" : "No employees yet"}
          </div>
        )}
      </div>
    </div>
  );
}
