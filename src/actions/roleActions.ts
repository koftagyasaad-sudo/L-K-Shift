"use server";

import { db } from "@/db";
import { customRoles, customRoleAssignments } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

export type RoleData = {
  id?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  permissions?: string[];
  branch_ids?: string[];
};

export async function getRolesAction() {
  try {
    const rows = await db
      .select()
      .from(customRoles)
      .orderBy(desc(customRoles.createdAt));

    const result: RoleData[] = rows.map((r) => ({
      id: String(r.id),
      name: r.nameAr || r.nameEn,
      nameAr: r.nameAr,
      nameEn: r.nameEn,
      description: "",
      permissions: Array.isArray(r.permissions)
        ? (r.permissions as string[])
        : [],
      branch_ids: [],
    }));

    return { success: true as const, data: result };
  } catch (error) {
    console.error("getRolesAction error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch roles",
      data: [] as RoleData[],
    };
  }
}

export async function getRoleByIdAction(id: string) {
  try {
    if (!id) {
      return { success: false as const, error: "Role id is required", data: null };
    }

    const [role] = await db
      .select()
      .from(customRoles)
      .where(eq(customRoles.id, id))
      .limit(1);

    if (!role) {
      return { success: false as const, error: "Role not found", data: null };
    }

    const formatted: RoleData = {
      id: String(role.id),
      name: role.nameAr || role.nameEn,
      nameAr: role.nameAr,
      nameEn: role.nameEn,
      description: "",
      permissions: Array.isArray(role.permissions)
        ? (role.permissions as string[])
        : [],
      branch_ids: [],
    };

    return { success: true as const, data: formatted };
  } catch (error) {
    console.error("getRoleByIdAction error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch role",
      data: null,
    };
  }
}

export async function createRoleAction(data: RoleData) {
  try {
    const nameAr = (data.nameAr || data.name || "").trim();
    const nameEn = (data.nameEn || data.name || nameAr).trim();

    if (!nameAr && !nameEn) {
      return { success: false as const, error: "Role name is required" };
    }

    const permissionsArray = Array.isArray(data.permissions)
      ? data.permissions
      : [];

    const [created] = await db
      .insert(customRoles)
      .values({
        id: data.id || nanoid(),
        nameAr: nameAr || nameEn,
        nameEn: nameEn || nameAr,
        permissions: permissionsArray,
      })
      .returning();

    revalidatePath("/admin/roles");
    return { success: true as const, data: created };
  } catch (error) {
    console.error("createRoleAction error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to create role",
    };
  }
}

export async function updateRoleAction(id: string, data: RoleData) {
  try {
    if (!id) {
      return { success: false as const, error: "Role id is required" };
    }

    const nameAr = (data.nameAr || data.name || "").trim();
    const nameEn = (data.nameEn || data.name || nameAr).trim();

    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (nameAr) updatePayload.nameAr = nameAr;
    if (nameEn) updatePayload.nameEn = nameEn;
    if (Array.isArray(data.permissions)) {
      updatePayload.permissions = data.permissions;
    }

    const [updated] = await db
      .update(customRoles)
      .set(updatePayload)
      .where(eq(customRoles.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: "Role not found" };
    }

    revalidatePath("/admin/roles");
    return { success: true as const, data: updated };
  } catch (error) {
    console.error("updateRoleAction error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update role",
    };
  }
}

export async function saveRoleAction(data: RoleData) {
  if (data.id) {
    return updateRoleAction(data.id, data);
  }
  return createRoleAction(data);
}

export async function deleteRoleAction(id: string) {
  try {
    if (!id) {
      return { success: false as const, error: "Role id is required" };
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customRoleAssignments)
      .where(eq(customRoleAssignments.roleId, id));

    if (count > 0) {
      return {
        success: false as const,
        error: `Cannot delete role: assigned to ${count} employee(s)`,
      };
    }

    const [deleted] = await db
      .delete(customRoles)
      .where(eq(customRoles.id, id))
      .returning();

    if (!deleted) {
      return { success: false as const, error: "Role not found" };
    }

    revalidatePath("/admin/roles");
    return { success: true as const, data: deleted };
  } catch (error) {
    console.error("deleteRoleAction error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete role",
    };
  }
}
