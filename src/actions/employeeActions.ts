"use server";

import { hash } from "bcryptjs";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  branches,
  customRoles,
  customRoleAssignments,
} from "@/db/schema";
import type { EmployeeData } from "@/types";

function mapUserToEmployee(row: {
  id: number;
  fullNameAr: string;
  fullNameEn: string | null;
  phone: string;
  employeeNumber: string | null;
  primaryBranchId: number | null;
  jobRole: string;
  monthlySalary: string | null;
  annualLeaveDays: number;
  isActive: boolean;
  createdAt: Date;
  branchName?: string | null;
  roleId?: number | null;
  roleName?: string | null;
}): EmployeeData {
  return {
    id: String(row.id),
    name: row.fullNameAr,
    employee_code: row.employeeNumber || row.phone,
    phone: row.phone,
    branch_id: row.primaryBranchId ? String(row.primaryBranchId) : null,
    role_id: row.roleId ? String(row.roleId) : null,
    base_salary: row.monthlySalary ? Number(row.monthlySalary) : 0,
    monthly_leave_days: row.annualLeaveDays ?? 21,
    status: row.isActive ? "active" : "inactive",
    branch_name: row.branchName || "",
    role_name: row.roleName || row.jobRole || "",
    created_at: row.createdAt ? new Date(row.createdAt).toISOString() : undefined,
  } as EmployeeData;
}

export async function getEmployeesAction(): Promise<{
  success: boolean;
  employees?: EmployeeData[];
  data?: EmployeeData[];
  error?: string;
}> {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    const allBranches = await db.select().from(branches);
    const allRoles = await db.select().from(customRoles);
    const allAssignments = await db.select().from(customRoleAssignments);

    const branchMap = new Map(allBranches.map((b) => [b.id, b.nameAr || b.nameEn]));
    const roleMap = new Map(allRoles.map((r) => [r.id, r.nameAr || r.name]));
    const userRoleMap = new Map<number, number>();
    for (const a of allAssignments) {
      if (!userRoleMap.has(a.userId)) userRoleMap.set(a.userId, a.roleId);
    }

    const employees = allUsers.map((u) => {
      const roleId = userRoleMap.get(u.id) ?? null;
      return mapUserToEmployee({
        ...u,
        branchName: u.primaryBranchId ? branchMap.get(u.primaryBranchId) || null : null,
        roleId,
        roleName: roleId ? roleMap.get(roleId) || null : u.jobRole,
      });
    });

    return { success: true, employees, data: employees };
  } catch (err: any) {
    console.error("Error fetching employees:", err);
    return { success: false, error: err.message || "فشل في جلب بيانات الموظفين" };
  }
}

export async function getEmployeeByIdAction(
  id: string
): Promise<{ success: boolean; employee?: EmployeeData; data?: EmployeeData; error?: string }> {
  try {
    const userId = Number(id);
    if (!userId) return { success: false, error: "معرّف غير صالح" };

    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (rows.length === 0) return { success: false, error: "الموظف غير موجود" };

    const u = rows[0];
    let branchName: string | null = null;
    if (u.primaryBranchId) {
      const b = await db.select().from(branches).where(eq(branches.id, u.primaryBranchId)).limit(1);
      branchName = b[0]?.nameAr || b[0]?.nameEn || null;
    }

    const assignment = await db
      .select()
      .from(customRoleAssignments)
      .where(eq(customRoleAssignments.userId, u.id))
      .limit(1);

    let roleId: number | null = null;
    let roleName: string | null = u.jobRole;
    if (assignment[0]) {
      roleId = assignment[0].roleId;
      const r = await db.select().from(customRoles).where(eq(customRoles.id, roleId)).limit(1);
      roleName = r[0]?.nameAr || r[0]?.name || roleName;
    }

    const employee = mapUserToEmployee({
      ...u,
      branchName,
      roleId,
      roleName,
    });

    return { success: true, employee, data: employee };
  } catch (err: any) {
    console.error("Error fetching employee by id:", err);
    return { success: false, error: err.message || "فشل في جلب الموظف" };
  }
}

