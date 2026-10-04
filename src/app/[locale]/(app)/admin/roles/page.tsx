// src/app/[locale]/(app)/admin/roles/page.tsx
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function RolesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations();

  // حماية الصفحة: فقط SUPER_ADMIN يدخلها
  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    redirect({ href: "/employee/profile", locale });
    return null;
  }

  const allUsers = await db.select().from(users).orderBy(users.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {locale === "ar" ? "الأدوار والصلاحيات" : "Roles & Permissions"}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {locale === "ar"
            ? "إدارة أدوار المستخدمين وصلاحياتهم في النظام"
            : "Manage user roles and system permissions"}
        </p>
      </div>

      <div className="rounded-[24px] border border-border bg-surface p-5 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-start text-foreground-muted">
              <th className="p-3 text-start">{locale === "ar" ? "الاسم" : "Name"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "البريد الإلكتروني" : "Email"}</th>
              <th className="p-3 text-start">{locale === "ar" ? "الدور" : "Role"}</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="p-3 text-foreground">{user.name ?? "-"}</td>
                <td className="p-3 text-foreground-muted">{user.email ?? "-"}</td>
                <td className="p-3">
                  <span className="bg-accent/10 text-accent rounded-full px-3 py-1 text-xs font-semibold">
                    {user.systemRole ?? "USER"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
