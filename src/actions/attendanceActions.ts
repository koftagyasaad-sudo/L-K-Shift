"use server";

import { query } from "@/lib/db";
import type { AttendanceRecordInput, AttendanceRecord, AttendanceFilterOptions } from "@/types";

export async function recordAttendanceAction(
  input: AttendanceRecordInput
): Promise<{ success: boolean; log?: AttendanceRecord; error?: string }> {
  try {
    const empId = input.employeeId || input.employee_id;
    const branchId = input.branchId || input.branch_id;
    const actionType = input.actionType || input.type || "IN";
    const faceVerified = input.faceVerified ?? input.verified_by_face ?? false;
    const lat = input.lat ?? input.gps_lat ?? null;
    const lng = input.lng ?? input.gps_lng ?? null;

    if (!empId) {
      return { success: false, error: "معرف الموظف مطلوب" };
    }

    const result = await query(
      `INSERT INTO attendance_logs (employee_id, branch_id, action_type, face_verified, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, employee_id, branch_id, action_type, face_verified, latitude, longitude, created_at`,
      [empId, branchId || null, actionType, faceVerified, lat, lng]
    );

    const row = result.rows[0];
    const log: AttendanceRecord = {
      id: row.id,
      employee_id: row.employee_id,
      action_type: row.action_type,
      face_verified: Boolean(row.face_verified),
      latitude: row.latitude ? Number(row.latitude) : null,
      longitude: row.longitude ? Number(row.longitude) : null,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    };

    return { success: true, log };
  } catch (err: any) {
    console.error("Error recording attendance:", err);
    return { success: false, error: err.message || "فشل تسجيل الحركة" };
  }
}

export async function getAttendanceLogsAction(
  options?: AttendanceFilterOptions
): Promise<{ success: boolean; logs?: AttendanceRecord[]; error?: string }> {
  try {
    let empId: string | undefined;
    let branchId: string | undefined;
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (typeof options === "string") {
      empId = options;
    } else if (options && typeof options === "object") {
      empId = options.employeeId;
      branchId = options.branchId;
      startDate = options.startDate;
      endDate = options.endDate;
    }

    let sql = `
      SELECT a.id, a.employee_id, a.action_type, a.face_verified, a.latitude, a.longitude, a.created_at,
             e.name as employee_name, e.employee_code, b.name as branch_name
      FROM attendance_logs a
      LEFT JOIN employees e ON a.employee_id = e.id
      LEFT JOIN branches b ON a.branch_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (empId) {
      params.push(empId);
      sql += ` AND a.employee_id = $${params.length}`;
    }

    if (branchId) {
      params.push(branchId);
      sql += ` AND a.branch_id = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      sql += ` AND a.created_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      sql += ` AND a.created_at <= $${params.length}`;
    }

    sql += ` ORDER BY a.created_at DESC LIMIT 100`;

    const result = await query(sql, params);

    const logs: AttendanceRecord[] = result.rows.map((row) => ({
      id: row.id,
      employee_id: row.employee_id,
      employee_name: row.employee_name || "",
      employee_code: row.employee_code || "",
      branch_name: row.branch_name || "",
      action_type: row.action_type,
      face_verified: Boolean(row.face_verified),
      latitude: row.latitude ? Number(row.latitude) : null,
      longitude: row.longitude ? Number(row.longitude) : null,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : "",
    }));

    return { success: true, logs };
  } catch (err: any) {
    console.error("Error fetching attendance logs:", err);
    return { success: false, error: err.message || "فشل جلب سجلات الحضور" };
  }
}
