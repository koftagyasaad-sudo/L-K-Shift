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
  phone: string;
  password?: string;
  role?: string;
  branchId?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  hourlyRate?: number | string | null;
  monthlySalary?: number | string | null;
  isActive?: boolean;
  roleId?: string | null;
};

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

export async function createEmployeeAction(data: EmployeeFormData) {
  try {
    if (!data.name || !data.phone) {
      return { success: false as const, error: "Name and phone are required" };
    }

    const cleanPhone = data.phone.trim();

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.phone, cleanPhone))
      .limit(1);

    if (existing) {
      return { success: false as const, error: "Phone number already exists" };
    }

    const rawPassword = data.password || "123456";
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const newUserId = data.id || nanoid();

    const [createdUser] = await db
      .insert(users)
      .values({
        id: newUserId,
        name: data.name.trim(),
        phone: cleanPhone,
        passwordHash,
        role: data.role || "employee",
        branchId: data.branchId || null,
        department: data.department || null,
        jobTitle: data.jobTitle || null,
        hourlyRate: data.hourlyRate ? String(data.hourlyRate) : null,
        monthlySalary: data.monthlySalary ? String(data.monthlySalary) : null,
        isActive: data.isActive ?? true,
      })
      .returning();

    if (data.roleId) {
      await db.insert(customRoleAssignments).values({
        id: nanoid(),
        userId: newUserId,
        roleId: data.roleId,
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

    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.phone !== undefined) updatePayload.phone = data.phone.trim();
    if (data.role !== undefined) updatePayload.role = data.role;
    if (data.branchId !== undefined) updatePayload.branchId = data.branchId || null;
    if (data.department !== undefined) updatePayload.department = data.department || null;
    if (data.jobTitle !== undefined) updatePayload.jobTitle = data.jobTitle || null;
    if (data.hourlyRate !== undefined)
      updatePayload.hourlyRate = data.hourlyRate ? String(data.hourlyRate) : null;
    if (data.monthlySalary !== undefined)
      updatePayload.monthlySalary = data.monthlySalary ? String(data.monthlySalary) : null;
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

    if (data.roleId !== undefined) {
      await db
        .delete(customRoleAssignments)
        .where(eq(customRoleAssignments.userId, id));

      if (data.roleId) {
        await db.insert(customRoleAssignments).values({
          id: nanoid(),
          userId: id,
          roleId: data.roleId,
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
