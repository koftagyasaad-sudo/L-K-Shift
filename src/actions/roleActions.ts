"use server";

import { db } from "@/db";
import { customRoles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface RoleData {
  id: string;
  name?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  description?: string | null;
  permissions?: string[] | unknown | null;
  isActive?: boolean | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  [key: string]: unknown;
}

export interface SaveRoleInput {
  id?: string;
  name?: string;
  nameAr?: string;
  name_ar?: string;
  nameEn?: string;
  name_en?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
  is_active?: boolean;
}

export async function getRolesAction() {
  try {
    const data = await db.select().from(customRoles);
    return { success: true, data };
  } catch (error) {
    console.error("getRolesAction error:", error);
    return { success: false, error: "Failed to fetch roles", data: [] };
  }
}

export async function getRoleByIdAction(id: string) {
  try {
    if (!id) return { success: false, error: "Role ID required" };
    const res = await db.select().from(customRoles).where(eq(customRoles.id, id)).limit(1);
    if (!res.length) return { success: false, error: "Role not found" };
    return { success: true, data: res[0] };
  } catch (error) {
    console.error("getRoleByIdAction error:", error);
    return { success: false, error: "Failed to fetch role" };
  }
}

export async function saveRoleAction(input: SaveRoleInput) {
  try {
    const nameAr = input.nameAr || input.name_ar || input.name || "";
    const nameEn = input.nameEn || input.name_en || input.name || "";
    const description = input.description || null;
    const permissions = input.permissions || [];
    const isActive = input.isActive ?? input.is_active ?? true;

    if (input.id) {
      const [updated] = await db
        .update(customRoles)
        .set({
          nameAr,
          nameEn,
          description,
          permissions,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(customRoles.id, input.id))
        .returning();

      revalidatePath("/admin/roles");
      return { success: true, data: updated };
    } else {
      const [created] = await db
        .insert(customRoles)
        .values({
          nameAr,
          nameEn,
          description,
          permissions,
          isActive,
        })
        .returning();

      revalidatePath("/admin/roles");
      return { success: true, data: created };
    }
  } catch (error) {
    console.error("saveRoleAction error:", error);
    return { success: false, error: "Failed to save role" };
  }
}

export async function createRoleAction(input: SaveRoleInput) {
  return saveRoleAction(input);
}

export async function updateRoleAction(id: string, input: SaveRoleInput) {
  return saveRoleAction({ ...input, id });
}

export async function deleteRoleAction(id: string) {
  try {
    if (!id) return { success: false, error: "Role ID required" };
    await db.delete(customRoles).where(eq(customRoles.id, id));
    revalidatePath("/admin/roles");
    return { success: true };
  } catch (error) {
    console.error("deleteRoleAction error:", error);
    return { success: false, error: "Failed to delete role" };
  }
}
