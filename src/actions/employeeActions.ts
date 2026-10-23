"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createEmployeeAction(data: any) {
  try {
    const id = crypto.randomUUID();
    const userPayload: any = {
      id,
      name: data.name,
      phone: data.phone,
      password: data.password || "123456",
      email: data.email || null,
      role: data.role || "EMPLOYEE",
      jobTitle: data.jobTitle || null,
      employeeCode: data.employeeCode || null,
      branchId: data.branchId || null,
      roleId: data.roleId || null,
      monthlySalary: data.monthlySalary ? String(data.monthlySalary) : null,
      hourlyRate: data.hourlyRate ? String(data.hourlyRate) : null,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      canUseAttendanceTerminal: data.canUseAttendanceTerminal !== undefined ? Boolean(data.canUseAttendanceTerminal) : true,
      notes: data.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [newUser] = await db.insert(users).values(userPayload).returning();
    revalidatePath("/admin");
    return { success: true, data: newUser };
  } catch (error: any) {
    console.error("createEmployeeAction error:", error);
    return { success: false, error: error.message || "Failed to create employee" };
  }
}

export async function updateEmployeeAction(id: string, data: any) {
  try {
    const updatePayload: any = {
      name: data.name,
      phone: data.phone,
      ...(data.password && { password: data.password }),
      email: data.email || null,
      role: data.role || "EMPLOYEE",
      jobTitle: data.jobTitle || null,
      employeeCode: data.employeeCode || null,
      branchId: data.branchId || null,
      roleId: data.roleId || null,
      monthlySalary: data.monthlySalary ? String(data.monthlySalary) : null,
      hourlyRate: data.hourlyRate ? String(data.hourlyRate) : null,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      canUseAttendanceTerminal: data.canUseAttendanceTerminal !== undefined ? Boolean(data.canUseAttendanceTerminal) : true,
      notes: data.notes || null,
      updatedAt: new Date(),
    };

    const [updatedUser] = await db
      .update(users)
      .set(updatePayload)
      .where(eq(users.id, id))
      .returning();

    revalidatePath("/admin");
    return { success: true, data: updatedUser };
  } catch (error: any) {
    console.error("updateEmployeeAction error:", error);
    return { success: false, error: error.message || "Failed to update employee" };
  }
}
