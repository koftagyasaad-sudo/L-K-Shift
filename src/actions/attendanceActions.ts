"use server";

import { query } from "@/lib/db";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { AttendanceRecordInput, AttendanceRecord, AttendanceFilterOptions } from "@/types";
import { canAccessBranch, hasApiPermission, requireApiPrincipal } from "@/lib/api-auth";

export async function recordAttendanceAction(
  input: AttendanceRecordInput
): Promise<{ success: boolean; log?: AttendanceRecord; data?: AttendanceRecord; error?: string }> {
  const principal = await requireApiPrincipal();
  const empId = input.employeeId || input.employee_id;
  const branchId = input.branchId || input.branch_id;
  const targetUserId = Number(empId);
  if (!Number.isSafeInteger(targetUserId) || targetUserId < 1) {
    return { success: false, error: "معرف الموظف غير صالح" };
  }
  if (targetUserId !== principal.id && !hasApiPermission(principal, "attendance.override")) {
    throw new Error("ممنوع تسجيل الحضور لموظف آخر");
  }
  if (branchId !== undefined && branchId !== null) {
    const parsedBranchId = Number(branchId);
    if (!Number.isSafeInteger(parsedBranchId) || parsedBranchId < 1) {
      return { success: false, error: "معرف الفرع غير صالح" };
    }
  }
  const [targetUser] = await db
    .select({ primaryBranchId: users.primaryBranchId })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);
  if (!targetUser) throw new Error("الموظف غير موجود");

  const canOverride = hasApiPermission(principal, "attendance.override");
  if (!canOverride && branchId && Number(branchId) !== targetUser.primaryBranchId) {
    throw new Error("ممنوع تسجيل الحضور في هذا الفرع");
  }
  const effectiveBranchId = branchId
    ? String(branchId)
    : targetUser.primaryBranchId
      ? String(targetUser.primaryBranchId)
      : undefined;
  if (effectiveBranchId && !canAccessBranch(principal, Number(effectiveBranchId))) {
    throw new Error("ممنوع تسجيل الحضور في هذا الفرع");
  }
  try {
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
      [empId, effectiveBranchId || null, actionType, faceVerified, lat, lng]
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

    return { success: true, log, data: log };
  } catch (err: any) {
    console.error("Error recording attendance:", err);
    return { success: false, error: err.message || "فشل تسجيل الحركة" };
  }
}

export async function getAttendanceLogsAction(
  options?: AttendanceFilterOptions
): Promise<{ success: boolean; logs?: AttendanceRecord[]; data?: AttendanceRecord[]; error?: string }> {
  const principal = await requireApiPrincipal();
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
    if (
      !hasApiPermission(principal, "attendance.view") &&
      !hasApiPermission(principal, "attendance.review") &&
      !hasApiPermission(principal, "attendance.export")
    ) {
      empId = String(principal.id);
    }
    if (branchId && !canAccessBranch(principal, Number(branchId))) {
      throw new Error("ممنوع الوصول إلى سجلات هذا الفرع");
    }

    let sql = `
      SELECT a.id, a.employee_id, a.branch_id, a.action_type, a.face_verified, a.latitude, a.longitude, a.created_at,
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

    const logs: AttendanceRecord[] = result.rows
      .filter((row) => canAccessBranch(principal, row.branch_id == null ? null : Number(row.branch_id)))
      .map((row) => ({
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

    return { success: true, logs, data: logs };
  } catch (err: any) {
    console.error("Error fetching attendance logs:", err);
    return { success: false, error: err.message || "فشل جلب سجلات الحضور" };
  }
}
