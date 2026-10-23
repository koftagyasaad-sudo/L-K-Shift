"use server";

import { db } from "@/db";
import { customRoles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getRolesAction() {
  try {
    const list = await db
      .select()
      .from(customRoles)
      .orderBy(desc(customRoles.createdAt));

    return {
      success: true,
      data: list,
      roles: list,
    };
  } catch (error: any) {
    console.error("getRolesAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch roles",
      data: [],
      roles: [],
    };
  }
}

export async function getRoleByIdAction(id: string) {
  try {
    const [role] = await db
      .select()
      .from(customRoles)
      .where(eq(customRoles.id, id))
      .limit(1);

    if (!role) {
      return {
        success: false,
        error: "Role not found",
        data: null,
        role: null,
      };
    }

    return {
      success: true,
      data: role,
      role,
    };
  } catch (error: any) {
    console.error("getRoleByIdAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch role",
      data: null,
      role: null,
    };
  }
}

export async function createRoleAction(data: any) {
  try {
    const id = data.id || crypto.randomUUID();
    const payload: any = {
      id,
      nameAr: data.nameAr || data.name || "دور مخصص",
      nameEn: data.nameEn || data.name || "Custom Role",
      description: data.description || null,
      permissions: data.permissions || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [newRole] = await db
      .insert(customRoles)
      .values(payload)
      .returning();

    revalidatePath("/admin");
    return {
      success: true,
      data: newRole,
      role: newRole,
    };
  } catch (error: any) {
    console.error("createRoleAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to create role",
    };
  }
}

export async function updateRoleAction(id: string, data: any) {
  try {
    const payload: any = {
      nameAr: data.nameAr || data.name,
      nameEn: data.nameEn || data.name,
      description: data.description || null,
      permissions: data.permissions || null,
      updatedAt: new Date(),
    };

    const [updatedRole] = await db
      .update(customRoles)
      .set(payload)
      .where(eq(customRoles.id, id))
      .returning();

    revalidatePath("/admin");
    return {
      success: true,
      data: updatedRole,
      role: updatedRole,
    };
  } catch (error: any) {
    console.error("updateRoleAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to update role",
    };
  }
}

export async function saveRoleAction(data: any) {
  if (data.id) {
    return updateRoleAction(data.id, data);
  }
  return createRoleAction(data);
}

export async function deleteRoleAction(id: string) {
  try {
    const [deleted] = await db
      .delete(customRoles)
      .where(eq(customRoles.id, id))
      .returning();

    revalidatePath("/admin");
    return {
      success: true,
      data: deleted,
      role: deleted,
    };
  } catch (error: any) {
    console.error("deleteRoleAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete role",
    };
  }
}
