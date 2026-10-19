"use server";

import { neon } from "@neondatabase/serverless";
import type { EmployeeData } from "@/types";

export async function getEmployeesAction() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const employees = (await sql`
      SELECT 
        e.id,
        e.name,
        e.employee_code,
        e.branch_id,
        e.role_id,
        e.base_salary,
        e.monthly_leave_days,
        e.status,
        b.name as branch_name,
        r.name as role_name,
        e.created_at
      FROM employees e
      LEFT JOIN branches b ON e.branch_id = b.id
      LEFT JOIN roles r ON e.role_id = r.id
      ORDER BY e.created_at DESC
    `) as EmployeeData[];

    return { success: true, data: employees, employees };
  } catch (error: any) {
    console.error("getEmployeesAction error:", error);
    return { success: false, data: [], employees: [], error: error.message };
  }
}

export async function saveEmployeeAction(data: EmployeeData) {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Normalize empty strings to null for PostgreSQL UUID FKs
    const branchId = data.branch_id && data.branch_id.trim() !== "" ? data.branch_id : null;
    const roleId = data.role_id && data.role_id.trim() !== "" ? data.role_id : null;
    const salary = Number(data.base_salary) || 0;
    const leaveDays = Number(data.monthly_leave_days) ?? 2;
    const status = data.status || "active";

    if (data.id) {
      await sql`
        UPDATE employees
        SET 
          name = ${data.name},
          employee_code = ${data.employee_code},
          branch_id = ${branchId},
          role_id = ${roleId},
          base_salary = ${salary},
          monthly_leave_days = ${leaveDays},
          status = ${status}
        WHERE id = ${data.id}
      `;
    } else {
      await sql`
        INSERT INTO employees (
          name, employee_code, branch_id, role_id, base_salary, monthly_leave_days, status
        ) VALUES (
          ${data.name}, ${data.employee_code}, ${branchId}, ${roleId}, ${salary}, ${leaveDays}, ${status}
        )
      `;
    }

    return { success: true };
  } catch (error: any) {
    console.error("saveEmployeeAction error:", error);
    return { success: false, error: error.message || "فشل حفظ بيانات الموظف" };
  }
}

export async function deleteEmployeeAction(id: string) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM employees WHERE id = ${id}`;
    return { success: true };
  } catch (error: any) {
    console.error("deleteEmployeeAction error:", error);
    return { success: false, error: error.message || "فشل حذف الموظف" };
  }
}
