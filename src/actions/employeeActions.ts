"use server";

import { query } from "@/lib/db";
import type { EmployeeData } from "@/types";

export async function getEmployeesAction(): Promise<{
  success: boolean;
  employees?: EmployeeData[];
  data?: EmployeeData[];
  error?: string;
}> {
  try {
    const result = await query(
      `SELECT e.id, e.name, e.employee_code, e.branch_id, e.role_id, e.base_salary, e.monthly_leave_days, e.status, e.created_at,
              b.name as branch_name, r.name as role_name
       FROM employees e
       LEFT JOIN branches b ON e.branch_id = b.id
       LEFT JOIN roles r ON e.role_id = r.id
       ORDER BY e.created_at DESC`
    );

    const employees: EmployeeData[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      employee_code: row.employee_code,
      branch_id: row.branch_id || null,
      role_id: row.role_id || null,
      base_salary: row.base_salary ? Number(row.base_salary) : 0,
      monthly_leave_days: row.monthly_leave_days ? Number(row.monthly_leave_days) : 21,
      status: row.status || "active",
      branch_name: row.branch_name || "",
      role_name: row.role_name || "",
      created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    }));

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
    const result = await query(
      `SELECT e.id, e.name, e.employee_code, e.branch_id, e.role_id, e.base_salary, e.monthly_leave_days, e.status, e.created_at,
              b.name as branch_name, r.name as role_name
       FROM employees e
       LEFT JOIN branches b ON e.branch_id = b.id
       LEFT JOIN roles r ON e.role_id = r.id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return { success: false, error: "الموظف غير موجود" };
    }

    const row = result.rows[0];
    const employee: EmployeeData = {
      id: row.id,
      name: row.name,
      employee_code: row.employee_code,
      branch_id: row.branch_id || null,
      role_id: row.role_id || null,
      base_salary: row.base_salary ? Number(row.base_salary) : 0,
      monthly_leave_days: row.monthly_leave_days ? Number(row.monthly_leave_days) : 21,
      status: row.status || "active",
      branch_name: row.branch_name || "",
      role_name: row.role_name || "",
      created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };

    return { success: true, employee, data: employee };
  } catch (err: any) {
    console.error("Error fetching employee by id:", err);
    return { success: false, error: err.message || "فشل في جلب الموظف" };
  }
}

export async function createEmployeeAction(
  data: EmployeeData
): Promise<{ success: boolean; employee?: EmployeeData; data?: EmployeeData; error?: string }> {
  try {
    const { name, employee_code, branch_id, role_id, base_salary, monthly_leave_days, status } = data;

    if (!name || name.trim() === "") {
      return { success: false, error: "اسم الموظف مطلوب" };
    }
    if (!employee_code || employee_code.trim() === "") {
      return { success: false, error: "كود الموظف مطلوب" };
    }

    const cleanBranchId = branch_id && branch_id.trim() !== "" ? branch_id : null;
    const cleanRoleId = role_id && role_id.trim() !== "" ? role_id : null;

    const result = await query(
      `INSERT INTO employees (name, employee_code, branch_id, role_id, base_salary, monthly_leave_days, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, employee_code, branch_id, role_id, base_salary, monthly_leave_days, status, created_at`,
      [
        name,
        employee_code,
        cleanBranchId,
        cleanRoleId,
        base_salary || 0,
        monthly_leave_days || 21,
        status || "active",
      ]
    );

    const row = result.rows[0];
    const employee: EmployeeData = {
      id: row.id,
      name: row.name,
      employee_code: row.employee_code,
      branch_id: row.branch_id || null,
      role_id: row.role_id || null,
      base_salary: row.base_salary ? Number(row.base_salary) : 0,
      monthly_leave_days: row.monthly_leave_days ? Number(row.monthly_leave_days) : 21,
      status: row.status || "active",
      created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };

    return { success: true, employee, data: employee };
  } catch (err: any) {
    console.error("Error creating employee:", err);
    return { success: false, error: err.message || "فشل في إضافة الموظف" };
  }
}

export async function updateEmployeeAction(
  id: string,
  data: EmployeeData
): Promise<{ success: boolean; employee?: EmployeeData; data?: EmployeeData; error?: string }> {
  try {
    const { name, employee_code, branch_id, role_id, base_salary, monthly_leave_days, status } = data;

    if (!name || name.trim() === "") {
      return { success: false, error: "اسم الموظف مطلوب" };
    }

    const cleanBranchId = branch_id && branch_id.trim() !== "" ? branch_id : null;
    const cleanRoleId = role_id && role_id.trim() !== "" ? role_id : null;

    const result = await query(
      `UPDATE employees
       SET name = $1, employee_code = $2, branch_id = $3, role_id = $4, base_salary = $5, monthly_leave_days = $6, status = $7
       WHERE id = $8
       RETURNING id, name, employee_code, branch_id, role_id, base_salary, monthly_leave_days, status, created_at`,
      [
        name,
        employee_code,
        cleanBranchId,
        cleanRoleId,
        base_salary || 0,
        monthly_leave_days || 21,
        status || "active",
        id,
      ]
    );

    if (result.rows.length === 0) {
      return { success: false, error: "الموظف غير موجود" };
    }

    const row = result.rows[0];
    const employee: EmployeeData = {
      id: row.id,
      name: row.name,
      employee_code: row.employee_code,
      branch_id: row.branch_id || null,
      role_id: row.role_id || null,
      base_salary: row.base_salary ? Number(row.base_salary) : 0,
      monthly_leave_days: row.monthly_leave_days ? Number(row.monthly_leave_days) : 21,
      status: row.status || "active",
      created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };

    return { success: true, employee, data: employee };
  } catch (err: any) {
    console.error("Error updating employee:", err);
    return { success: false, error: err.message || "فشل في تحديث بيانات الموظف" };
  }
}

export async function saveEmployeeAction(
  data: EmployeeData
): Promise<{ success: boolean; employee?: EmployeeData; data?: EmployeeData; error?: string }> {
  if (data.id) {
    return updateEmployeeAction(data.id, data);
  }
  return createEmployeeAction(data);
}

export async function deleteEmployeeAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await query("DELETE FROM employees WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return { success: false, error: "الموظف غير موجود" };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting employee:", err);
    return { success: false, error: err.message || "فشل في حذف الموظف" };
  }
}
