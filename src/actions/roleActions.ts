"use server";

import { query } from "@/lib/db";
import type { RoleData } from "@/types";

export async function getRolesAction(): Promise<{
  success: boolean;
  roles?: RoleData[];
  error?: string;
}> {
  try {
    const result = await query(
      "SELECT id, name, description, permissions, branch_ids, created_at FROM roles ORDER BY name ASC"
    );

    const roles: RoleData[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || "",
      permissions: Array.isArray(row.permissions) ? row.permissions : [],
      branch_ids: Array.isArray(row.branch_ids) ? row.branch_ids : [],
      created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    }));

    return { success: true, roles };
  } catch (err: any) {
    console.error("Error fetching roles:", err);
    return { success: false, error: err.message || "فشل في جلب الأدوار" };
  }
}

export async function createRoleAction(
  data: RoleData
): Promise<{ success: boolean; role?: RoleData; error?: string }> {
  try {
    const { name, description, permissions, branch_ids } = data;

    if (!name || name.trim() === "") {
      return { success: false, error: "اسم الدور الوظيفي مطلوب" };
    }

    const result = await query(
      `INSERT INTO roles (name, description, permissions, branch_ids)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, permissions, branch_ids, created_at`,
      [
        name,
        description || null,
        JSON.stringify(permissions || []),
        JSON.stringify(branch_ids || []),
      ]
    );

    const row = result.rows[0];
    const role: RoleData = {
      id: row.id,
      name: row.name,
      description: row.description || "",
      permissions: Array.isArray(row.permissions) ? row.permissions : [],
      branch_ids: Array.isArray(row.branch_ids) ? row.branch_ids : [],
      created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };

    return { success: true, role };
  } catch (err: any) {
    console.error("Error creating role:", err);
    return { success: false, error: err.message || "فشل في إنشاء الدور الوظيفي" };
  }
}

export async function updateRoleAction(
  id: string,
  data: RoleData
): Promise<{ success: boolean; role?: RoleData; error?: string }> {
  try {
    const { name, description, permissions, branch_ids } = data;

    if (!name || name.trim() === "") {
      return { success: false, error: "اسم الدور الوظيفي مطلوب" };
    }

    const result = await query(
      `UPDATE roles
       SET name = $1, description = $2, permissions = $3, branch_ids = $4
       WHERE id = $5
       RETURNING id, name, description, permissions, branch_ids, created_at`,
      [
        name,
        description || null,
        JSON.stringify(permissions || []),
        JSON.stringify(branch_ids || []),
        id,
      ]
    );

    if (result.rows.length === 0) {
      return { success: false, error: "الدور غير موجود" };
    }

    const row = result.rows[0];
    const role: RoleData = {
      id: row.id,
      name: row.name,
      description: row.description || "",
      permissions: Array.isArray(row.permissions) ? row.permissions : [],
      branch_ids: Array.isArray(row.branch_ids) ? row.branch_ids : [],
      created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };

    return { success: true, role };
  } catch (err: any) {
    console.error("Error updating role:", err);
    return { success: false, error: err.message || "فشل في تحديث الدور" };
  }
}

export async function deleteRoleAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await query("DELETE FROM roles WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return { success: false, error: "الدور غير موجود" };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting role:", err);
    return { success: false, error: err.message || "فشل في حذف الدور" };
  }
}
