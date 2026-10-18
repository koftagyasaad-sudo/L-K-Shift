"use server";

import { revalidatePath } from "next/cache";
import { neon } from "@neondatabase/serverless";

export interface EmployeeData {
  id: string;
  name: string;
  code: string;
  branch_id: string;
  role_id: string;
  base_salary: number;
  work_hours: number;
  monthly_leave_days: number; // الحقل الجديد: رصيد الإجازات الشهري
  attendance_status: string;
  createdAt?: string;
  branch_name?: string;
  role_title?: string;
}

const fallbackEmployees: EmployeeData[] = [
  {
    id: "e1",
    name: "سعد الكفتجي",
    code: "EMP-001",
    branch_id: "b1",
    role_id: "r1",
    base_salary: 15000,
    work_hours: 8,
    monthly_leave_days: 2.5,
    attendance_status: "حاضر",
    branch_name: "الفرع الرئيسي - الرياض",
    role_title: "صلاحيات مطلقة (SUPER_ADMIN)",
    createdAt: new Date().toISOString()
  }
];

function getClient() {
  if (!process.env.DATABASE_URL) return null;
  return neon(process.env.DATABASE_URL);
}

export async function getEmployeesAction(): Promise<{ success: boolean; data: EmployeeData[] }> {
  try {
    const sql = getClient();
    if (!sql) return { success: true, data: fallbackEmployees };

    const rows = await sql`
      SELECT 
        e.id, e.name, e.code, e.branch_id, e.role_id, 
        e.base_salary, e.work_hours, e.monthly_leave_days, e.attendance_status, 
        e.created_at as "createdAt",
        b.name as "branch_name",
        r.title as "role_title"
      FROM employees e
      LEFT JOIN branches b ON e.branch_id = b.id
      LEFT JOIN roles r ON e.role_id = r.id
      ORDER BY e.created_at DESC
    `;

    return {
      success: true,
      data: rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        branch_id: r.branch_id || "",
        role_id: r.role_id || "",
        base_salary: Number(r.base_salary) || 0,
        work_hours: Number(r.work_hours) || 8,
        monthly_leave_days: Number(r.monthly_leave_days) || 2,
        attendance_status: r.attendance_status || "حاضر",
        branch_name: r.branch_name || "غير محدد",
        role_title: r.role_title || "مواطن/موظف",
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
      }))
    };
  } catch (error) {
    console.error("Neon getEmployeesAction Error:", error);
    return { success: true, data: fallbackEmployees };
  }
}

export async function saveEmployeeAction(emp: EmployeeData): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getClient();
    if (sql) {
      await sql`
        INSERT INTO employees (id, name, code, branch_id, role_id, base_salary, work_hours, monthly_leave_days, attendance_status)
        VALUES (${emp.id}, ${emp.name}, ${emp.code}, ${emp.branch_id}, ${emp.role_id}, ${emp.base_salary}, ${emp.work_hours}, ${emp.monthly_leave_days}, ${emp.attendance_status})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          code = EXCLUDED.code,
          branch_id = EXCLUDED.branch_id,
          role_id = EXCLUDED.role_id,
          base_salary = EXCLUDED.base_salary,
          work_hours = EXCLUDED.work_hours,
          monthly_leave_days = EXCLUDED.monthly_leave_days,
          attendance_status = EXCLUDED.attendance_status
      `;
    }

    revalidatePath("/[locale]/(app)/admin/employees", "page");
    return { success: true };
  } catch (error: any) {
    console.error("Neon saveEmployeeAction Error:", error);
    return { success: false, error: error?.message || "فشل حفظ الموظف" };
  }
}

export async function deleteEmployeeAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getClient();
    if (sql) {
      await sql`DELETE FROM employees WHERE id = ${id}`;
    }

    revalidatePath("/[locale]/(app)/admin/employees", "page");
    return { success: true };
  } catch (error: any) {
    console.error("Neon deleteEmployeeAction Error:", error);
    return { success: false, error: error?.message || "فشل حذف الموظف" };
  }
}
