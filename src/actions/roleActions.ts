"use server";

import { revalidatePath } from "next/cache";
import { neon } from "@neondatabase/serverless";

export interface RoleData {
  id: string;
  title: string;
  permissions: string[];
  branch_ids: string[];
  createdAt?: string;
}

const fallbackRoles: RoleData[] = [
  {
    id: "r1",
    title: "صلاحيات مطلقة (SUPER_ADMIN)",
    permissions: ["all"],
    branch_ids: ["b1", "b2"],
    createdAt: new Date().toISOString()
  },
  {
    id: "r2",
    title: "مدير الفرع الرئيسي",
    permissions: ["manage_employees", "view_reports", "approve_leaves"],
    branch_ids: ["b1"],
    createdAt: new Date().toISOString()
  }
];

function getClient() {
  if (!process.env.DATABASE_URL) return null;
  return neon(process.env.DATABASE_URL);
}

export async function getRolesAction(): Promise<{ success: boolean; data: RoleData[] }> {
  try {
    const sql = getClient();
    if (!sql) return { success: true, data: fallbackRoles };

    const rows = await sql`
      SELECT id, title, permissions, branch_ids, created_at as "createdAt"
      FROM roles
      ORDER BY created_at DESC
    `;

    return {
      success: true,
      data: rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        permissions: r.permissions || [],
        branch_ids: r.branch_ids || [],
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
      }))
    };
  } catch (error) {
    console.error("Neon getRolesAction Error:", error);
    return { success: true, data: fallbackRoles };
  }
}

export async function saveRoleAction(role: RoleData): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getClient();
    if (sql) {
      await sql`
        INSERT INTO roles (id, title, permissions, branch_ids)
        VALUES (${role.id}, ${role.title}, ${role.permissions}, ${role.branch_ids})
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          permissions = EXCLUDED.permissions,
          branch_ids = EXCLUDED.branch_ids
      `;
    }

    revalidatePath("/[locale]/(app)/admin/roles", "page");
    return { success: true };
  } catch (error: any) {
    console.error("Neon saveRoleAction Error:", error);
    return { success: false, error: error?.message || "فشل حفظ الدور الوظيفي" };
  }
}

export async function deleteRoleAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getClient();
    if (sql) {
      await sql`DELETE FROM roles WHERE id = ${id}`;
    }

    revalidatePath("/[locale]/(app)/admin/roles", "page");
    return { success: true };
  } catch (error: any) {
    console.error("Neon deleteRoleAction Error:", error);
    return { success: false, error: error?.message || "فشل حذف الدور" };
  }
}
