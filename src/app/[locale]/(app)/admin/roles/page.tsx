import { auth } from "@/auth";
import { db } from "@/db";
import { users, customRoles } from "@/db/schema";
import { redirect } from "@/i18n/navigation";
import { permissionCatalog } from "@/lib/permissions";
import { RoleManager } from "@/components/admin/role-manager";

export default async function RolesPage({
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

  const [allUsers, allRoles] = await Promise.all([
    db.select().from(users).orderBy(users.id),
    db.select().from(customRoles).orderBy(customRoles.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {locale === "ar" ? "الأدوار والصلاحيات" : "Roles & Permissions"}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {locale === "ar"
            ? "إنشاء صلاحيات مخصصة وتحديد أدوار المستخدمين في النظام"
            : "Create custom roles and manage user access in the system"}
        </p>
      </div>

      <RoleManager
        locale={locale as "ar" | "en"}
        roles={allRoles.map((r) => ({ ...r, permissions: r.permissions as string[] }))}
        catalog={permissionCatalog}
      />

      <div>
        <h2 className="mb-3 text-lg font-bold text-foreground">
          {locale === "ar" ? "جميع المستخدمين" : "All Users"}
        </h2>
        <div className="overflow-x-auto rounded-[24px] border border-border bg-surface p-5 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-start text-foreground-muted">
                <th className="p-3 text-start">{locale === "ar" ? "الاسم" : "Name"}</th>
                <th className="p-3 text-start">{locale === "ar" ? "الجوال" : "Phone"}</th>
                <th className="p-3 text-start">{locale === "ar" ? "الوظيفة" : "Job Role"}</th>
                <th className="p-3 text-start">{locale === "ar" ? "الصلاحية" : "System Role"}</th>
                <th className="p-3 text-start">{locale === "ar" ? "الحالة" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="p-3 text-foreground">
                    {locale === "ar" ? user.fullNameAr : (user.fullNameEn ?? user.fullNameAr)}
                  </td>
                  <td className="p-3 text-foreground-muted" dir="ltr">{user.phone}</td>
                  <td className="p-3 text-foreground-muted">{user.jobRole}</td>
                  <td className="p-3">
                    <span className="bg-accent/10 text-accent rounded-full px-3 py-1 text-xs font-semibold">
                      {user.systemRole}
                    </span>
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
                </tr>
              ))}
              {allUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-foreground-muted">
                    {locale === "ar" ? "لا يوجد مستخدمون" : "No users found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
