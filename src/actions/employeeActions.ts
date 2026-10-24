"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function getEmployeesAction() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
}

export async function saveEmployeeAction(data: any) {
  try {
    // Payload Mapping: ترجمة 'name' القادم من الواجهة إلى 'fullNameAr' لقاعدة البيانات
    const payload: any = {
      fullNameAr: data.name || data.fullNameAr || "مستخدم جديد",
      fullNameEn: data.nameEn || data.fullNameEn || "",
      phone: data.phone,
      role: data.roleId || data.role || "EMPLOYEE",
      branchId: data.branchId || null,
      isActive: data.isActive ?? true,
    };

    if (data.password) {
      payload.password = await bcrypt.hash(data.password, 10);
    } else if (!data.id) {
      payload.password = await bcrypt.hash("123456", 10);
    }

    if (data.id) {
      await db.update(users).set(payload).where(eq(users.id, data.id));
    } else {
      await db.insert(users).values(payload);
    }
    revalidatePath("/admin/employees");
    return { success: true };
  } catch (error: any) {
    console.error("saveEmployeeAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteEmployeeAction(id: string) {
  try {
    await db.delete(users).where(eq(users.id, id));
    revalidatePath("/admin/employees");
    return { success: true };
  } catch (error: any) {
    console.error("deleteEmployeeAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleEmployeeStatusAction(id: string, currentStatus?: boolean) {
  try {
    const userData = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!userData.length) throw new Error("User not found");
    const newStatus = currentStatus !== undefined ? !currentStatus : !(userData[0].isActive);
    await db.update(users).set({ isActive: newStatus }).where(eq(users.id, id));
    revalidatePath("/admin/employees");
    return { success: true };
  } catch (error: any) {
    console.error("toggleEmployeeStatusAction error:", error);
    return { success: false, error: error.message };
  }
}
