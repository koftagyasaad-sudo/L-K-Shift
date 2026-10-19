"use server";

import { neon } from "@neondatabase/serverless";

export interface AttendanceRecordInput {
  employeeId?: string;
  branchId?: string;
  lat?: number;
  lng?: number;
  faceVerified?: boolean;
  actionType?: "IN" | "OUT";

  // مرونة لقبول التسميات بنمط snake_case
  employee_id?: string;
  branch_id?: string;
  type?: string;
  verified_by_face?: boolean;
  gps_lat?: number;
  gps_lng?: number;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_code?: string;
  branch_name?: string;
  action_type: string;
  face_verified: boolean;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
}

export async function recordAttendanceAction(input: AttendanceRecordInput) {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    const empId = input.employeeId || input.employee_id || "";
    const rawType = input.actionType || input.type || "IN";
    const type =
      rawType.toUpperCase() === "CHECK_IN" || rawType.toUpperCase() === "IN"
        ? "IN"
        : "OUT";
    const faceVerified = input.faceVerified ?? input.verified_by_face ?? true;
    const lat = input.lat ?? input.gps_lat ?? null;
    const lng = input.lng ?? input.gps_lng ?? null;

    if (!empId) {
      return { success: false, error: "معرّف الموظف مطلوب" };
    }

    // التحقق من وجود الموظف في النظام
    const emp = await sql`SELECT id, branch_id FROM employees WHERE id = ${empId} LIMIT 1`;
    if (!emp || emp.length === 0) {
      return { success: false, error: "الموظف غير موجود في النظام" };
    }

    const branchId = input.branchId || input.branch_id || emp[0].branch_id || null;

    await sql`
      INSERT INTO attendance_logs (
        employee_id, branch_id, action_type, face_verified, latitude, longitude, created_at
      ) VALUES (
        ${empId}, ${branchId}, ${type}, ${faceVerified}, ${lat}, ${lng}, NOW()
      )
    `;

    return { success: true };
  } catch (error: any) {
    console.error("recordAttendanceAction error:", error);
    return {
      success: false,
      error: error.message || "حدث خطأ أثناء تسجيل البصمة",
    };
  }
}

export async function getAttendanceLogsAction(filters?: {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  branchId?: string;
}) {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    if (!filters?.employeeId && !filters?.branchId && !filters?.startDate && !filters?.endDate) {
      const logs = (await sql`
        SELECT 
          a.id,
          a.employee_id,
          e.name as employee_name,
          e.employee_code,
          b.name as branch_name,
          a.action_type,
          a.face_verified,
          a.latitude,
          a.longitude,
          a.created_at
        FROM attendance_logs a
        LEFT JOIN employees e ON a.employee_id = e.id
        LEFT JOIN branches b ON a.branch_id = b.id
        ORDER BY a.created_at DESC
        LIMIT 200
      `) as AttendanceRecord[];
      return { success: true, logs };
    }

    let baseQuery = `
      SELECT 
        a.id,
        a.employee_id,
        e.name as employee_name,
        e.employee_code,
        b.name as branch_name,
        a.action_type,
        a.face_verified,
        a.latitude,
        a.longitude,
        a.created_at
      FROM attendance_logs a
      LEFT JOIN employees e ON a.employee_id = e.id
      LEFT JOIN branches b ON a.branch_id = b.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let idx = 1;

    if (filters.employeeId) {
      baseQuery += ` AND a.employee_id = $${idx++}`;
      params.push(filters.employeeId);
    }
    if (filters.branchId) {
      baseQuery += ` AND a.branch_id = $${idx++}`;
      params.push(filters.branchId);
    }
    if (filters.startDate) {
      baseQuery += ` AND a.created_at >= $${idx++}`;
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      baseQuery += ` AND a.created_at <= $${idx++}`;
      params.push(filters.endDate);
    }

    baseQuery += ` ORDER BY a.created_at DESC LIMIT 200`;

    const logs = (await sql(baseQuery, params)) as AttendanceRecord[];
    return { success: true, logs };
  } catch (error: any) {
    console.error("getAttendanceLogsAction error:", error);
    return { success: false, logs: [], error: error.message };
  }
}
