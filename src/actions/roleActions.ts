"use server";

import { db } from "@/db";
import { customRoles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { RoleData } from "@/types";

export async function getRolesAction(): Promise<{
  success: boolean;
  roles?: RoleData[];
  data?: RoleData[];
  error?: string;
}> {
  try {
    const rows = await db.select().from(customRoles).orderBy(desc(customRoles.createdAt));

    const result: RoleData[] = rows.map((r) => ({
      id: String(r.id),
      name: r.nameAr || r.name,
      description: "",
      permissions: Array.isArray(r.permissions) ? (r.permissions as string[]) : [],
      branch_ids: [],
    }));

    return { success: true, roles: result, data: result };
  } catch (err: any) {
    console.error("Error fetching roles:", err);
    return { success: false, error: err.message || "فشل في جلب الأدوار والصلاحيات" };
  }
}

export async function saveRoleAction(
  data: RoleData
): Promise<{ success: boolean; role?: RoleData; error?: string }> {
  try {
    const name = (data.name || "").trim();
    if (!name) return { success: false, error: "اسم المسمى الوظيفي مطلوب" };

    const perms = Array.isArray(data.permissions) ? data.permissions : [];

    if (data.id) {
      const roleId = Number(data.id);
      const [updated] = await db
        .update(customRoles)
        .set({
          name: name,
          nameAr: name,
          permissions: perms, // Drizzle يحوله تلقائياً لـ JSONB صحيح
        })
        .where(eq(customRoles.id, roleId))
        .returning();

      return {
        success: true,
        role: {
          id: String(updated.id),
          name: updated.nameAr,
          permissions: Array.isArray(updated.permissions) ? (updated.permissions as string[]) : [],
        },
      };
    }

    const [created] = await db
      .insert(customRoles)
      .values({
        name: name,
        nameAr: name,
        permissions: perms, // Drizzle يحوله تلقائياً لـ JSONB صحيح
        isSystem: false,
      })
      .returning();

    return {
      success: true,
      role: {
        id: String(created.id),
        name: created.nameAr,
        permissions: Array.isArray(created.permissions) ? (created.permissions as string[]) : [],
      },
    };
  } catch (err: any) {
    console.error("Error saving role:", err);
    return { success: false, error: err.message || "فشل في حفظ الدور" };
  }
}

export async function deleteRoleAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const roleId = Number(id);
    if (!roleId) return { success: false, error: "معرف دور غير صالح" };

    await db.delete(customRoles).where(eq(customRoles.id, roleId));
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting role:", err);
    return { success: false, error: err.message || "فشل في حذف الدور" };
  }
}
