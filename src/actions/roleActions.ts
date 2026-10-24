"use server";

import { db } from "@/db";
import { customRoles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getRolesAction() {
  try {
    return await db.select().from(customRoles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return [];
  }
}

export async function saveRoleAction(data: any) {
  try {
    // Payload Mapping: دمج nameAr و nameEn في الحقول الأساسية دون إرسال أعمدة غير موجودة
    const payload = {
      name: data.nameAr || data.name || "دور جديد",
      description: data.description || data.nameEn || "",
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      isActive: data.isActive ?? true,
    };

    if (data.id) {
      await db.update(customRoles).set(payload).where(eq(customRoles.id, data.id));
    } else {
      await db.insert(customRoles).values(payload);
    }
    revalidatePath("/admin/roles");
    return { success: true };
  } catch (error: any) {
    console.error("saveRoleAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteRoleAction(id: string) {
  try {
    await db.delete(customRoles).where(eq(customRoles.id, id));
    revalidatePath("/admin/roles");
    return { success: true };
  } catch (error: any) {
    console.error("deleteRoleAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleRoleStatusAction(id: string, currentStatus?: boolean) {
  try {
    const roleData = await db.select().from(customRoles).where(eq(customRoles.id, id)).limit(1);
    if (!roleData.length) throw new Error("Role not found");
    const newStatus = currentStatus !== undefined ? !currentStatus : !(roleData[0].isActive);
    await db.update(customRoles).set({ isActive: newStatus }).where(eq(customRoles.id, id));
    revalidatePath("/admin/roles");
    return { success: true };
  } catch (error: any) {
    console.error("toggleRoleStatusAction error:", error);
    return { success: false, error: error.message };
  }
}
