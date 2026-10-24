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

export async function getEmployeeByIdAction(id: string) {
  try {
    const found = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return found[0] || null;
  } catch (error) {
    console.error("Error fetching employee by id:", error);
    return null;
  }
}

export async function saveEmployeeAction(data: any) {
  try {
    const id = data.id || data.userId;
    const name = data.name || data.fullNameAr || data.fullNameEn || "موظف جديد";
    const phone = data.phone || data.phoneNumber;
    const role = data.roleId || data.role || data.systemRole || "EMPLOYEE";
    const branchId = data.branchId || data.primaryBranchId || null;
    const isActive = data.isActive ?? data.active ?? true;

    const payload: any = {
      name,
      fullNameAr: data.fullNameAr || name,
      fullNameEn: data.fullNameEn || name,
      phone,
      role,
      systemRole: role,
      branchId,
      primaryBranchId: branchId,
      isActive,
    };

    const passwordRaw = data.password || data.passwordHash || "123456";
    if (passwordRaw && !id) {
      payload.password = await bcrypt.hash(passwordRaw, 10);
      payload.passwordHash = payload.password;
    } else if (data.password) {
      payload.password = await bcrypt.hash(data.password, 10);
      payload.passwordHash = payload.password;
    }

    if (id) {
      await db.update(users).set(payload).where(eq(users.id, id));
    } else {
      await db.insert(users).values(payload);
    }

    revalidatePath("/admin/employees");
    revalidatePath("/employees");
    return { success: true };
  } catch (error: any) {
    console.error("saveEmployeeAction error:", error);
    return { success: false, error: error?.message || "حدث خطأ أثناء حفظ بيانات الموظف" };
  }
}

export async function createEmployeeAction(data: any) {
  return await saveEmployeeAction(data);
}

export async function updateEmployeeAction(id: string, data: any) {
  return await saveEmployeeAction({ ...data, id });
}

export async function deleteEmployeeAction(id: string) {
  try {
    await db.delete(users).where(eq(users.id, id));
    revalidatePath("/admin/employees");
    revalidatePath("/employees");
    return { success: true };
  } catch (error: any) {
    console.error("deleteEmployeeAction error:", error);
    return { success: false, error: error?.message || "فشل حذف الموظف" };
  }
}

export async function toggleEmployeeStatusAction(id: string, currentStatus?: boolean) {
  try {
    const userData = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!userData.length) throw new Error("User not found");
    const newStatus = currentStatus !== undefined ? !currentStatus : !(userData[0].isActive);
    await db.update(users).set({ isActive: newStatus }).where(eq(users.id, id));
    revalidatePath("/admin/employees");
    revalidatePath("/employees");
    return { success: true };
  } catch (error: any) {
    console.error("toggleEmployeeStatusAction error:", error);
    return { success: false, error: error?.message || "فشل تغيير حالة الموظف" };
  }
}
