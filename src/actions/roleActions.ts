"use server";

import { neon } from "@neondatabase/serverless";
import type { RoleData } from "@/types";

export async function getRolesAction() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const roles = (await sql`
      SELECT id, name, description, created_at FROM roles ORDER BY created_at DESC
    `) as RoleData[];

    return { success: true, data: roles, roles };
  } catch (error: any) {
    console.error("getRolesAction error:", error);
    return { success: false, data: [], roles: [], error: error.message };
  }
}

export async function saveRoleAction(data: RoleData) {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    if (data.id) {
      await sql`
        UPDATE roles
        SET name = ${data.name}, description = ${data.description || null}
        WHERE id = ${data.id}
      `;
    } else {
      await sql`
        INSERT INTO roles (name, description)
        VALUES (${data.name}, ${data.description || null})
      `;
    }

    return { success: true };
  } catch (error: any) {
    console.error("saveRoleAction error:", error);
    return { success: false, error: error.message || "فشل حفظ الدور" };
  }
}

export async function deleteRoleAction(id: string) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM roles WHERE id = ${id}`;
    return { success: true };
  } catch (error: any) {
    console.error("deleteRoleAction error:", error);
    return { success: false, error: error.message || "فشل حذف الدور" };
  }
}
