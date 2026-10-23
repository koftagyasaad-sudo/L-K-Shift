"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export interface SaveEmployeeInput {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  branchId?: string;
  branch_id?: string;
  roleId?: string;
  role_id?: string;
  role?: string;
  jobTitle?: string;
  job_title?: string;
  employeeCode?: string;
  employee_code?: string;
  hourlyRate?: number;
  hourly_rate?: number;
  monthlySalary?: number;
  monthly_salary?: number;
  isActive?: boolean;
  is_active?: boolean;
  canUseAttendanceTerminal?: boolean;
  can_use_attendance_terminal?: boolean;
  notes?: string;
}

export async function getEmployeesAction() {
  try {
    const data = await db.select().from(users);
    return { success: true, data };
  } catch (error) {
    console.error("getEmployeesAction error:", error);
    return { success: false, error: "Failed to fetch employees", data: [] };
  }
}

export async function getEmployeeByIdAction(id: string) {
  try {
    if (!id) return { success: false, error: "Employee ID required" };
    const res = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!res.length) return { success: false, error: "Employee not found" };
    return { success: true, data: res[0] };
  } catch (error) {
    console.error("getEmployeeByIdAction error:", error);
    return { success: false, error: "Failed to fetch employee" };
  }
}

export async function saveEmployeeAction(input: SaveEmployeeInput) {
  try {
    const branchId = input.branchId || input.branch_id || null;
    const roleId = input.roleId || input.role_id || null;
    const jobTitle = input.jobTitle || input.job_title || null;
    const employeeCode = input.employeeCode || input.employee_code || null;
    const hourlyRate = input.hourlyRate ?? input.hourly_rate ?? null;
    const monthlySalary = input.monthlySalary ?? input.monthly_salary ?? null;
    const isActive = input.isActive ?? input.is_active ?? true;
    const canUseAttendanceTerminal =
      input.canUseAttendanceTerminal ?? input.can_use_attendance_terminal ?? true;

    if (input.id) {
      const updateData: Record<string, unknown> = {
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        branchId,
        roleId,
        role: input.role || "employee",
        jobTitle,
        employeeCode,
        hourlyRate: hourlyRate !== null ? String(hourlyRate) : null,
        monthlySalary: monthlySalary !== null ? String(monthlySalary) : null,
        isActive,
        canUseAttendanceTerminal,
        notes: input.notes || null,
        updatedAt: new Date(),
      };

      if (input.password && input.password.trim().length > 0) {
        updateData.password = await bcrypt.hash(input.password.trim(), 10);
      }

      const [updated] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, input.id))
        .returning();

      revalidatePath("/admin/employees");
      return { success: true, data: updated };
    } else {
      const rawPassword = input.password && input.password.trim().length > 0
        ? input.password.trim()
        : "123456";
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const userId = crypto.randomUUID();
      const [created] = await db
        .insert(users)
        .values({
          id: userId,
          name: input.name,
          phone: input.phone,
          email: input.email || null,
          password: hashedPassword,
          role: input.role || "employee",
          branchId,
          roleId,
          jobTitle,
          employeeCode,
          hourlyRate: hourlyRate !== null ? String(hourlyRate) : null,
          monthlySalary: monthlySalary !== null ? String(monthlySalary) : null,
          isActive,
          canUseAttendanceTerminal,
          notes: input.notes || null,
        })
        .returning();

      revalidatePath("/admin/employees");
      return { success: true, data: created };
    }
  } catch (error) {
    console.error("saveEmployeeAction error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save employee";
    return { success: false, error: message };
  }
}

export async function createEmployeeAction(input: SaveEmployeeInput) {
  return saveEmployeeAction(input);
}

export async function updateEmployeeAction(id: string, input: SaveEmployeeInput) {
  return saveEmployeeAction({ ...input, id });
}

export async function deleteEmployeeAction(id: string) {
  try {
    if (!id) return { success: false, error: "Employee ID required" };
    await db.delete(users).where(eq(users.id, id));
    revalidatePath("/admin/employees");
    return { success: true };
  } catch (error) {
    console.error("deleteEmployeeAction error:", error);
    return { success: false, error: "Failed to delete employee" };
  }
}

export async function toggleEmployeeStatusAction(id: string, currentStatus: boolean) {
  try {
    const [updated] = await db
      .update(users)
      .set({ isActive: !currentStatus, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    revalidatePath("/admin/employees");
    return { success: true, data: updated };
  } catch (error) {
    console.error("toggleEmployeeStatusAction error:", error);
    return { success: false, error: "Failed to toggle employee status" };
  }
}
