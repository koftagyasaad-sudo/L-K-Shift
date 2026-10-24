"use server";

import { db } from "@/db";
import { roles, customRoles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type RoleData = {
  id: string;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  description?: string | null;
  permissions?: string | string[] | null;
  isActive?: boolean | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

/**
  تحويل الصلاحيات من مصفوفة أو كائن إلى نص JSON متوافق مع Drizzle Text Column
 */
function formatPermissionsForDb(permissions: unknown): string | null {
  if (!permissions) return null;
  if (typeof permissions === "string") return permissions;
  if (Array.isArray(permissions) || typeof permissions === "object") {
    try {
      return JSON.stringify(permissions);
    } catch {
      return null;
    }
  }
  return String(permissions);
}

/**
  تحويل الصلاحيات من نص JSON مخزن بالمحرك إلى مصفوفة لسهولة استخدامها في واجهة المستخدم
 */
function parsePermissionsFromDb(permissions: unknown): string[] | string | null {
  if (!permissions) return [];
  if (Array.isArray(permissions)) return permissions;
  if (typeof permissions === "string") {
    const trimmed = permissions.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }
  return [];
}

export async function getRolesAction(): Promise<RoleData[]> {
  try {
    const targetTable = roles || customRoles;
    const rows = await db.select().from(targetTable).orderBy(desc(targetTable.createdAt));

    return (rows || []).map((r: any) => ({
      id: String(r.id),
      name: r.name || r.nameAr || "دور بدون اسم",
      nameAr: r.nameAr || r.name || "",
      nameEn: r.nameEn || "",
      description: r.description || "",
      permissions: parsePermissionsFromDb(r.permissions),
      isActive: r.isActive !== false && r.isActive !== 0,
      createdAt: r.createdAt ? String(r.createdAt) : null,
      updatedAt: r.updatedAt ? String(r.updatedAt) : null,
    }));
  } catch (error) {
    console.error("getRolesAction error:", error);
    return [];
  }
}

export async function getRoleByIdAction(id: string): Promise<RoleData | null> {
  try {
    const targetTable = roles || customRoles;
    const rows = await db.select().from(targetTable).where(eq(targetTable.id, id)).limit(1);
    if (!rows || rows.length === 0) return null;

    const r = rows[0] as any;
    return {
      id: String(r.id),
      name: r.name || r.nameAr || "دور بدون اسم",
      nameAr: r.nameAr || r.name || "",
      nameEn: r.nameEn || "",
      description: r.description || "",
      permissions: parsePermissionsFromDb(r.permissions),
      isActive: r.isActive !== false && r.isActive !== 0,
      createdAt: r.createdAt ? String(r.createdAt) : null,
      updatedAt: r.updatedAt ? String(r.updatedAt) : null,
    };
  } catch (error) {
    console.error("getRoleByIdAction error:", error);
    return null;
  }
}

export async function createRoleAction(payload: Record<string, any>) {
  try {
    const name = payload.name || payload.nameAr || "دور جديد";
    const nameAr = payload.nameAr || name;
    const nameEn = payload.nameEn || "";
    const description = payload.description || "";
    const permissionsStr = formatPermissionsForDb(payload.permissions);
    const isActive = payload.isActive !== false && payload.isActive !== 0;

    const targetTable = roles || customRoles;
    const [inserted] = await db
      .insert(targetTable)
      .values({
        name,
        nameAr,
        nameEn,
        description,
        permissions: permissionsStr,
        isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .returning();

    revalidatePath("/[locale]/(app)/admin/roles", "page");
    return { success: true, data: inserted };
  } catch (error: any) {
    console.error("createRoleAction error:", error);
    return { success: false, error: error.message || "فشل إنشاء الدور" };
  }
}

export async function updateRoleAction(id: string, payload: Record<string, any>) {
  try {
    const name = payload.name || payload.nameAr || "دور";
    const nameAr = payload.nameAr || name;
    const nameEn = payload.nameEn || "";
    const description = payload.description || "";
    const permissionsStr = formatPermissionsForDb(payload.permissions);
    const isActive = payload.isActive !== false && payload.isActive !== 0;

    const targetTable = roles || customRoles;
    await db
      .update(targetTable)
      .set({
        name,
        nameAr,
        nameEn,
        description,
        permissions: permissionsStr,
        isActive,
        updatedAt: new Date(),
      } as any)
      .where(eq(targetTable.id, id));

    revalidatePath("/[locale]/(app)/admin/roles", "page");
    revalidatePath(`/[locale]/(app)/admin/roles/${id}`, "page");
    return { success: true };
  } catch (error: any) {
    console.error("updateRoleAction error:", error);
    return { success: false, error: error.message || "فشل تحديث بيانات الدور" };
  }
}

export async function saveRoleAction(payload: Record<string, any>) {
  if (payload.id && String(payload.id).trim() !== "") {
    return await updateRoleAction(String(payload.id), payload);
  } else {
    return await createRoleAction(payload);
  }
}

export async function toggleRoleStatusAction(id: string, currentStatus?: boolean) {
  try {
    const nextStatus = currentStatus !== undefined ? !currentStatus : true;
    const targetTable = roles || customRoles;
    await db
      .update(targetTable)
      .set({
        isActive: nextStatus,
        updatedAt: new Date(),
      } as any)
      .where(eq(targetTable.id, id));

    revalidatePath("/[locale]/(app)/admin/roles", "page");
    return { success: true, isActive: nextStatus };
  } catch (error: any) {
    console.error("toggleRoleStatusAction error:", error);
    return { success: false, error: error.message || "فشل تغيير حالة الدور" };
  }
}

export async function deleteRoleAction(id: string) {
  try {
    const targetTable = roles || customRoles;
    await db.delete(targetTable).where(eq(targetTable.id, id));

    revalidatePath("/[locale]/(app)/admin/roles", "page");
    return { success: true };
  } catch (error: any) {
    console.error("deleteRoleAction error:", error);
    return { success: false, error: error.message || "فشل حذف الدور" };
  }
}
