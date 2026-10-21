"use server";

import { db } from "@/db";
import { users, branches, customRoles, customRoleAssignments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

export type EmployeeFormData = {
  id?: string;
  name: string;
  phone?: string;
  employee_code?: string; // Alias for backward compatibility
  password?: string;
  role?: string;
  branchId?: string | null;
  branch_id?: string | null; // Alias for backward compatibility
  department?: string | null;
  jobTitle?: string | null;
  hourlyRate?: number | string | null;
  monthlySalary?: number | string | null;
  monthly_salary?: number | string | null; // Alias for backward compatibility
  base_salary?: number | string | null; // Alias for backward compatibility
  isActive?: boolean;
  roleId?: string | null;
  role_id?: string | null; // Alias for backward compatibility
};

function normalizeEmployeeInput(data: EmployeeFormData) {
  const cleanName = (data.name || "").trim();
  const cleanPhone = (data.phone || data.employee_code || "").trim();
  const branchId = data.branchId ?? data.branch_id ?? null;
  const roleId = data.roleId ?? data.role_id ?? null;
  const salaryRaw = data.monthlySalary ?? data.monthly_salary ?? data.base_salary ?? null;
  const monthlySalary = salaryRaw !== null && salaryRaw !== undefined ? String(salaryRaw) : null;
  const hourlyRate = data.hourlyRate !== null && data.hourlyRate !== undefined ? String(data.hourlyRate) : null;

  return {
    cleanName,
    cleanPhone,
    branchId,
    roleId,
    monthlySalary,
    hourlyRate,
  };
}

export async function getEmployeesAction() {
  try {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));

    const allBranches = await db.select().from(branches);
    const allRoles = await db.select().from(customRoles);
    const allAssignments = await db.select().from(customRoleAssignments);

    const branchMap = new Map(
      allBranches.map((b) => [b.id, b.nameAr || b.nameEn])
    );
    const roleMap = new Map(
      allRoles.map((r) => [r.id, r.nameAr || r.nameEn])
    );

    const userRoleMap = new Map<string, string>();
    for (const a of allAssignments) {
      if (!userRoleMap.has(a.userId)) {
        userRoleMap.set(a.userId, a.roleId);
      }
    }

    const formatted = allUsers.map((u) => {
      const assignedRoleId = userRoleMap.get(u.id);
      return {
        ...u,
        phone: u.phone,
        employee_code: u.phone,
        branchName: u.branchId ? branchMap.get(u.branchId) || null : null,
        customRoleId: assignedRoleId || null,
        customRoleName: assignedRoleId ? roleMap.get(assignedRoleId) || null : null,
      };
    });

    return { success: true as const, data: formatted };
  } catch (error) {
    console.error("getEmployeesAction error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch employees",
      data: [],
    };
  }
}

export async function getEmployeeByIdAction(id: string) {
  try {
    if (!id) {
      return { success: false as const, error: "Employee id is required", data: null };
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return { success: false as const, error: "Employee not found", data: null };
    }

    const [assignment] = await db
      .select()
      .from(customRoleAssignments)
      .where(eq(customRoleAssignments.userId, id))
      .limit(1);

    return {
      success: true as const,
      data: {
        ...user,
        phone: user.phone,
        employee_code: user.phone,
        roleId: assignment ? assignment.roleId : null,
        role_id: assignment ? assignment.roleId : null,
        branch_id: user.branchId,
        base_salary: user.monthlySalary,
        monthly_salary: user.monthlySalary,
      },
    };
  } catch (error) {
    console.error("getEmployeeByIdAction error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch employee",
      data: null,
    };
  }
}

