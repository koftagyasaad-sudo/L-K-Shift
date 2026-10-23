"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type EmployeeData = {
  id?: string;
  name?: string;
  phone?: string;
  password?: string;
  email?: string | null;
  role?: string;
  branchId?: string | null;
  isActive?: boolean;
  canUseAttendanceTerminal?: boolean;
  [key: string]: any;
};

export async function getEmployeesAction(branchId?: string) {
  try {
    let list;
    if (branchId) {
      list = await db
        .select()
        .from(users)
        .where(eq(users.branchId, branchId))
        .orderBy(desc(users.createdAt));
    } else {
      list = await db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt));
    }

    return {
      success: true,
      data: list,
      employees: list,
    };
  } catch (error: any) {
    console.error("getEmployeesAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch employees",
      data: [],
      employees: [],
    };
  }
}

export async function getEmployeeByIdAction(id: string) {
  try {
    const [employee] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!employee) {
      return {
        success: false,
        error: "Employee not found",
        data: null,
        employee: null,
      };
    }

    return {
      success: true,
      data: employee,
      employee,
    };
  } catch (error: any) {
    console.error("getEmployeeByIdAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch employee",
      data: null,
      employee: null,
    };
  }
}

export async function createEmployeeAction(data: any) {
  try {
    const id = data.id || crypto.randomUUID();
    const userPayload: any = {
      id,
      name: data.name || data.fullNameAr || data.fullNameEn || "موظف",
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
      canUseAttendanceTerminal:
        data.canUseAttendanceTerminal !== undefined
          ? Boolean(data.canUseAttendanceTerminal)
          : true,
      notes: data.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [newUser] = await db
      .insert(users)
      .values(userPayload)
      .returning();

    revalidatePath("/admin");
    return {
      success: true,
      data: newUser,
      employee: newUser,
    };
  } catch (error: any) {
    console.error("createEmployeeAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to create employee",
    };
  }
}

export async function updateEmployeeAction(id: string, data: any) {
  try {
    const updatePayload: any = {
      name: data.name || data.fullNameAr || data.fullNameEn,
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
      canUseAttendanceTerminal:
        data.canUseAttendanceTerminal !== undefined
          ? Boolean(data.canUseAttendanceTerminal)
          : true,
      notes: data.notes || null,
      updatedAt: new Date(),
    };

    const [updatedUser] = await db
      .update(users)
      .set(updatePayload)
      .where(eq(users.id, id))
      .returning();

    revalidatePath("/admin");
    return {
      success: true,
      data: updatedUser,
      employee: updatedUser,
    };
  } catch (error: any) {
    console.error("updateEmployeeAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to update employee",
    };
  }
}

export async function saveEmployeeAction(data: any) {
  if (data.id) {
    return updateEmployeeAction(data.id, data);
  }
  return createEmployeeAction(data);
}

export async function deleteEmployeeAction(id: string) {
  try {
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    revalidatePath("/admin");
    return {
      success: true,
      data: deleted,
      employee: deleted,
    };
  } catch (error: any) {
    console.error("deleteEmployeeAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete employee",
    };
  }
}

export async function toggleEmployeeStatusAction(id: string) {
  try {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Employee not found" };
    }

    const [updated] = await db
      .update(users)
      .set({
        isActive: !existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    revalidatePath("/admin");
    return {
      success: true,
      data: updated,
      employee: updated,
    };
  } catch (error: any) {
    console.error("toggleEmployeeStatusAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to toggle employee status",
    };
  }
}