export async function createEmployeeAction(
  data: EmployeeData & { phone?: string; password?: string }
): Promise<{ success: boolean; employee?: EmployeeData; data?: EmployeeData; error?: string }> {
  try {
    const name = (data.name || "").trim();
    const phone = (data.phone || data.employee_code || "").trim();
    const employeeCode = (data.employee_code || phone).trim();
    const password = (data.password || "123456").trim();

    if (!name) return { success: false, error: "اسم الموظف مطلوب" };
    if (!phone) return { success: false, error: "رقم التليفون مطلوب (يُستخدم لتسجيل الدخول)" };
    if (password.length < 4) return { success: false, error: "كلمة المرور قصيرة جداً" };

    const existing = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    if (existing.length > 0) {
      return { success: false, error: "رقم التليفون مستخدم بالفعل" };
    }

    const branchId = data.branch_id && String(data.branch_id).trim() !== ""
      ? Number(data.branch_id)
      : null;

    const roleId = data.role_id && String(data.role_id).trim() !== ""
      ? Number(data.role_id)
      : null;

    let jobRole = "موظف";
    if (roleId) {
      const r = await db.select().from(customRoles).where(eq(customRoles.id, roleId)).limit(1);
      if (r[0]) jobRole = r[0].nameAr || r[0].name;
    }

    const passwordHash = await hash(password, 10);

    const [created] = await db
      .insert(users)
      .values({
        fullNameAr: name,
        fullNameEn: null,
        phone,
        employeeNumber: employeeCode,
        passwordHash,
        systemRole: "EMPLOYEE",
        jobRole,
        primaryBranchId: branchId && !Number.isNaN(branchId) ? branchId : null,
        managementRole: "NONE",
        isActive: (data.status || "active") === "active",
        salaryType: "MONTHLY",
        monthlySalary: String(data.base_salary ?? 0),
        annualLeaveDays: Number(data.monthly_leave_days ?? 21),
        workingHoursPerDay: 8,
        workingDaysPerMonth: 26,
        verificationMode: "QR_GPS",
      })
      .returning();

    if (roleId && !Number.isNaN(roleId)) {
      await db.insert(customRoleAssignments).values({
        userId: created.id,
        roleId,
      });
    }

    const employee = mapUserToEmployee({
      ...created,
      branchName: null,
      roleId,
      roleName: jobRole,
    });

    return { success: true, employee, data: employee };
  } catch (err: any) {
    console.error("Error creating employee:", err);
    return { success: false, error: err.message || "فشل في إضافة الموظف" };
  }
}

export async function updateEmployeeAction(
  id: string,
  data: EmployeeData & { phone?: string; password?: string }
): Promise<{ success: boolean; employee?: EmployeeData; data?: EmployeeData; error?: string }> {
  try {
    const userId = Number(id);
    if (!userId) return { success: false, error: "معرّف غير صالح" };

    const name = (data.name || "").trim();
    const phone = (data.phone || data.employee_code || "").trim();
    const employeeCode = (data.employee_code || phone).trim();

    if (!name) return { success: false, error: "اسم الموظف مطلوب" };
    if (!phone) return { success: false, error: "رقم التليفون مطلوب" };

    const current = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (current.length === 0) return { success: false, error: "الموظف غير موجود" };

    const phoneOwner = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    if (phoneOwner.length > 0 && phoneOwner[0].id !== userId) {
      return { success: false, error: "رقم التليفون مستخدم لموظف آخر" };
    }

    const branchId = data.branch_id && String(data.branch_id).trim() !== ""
      ? Number(data.branch_id)
      : null;

    const roleId = data.role_id && String(data.role_id).trim() !== ""
      ? Number(data.role_id)
      : null;

    let jobRole = current[0].jobRole || "موظف";
    if (roleId) {
      const r = await db.select().from(customRoles).where(eq(customRoles.id, roleId)).limit(1);
      if (r[0]) jobRole = r[0].nameAr || r[0].name;
    }

    const patch: Record<string, unknown> = {
      fullNameAr: name,
      phone,
      employeeNumber: employeeCode,
      jobRole,
      primaryBranchId: branchId && !Number.isNaN(branchId) ? branchId : null,
      isActive: (data.status || "active") === "active",
      monthlySalary: String(data.base_salary ?? 0),
      annualLeaveDays: Number(data.monthly_leave_days ?? 21),
      updatedAt: new Date(),
    };

    if (data.password && String(data.password).trim().length >= 4) {
      patch.passwordHash = await hash(String(data.password).trim(), 10);
    }

    const [updated] = await db
      .update(users)
      .set(patch as any)
      .where(eq(users.id, userId))
      .returning();

    // reset role assignment
    await db.delete(customRoleAssignments).where(eq(customRoleAssignments.userId, userId));
    if (roleId && !Number.isNaN(roleId)) {
      await db.insert(customRoleAssignments).values({ userId, roleId });
    }

    const employee = mapUserToEmployee({
      ...updated,
      branchName: null,
      roleId,
      roleName: jobRole,
    });

    return { success: true, employee, data: employee };
  } catch (err: any) {
    console.error("Error updating employee:", err);
    return { success: false, error: err.message || "فشل في تحديث بيانات الموظف" };
  }
}

export async function saveEmployeeAction(
  data: EmployeeData & { phone?: string; password?: string }
): Promise<{ success: boolean; employee?: EmployeeData; data?: EmployeeData; error?: string }> {
  if (data.id) {
    return updateEmployeeAction(String(data.id), data);
  }
  return createEmployeeAction(data);
}

export async function deleteEmployeeAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = Number(id);
    if (!userId) return { success: false, error: "معرّف غير صالح" };

    // clean relations first
    await db.delete(customRoleAssignments).where(eq(customRoleAssignments.userId, userId));

    const deleted = await db.delete(users).where(eq(users.id, userId)).returning();
    if (deleted.length === 0) {
      return { success: false, error: "الموظف غير موجود" };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting employee:", err);
    return {
      success: false,
      error:
        err.message ||
        "فشل في حذف الموظف (قد يكون مرتبط بسجلات حضور — عطّله بدلاً من الحذف)",
    };
  }
}
