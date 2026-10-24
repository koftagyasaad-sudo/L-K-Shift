"use server";

import { db } from "@/db";
import { customRoles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type RoleData = {
  id: string;
  nameAr?: string | null;
  nameEn?: string | null;
  name?: string | null;
  description?: string | null;
  permissions?: string[] | any;
  isActive?: boolean | null;
  [key: string]: any;
};

export async function getRolesAction(): Promise<RoleData[]> {
  try {
    const list = await db.select().from(customRoles);
    return (list || []).map((r: any) => ({
      id: String(r.id),
      nameAr: r.nameAr || r.name || "دور بدون اسم",
      nameEn: r.nameEn || "",
      name: r.name || r.nameAr || "دور بدون اسم",
      description: r.description || "",
      permissions: Array.isArray(r.permissions) ? r.permissions : [],
      isActive: r.isActive ?? true,
    }));
  } catch (error) {
    console.error("Error fetching roles:", error);
    return [];
  }
}

export async function getRoleByIdAction(id: string) {
  try {
    const found = await db
      .select()
      .from(customRoles)
      .where(eq(customRoles.id, String(id)))
      .limit(1);

    if (!found[0]) return null;

    const r = found[0];
    return {
      success: true,
      data: {
        ...r,
        id: String(r.id),
      },
      ...r,
      id: String(r.id),
    };
  } catch (error) {
    console.error("Error fetching role by id:", error);
    return null;
  }
}

export async function saveRoleAction(data: any) {
  try {
    const id = data.id || data.roleId;
    const nameAr = data.nameAr || data.name || "دور جديد";
    const nameEn = data.nameEn || data.name || "";
    const name = data.name || nameAr;
    const description = data.description || nameEn || "";
    const permissions = Array.isArray(data.permissions) ? data.permissions : [];
    const isActive = data.isActive ?? true;

    const payload: any = {
      nameAr,
      nameEn,
      name,
      description,
      permissions,
      isActive,
    };

    if (id) {
      await db
        .update(customRoles)
        .set(payload)
        .where(eq(customRoles.id, String(id)));
    } else {
      await db.insert(customRoles).values(payload);
    }

    revalidatePath("/admin/roles");
    revalidatePath("/roles");
    return { success: true };
  } catch (error: any) {
    console.error("saveRoleAction error:", error);
    return {
      success: false,
      error: error?.message || "حدث خطأ أثناء حفظ بيانات الدور",
    };
  }
}

export async function createRoleAction(data: any) {
  return await saveRoleAction(data);
}

export async function updateRoleAction(id: string, data: any) {
  return await saveRoleAction({ ...data, id });
}

export async function deleteRoleAction(id: string) {
  try {
    await db.delete(customRoles).where(eq(customRoles.id, String(id)));
    revalidatePath("/admin/roles");
    revalidatePath("/roles");
    return { success: true };
  } catch (error: any) {
    console.error("deleteRoleAction error:", error);
    return { success: false, error: error?.message || "فشل حذف الدور" };
  }
}

export async function toggleRoleStatusAction(
  id: string,
  currentStatus?: boolean
) {
  try {
    const roleData = await db
      .select()
      .from(customRoles)
      .where(eq(customRoles.id, String(id)))
      .limit(1);

    if (!roleData.length) throw new Error("Role not found");

    const newStatus =
      currentStatus !== undefined ? !currentStatus : !roleData[0].isActive;

    await db
      .update(customRoles)
      .set({ isActive: newStatus })
      .where(eq(customRoles.id, String(id)));

    revalidatePath("/admin/roles");
    revalidatePath("/roles");
    return { success: true };
  } catch (error: any) {
    console.error("toggleRoleStatusAction error:", error);
    return { success: false, error: error?.message || "فشل تغيير حالة الدور" };
  }
}
