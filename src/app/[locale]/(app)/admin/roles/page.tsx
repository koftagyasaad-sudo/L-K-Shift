import { getRolesAction, type RoleData } from "@/actions/roleActions";
import { RoleManager } from "@/components/admin/role-manager";

export default async function AdminRolesPage() {
  const rolesList = await getRolesAction();

  const formattedRoles: RoleData[] = (rolesList || []).map((r: any) => ({
    id: String(r.id || Math.random().toString()),
    nameAr: r.nameAr || r.name || "دور بدون اسم",
    nameEn: r.nameEn || "",
    name: r.name || r.nameAr || "دور بدون اسم",
    description: r.description || "",
    permissions: Array.isArray(r.permissions) ? r.permissions : [],
    isActive: r.isActive ?? true,
  }));

  return (
    <div className="container mx-auto py-6">
      <RoleManager initialRoles={formattedRoles} />
    </div>
  );
}