export async function createEmployeeAction(data: EmployeeFormData) {
  try {
    const { cleanName, cleanPhone, branchId, roleId, monthlySalary, hourlyRate } =
      normalizeEmployeeInput(data);

    if (!cleanName || !cleanPhone) {
      return { success: false as const, error: "Name and phone (login ID) are required" };
    }

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.phone, cleanPhone))
      .limit(1);

    if (existing) {
      return { success: false as const, error: "Phone number / Employee Code already exists" };
    }

    const rawPassword = data.password || "123456";
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const newUserId = data.id || nanoid();

    const [createdUser] = await db
      .insert(users)
      .values({
        id: newUserId,
        name: cleanName,
        phone: cleanPhone,
        passwordHash,
        role: data.role || "employee",
        branchId,
        department: data.department || null,
        jobTitle: data.jobTitle || null,
        hourlyRate,
        monthlySalary,
        isActive: data.isActive ?? true,
      })
      .returning();

    if (roleId) {
      await db.insert(customRoleAssignments).values({
        id: nanoid(),
        userId: newUserId,
        roleId,
      });
    }

    revalidatePath("/admin/employees");
    return { success: true as const, data: createdUser };
  } catch (error) {
    console.error("createEmployeeAction error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to create employee",
    };
  }
}

export async function updateEmployeeAction(id: string, data: Partial<EmployeeFormData>) {
  try {
    if (!id) {
      return { success: false as const, error: "Employee id is required" };
    }

    const cleanName = data.name ? data.name.trim() : undefined;
    const cleanPhone = data.phone || data.employee_code ? (data.phone || data.employee_code)!.trim() : undefined;
    const branchId = data.branchId !== undefined ? data.branchId : data.branch_id !== undefined ? data.branch_id : undefined;
    const roleId = data.roleId !== undefined ? data.roleId : data.role_id !== undefined ? data.role_id : undefined;
    const salaryRaw = data.monthlySalary !== undefined ? data.monthlySalary : data.monthly_salary !== undefined ? data.monthly_salary : data.base_salary;
    const monthlySalary = salaryRaw !== undefined ? (salaryRaw ? String(salaryRaw) : null) : undefined;

    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (cleanName !== undefined) updatePayload.name = cleanName;
    if (cleanPhone !== undefined) updatePayload.phone = cleanPhone;
    if (data.role !== undefined) updatePayload.role = data.role;
    if (branchId !== undefined) updatePayload.branchId = branchId || null;
    if (data.department !== undefined) updatePayload.department = data.department || null;
    if (data.jobTitle !== undefined) updatePayload.jobTitle = data.jobTitle || null;
    if (data.hourlyRate !== undefined)
      updatePayload.hourlyRate = data.hourlyRate ? String(data.hourlyRate) : null;
    if (monthlySalary !== undefined) updatePayload.monthlySalary = monthlySalary;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

    if (data.password && data.password.trim().length > 0) {
      updatePayload.passwordHash = await bcrypt.hash(data.password.trim(), 10);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updatePayload)
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      return { success: false as const, error: "Employee not found" };
    }

    if (roleId !== undefined) {
      await db
        .delete(customRoleAssignments)
        .where(eq(customRoleAssignments.userId, id));

      if (roleId) {
        await db.insert(customRoleAssignments).values({
          id: nanoid(),
          userId: id,
          roleId,
        });
      }
    }

    revalidatePath("/admin/employees");
    return { success: true as const, data: updatedUser };
  } catch (error) {
    console.error("updateEmployeeAction error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update employee",
    };
  }
}

export async function saveEmployeeAction(data: EmployeeFormData) {
  if (data.id) {
    return updateEmployeeAction(data.id, data);
  }
  return createEmployeeAction(data);
}

export async function deleteEmployeeAction(id: string) {
  try {
    if (!id) {
      return { success: false as const, error: "Employee id is required" };
    }

    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!deleted) {
      return { success: false as const, error: "Employee not found" };
    }

    revalidatePath("/admin/employees");
    return { success: true as const, data: deleted };
  } catch (error) {
    console.error("deleteEmployeeAction error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete employee",
    };
  }
}

export async function toggleEmployeeStatusAction(id: string, isActive: boolean) {
  try {
    const [updated] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: "Employee not found" };
    }

    revalidatePath("/admin/employees");
    return { success: true as const, data: updated };
  } catch (error) {
    console.error("toggleEmployeeStatusAction error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to toggle status",
    };
  }
}
