"use server";

import { query } from "@/lib/db";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { AttendanceRecordInput, AttendanceRecord, AttendanceFilterOptions } from "@/types";
import { canAccessBranch, hasApiPermission, requireApiPrincipal } from "@/lib/api-auth";

type AttendanceQueryRow = Record<string, unknown> & {
  id: string | number;
  employee_id: string;
  branch_id: string | null;
  action_type: string;
  face_verified: boolean | null;
  latitude: number | string | null;
  longitude: number | string | null;
  created_at: string | Date | null;
  employee_name?: string | null;
  employee_code?: string | null;
  branch_name?: string | null;
};

export async function recordAttendanceAction(
  input: AttendanceRecordInput
): Promise<{ success: boolean; log?: AttendanceRecord; data?: AttendanceRecord; error?: string }> {
  const principal = await requireApiPrincipal();
  const empId = input.employeeId || input.employee_id;
  const branchId = input.branchId || input.branch_id;
  const targetUserId = empId == null ? "" : String(empId).trim();
  if (!targetUserId) {
    return { success: false, error: "معرف الموظف غير صالح" };
  }
  if (targetUserId !== principal.id && !hasApiPermission(principal, "attendance.override")) {
    throw new Error("ممنوع تسجيل الحضور لموظف آخر");
  }
  const parsedBranchId = branchId == null ? null : String(branchId).trim();
  if (branchId != null && !parsedBranchId) return { success: false, error: "معرف الفرع غير صالح" };
  const [targetUser] = await db
    .select({ primaryBranchId: users.primaryBranchId })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);
  if (!targetUser) throw new Error("الموظف غير موجود");

  const canOverride = hasApiPermission(principal, "attendance.override");
  if (!canOverride && parsedBranchId && parsedBranchId !== targetUser.primaryBranchId) {
    throw new Error("ممنوع تسجيل الحضور في هذا الفرع");
  }
  const effectiveBranchId = parsedBranchId
    ? parsedBranchId
    : targetUser.primaryBranchId
    ? targetUser.primaryBranchId
      : undefined;
  if (effectiveBranchId && !canAccessBranch(principal, effectiveBranchId)) {
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

    const result = await query<AttendanceQueryRow>(
      `INSERT INTO attendance_logs (employee_id, branch_id, action_type, face_verified, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, employee_id, branch_id, action_type, face_verified, latitude, longitude, created_at`,
      [empId, effectiveBranchId || null, actionType, faceVerified, lat, lng]
    );

    const row = result.rows[0];
    const log: AttendanceRecord = {
      id: String(row.id),
      employee_id: row.employee_id,
      action_type: row.action_type,
      face_verified: Boolean(row.face_verified),
      latitude: row.latitude ? Number(row.latitude) : null,
      longitude: row.longitude ? Number(row.longitude) : null,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    };

    return { success: true, log, data: log };
  } catch (err) {
    console.error("Error recording attendance:", err);
    return { success: false, error: err instanceof Error ? err.message : "فشل تسجيل الحركة" };
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
    if (branchId && !canAccessBranch(principal, branchId)) {
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
    const params: Array<string | number | boolean | null | string[]> = [];
    const canViewAll = hasApiPermission(principal, "attendance.view")
      || hasApiPermission(principal, "attendance.review")
      || hasApiPermission(principal, "attendance.export");

    if (!canViewAll) {
      empId = principal.id;
    }
    if (empId) {
      params.push(empId);
      sql += ` AND a.employee_id = $${params.length}`;
    }

    if (branchId) {
      params.push(branchId);
      sql += ` AND a.branch_id = $${params.length}`;
    } else if (canViewAll && principal.systemRole !== "SUPER_ADMIN" && principal.branchScope !== "ALL") {
      const branchIds = principal.branchScope === "CUSTOM"
        ? principal.allowedBranchIds
        : principal.primaryBranchId
          ? [principal.primaryBranchId]
          : [];
      if (branchIds.length) {
        params.push(branchIds);
        sql += ` AND COALESCE(a.branch_id::text, e.branch_id::text) = ANY($${params.length}::text[])`;
      } else {
        sql += " AND FALSE";
      }
    }

    params.push(startDate || "");
    sql += ` AND a.created_at::date >= COALESCE(NULLIF($${params.length}, '')::date, a.created_at::date)`;
    params.push(endDate || "");
    sql += ` AND a.created_at::date <= COALESCE(NULLIF($${params.length}, '')::date, a.created_at::date)`;

    sql += ` ORDER BY a.created_at DESC LIMIT 100`;

    const result = await query<AttendanceQueryRow>(sql, params);

    const logs: AttendanceRecord[] = result.rows
      .filter((row) => canAccessBranch(principal, row.branch_id == null ? null : String(row.branch_id)))
      .map((row) => ({
      id: String(row.id),
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
  } catch (err) {
    console.error("Error fetching attendance logs:", err);
    return { success: false, error: err instanceof Error ? err.message : "فشل جلب سجلات الحضور" };
  }
}
