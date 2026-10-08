import { auth } from "@/auth";
import { db } from "@/db";
import { roles } from "@/db/schema";
import { redirect } from "@/i18n/navigation";
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

  const allRoles = await db.select().from(roles);

  // كتالوج الصلاحيات بالشكل المطلوب المتوافق مع PermissionCategory[]
  const permissionCatalog = [
    {
      category: "Management",
      categoryAr: "الإدارة والصلاحيات",
      items: [
        { id: "manage_employees", name: "إدارة الموظفين" },
        { id: "manage_branches", name: "إدارة الفروع" },
        { id: "review_attendance", name: "مراجعة الحضور" },
        { id: "view_reports", name: "عرض التقارير" },
      ],
    },
  ];

  const formattedRoles = allRoles.map((r) => ({
    id: r.id,
    name: r.nameEn || r.nameAr,
    nameAr: r.nameAr,
    description: r.description,
    isSystem: false,
    permissions: [] as string[],
    createdAt: r.createdAt,
  }));

  return (
    <div className="space-y-6 dir-rtl text-right p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {locale === "ar" ? "إدارة الأدوار والصلاحيات" : "Manage Roles & Permissions"}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {locale === "ar"
            ? "التحكم في صلاحيات المستخدمين والأدوار المتاحة بالنظام"
            : "Control user roles and permissions in the system"}
        </p>
      </div>

      <RoleManager
        locale={locale as "ar" | "en"}
        roles={formattedRoles}
        catalog={permissionCatalog}
      />
    </div>
  );
}
