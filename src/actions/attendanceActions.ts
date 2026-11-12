"use server";

import { query } from "@/lib/db";
import type { AttendanceRecord, AttendanceRecordInput, AttendanceFilterOptions } from "@/types";
import { canAccessBranch, hasApiPermission, requireApiPrincipal } from "@/lib/api-auth";

type AttendanceQueryRow = {
  id: string;
  employee_id: string;
  branch_id: string | null;
  check_in: string | Date | null;
  check_out: string | Date | null;
  check_in_lat: string | null;
  check_in_lng: string | null;
  check_out_lat: string | null;
  check_out_lng: string | null;
  action_type?: string;
  face_verified?: boolean;
  latitude?: string | number | null;
  longitude?: string | number | null;
  created_at?: string | Date | null;
  employee_name?: string | null;
  employee_code?: string | null;
  branch_name?: string | null;
};

function canReviewAttendance(principal: Awaited<ReturnType<typeof requireApiPrincipal>>): boolean {
  return principal.systemRole === "SUPER_ADMIN"
    || (principal.systemRole !== "EMPLOYEE" && (
      hasApiPermission(principal, "attendance.view")
      || hasApiPermission(principal, "attendance.review")
      || hasApiPermission(principal, "attendance.export")
    ));
}

function asNumber(value: string | number | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function recordAttendanceAction(
  input: AttendanceRecordInput
): Promise<{ success: boolean; log?: AttendanceRecord; data?: AttendanceRecord; error?: string }> {
  const principal = await requireApiPrincipal();
  const targetUserId = String(input.employeeId || input.employee_id || principal.id).trim();
  const branchInput = input.branchId || input.branch_id;
  const branchId = branchInput == null ? null : String(branchInput).trim();
  if (!targetUserId) return { success: false, error: "معرف الموظف غير صالح" };
  if (targetUserId !== principal.id && !hasApiPermission(principal, "attendance.override")) {
    throw new Error("ممنوع تسجيل الحضور لموظف آخر");
  }
  if (branchInput != null && !branchId) return { success: false, error: "معرف الفرع غير صالح" };

  const userResult = await query<{
    id: string;
    primary_branch_id: string | null;
    branch_id: string | null;
  }>(
    `SELECT id::text, primary_branch_id::text, branch_id::text
     FROM users
     WHERE id::text = $1 AND is_active = TRUE
     LIMIT 1`,
    [targetUserId]
  );
  const user = userResult.rows[0];
  if (!user) return { success: false, error: "الموظف غير موجود" };

  const employeeBranchId = user.primary_branch_id ?? user.branch_id;
  const canOverride = hasApiPermission(principal, "attendance.override");
  const effectiveBranchId = branchId ?? employeeBranchId;
  if (!effectiveBranchId) return { success: false, error: "لا يوجد فرع معين للموظف" };
  if (!canOverride && effectiveBranchId !== employeeBranchId) {
    throw new Error("ممنوع تسجيل الحضور في هذا الفرع");
  }
  if (!canAccessBranch(principal, effectiveBranchId)) {
    throw new Error("ممنوع تسجيل الحضور في هذا الفرع");
  }

  const actionType = input.actionType || input.type || "IN";
  if (actionType !== "IN" && actionType !== "OUT") {
    return { success: false, error: "نوع حركة الحضور غير صالح" };
  }
  const latitude = input.lat ?? input.gps_lat ?? null;
  const longitude = input.lng ?? input.gps_lng ?? null;
  const faceVerified = input.faceVerified ?? input.verified_by_face ?? false;

  try {
    let result: { rows: AttendanceQueryRow[] };
    if (actionType === "IN") {
      result = await query<AttendanceQueryRow>(
        `INSERT INTO attendance (
           user_id, branch_id, check_in, check_in_lat, check_in_lng, status, device_info
         )
         VALUES ($1, $2, NOW(), $3, $4, 'present', $5)
         RETURNING id::text, user_id::text AS employee_id, branch_id::text,
                   'IN'::text AS action_type, $6::boolean AS face_verified,
                   NULLIF(check_in_lat, '')::double precision AS latitude,
                   NULLIF(check_in_lng, '')::double precision AS longitude,
                   check_in AS created_at`,
        [
          targetUserId,
          effectiveBranchId,
          latitude == null ? null : String(latitude),
          longitude == null ? null : String(longitude),
          null,
          faceVerified,
        ]
      );
    } else {
      result = await query<AttendanceQueryRow>(
        `WITH open_attendance AS (
           SELECT id
           FROM attendance
           WHERE user_id::text = $1
             AND check_out IS NULL
             AND CASE
               WHEN (check_in AT TIME ZONE 'Africa/Cairo')::time < TIME '06:00'
                 THEN (check_in AT TIME ZONE 'Africa/Cairo')::date - 1
               ELSE (check_in AT TIME ZONE 'Africa/Cairo')::date
             END = (NOW() AT TIME ZONE 'Africa/Cairo')::date
                 - CASE
                   WHEN (NOW() AT TIME ZONE 'Africa/Cairo')::time < TIME '06:00' THEN 1
                   ELSE 0
                 END
           ORDER BY check_in DESC
           LIMIT 1
         )
         UPDATE attendance a
         SET check_out = NOW(), check_out_lat = $2, check_out_lng = $3, updated_at = NOW()
         FROM open_attendance o
         WHERE a.id = o.id
         RETURNING a.id::text, a.user_id::text AS employee_id, a.branch_id::text,
                   'OUT'::text AS action_type, $4::boolean AS face_verified,
                   NULLIF(a.check_out_lat, '')::double precision AS latitude,
                   NULLIF(a.check_out_lng, '')::double precision AS longitude,
                   a.check_out AS created_at`,
        [
          targetUserId,
          latitude == null ? null : String(latitude),
          longitude == null ? null : String(longitude),
          faceVerified,
        ]
      );
      if (!result.rows.length) {
        return { success: false, error: "يجب تسجيل الحضور أولاً قبل تسجيل الانصراف" };
      }
    }

    const row = result.rows[0];
    const log: AttendanceRecord = {
      id: row.id,
      employee_id: row.employee_id,
      action_type: row.action_type || actionType,
      face_verified: row.face_verified ?? faceVerified,
      latitude: asNumber(row.latitude ?? null),
      longitude: asNumber(row.longitude ?? null),
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
    let employeeId: string | undefined;
    let branchId: string | undefined;
    let startDate: string | undefined;
    let endDate: string | undefined;
    if (typeof options === "string") {
      employeeId = options;
    } else if (options) {
      employeeId = options.employeeId;
      branchId = options.branchId;
      startDate = options.startDate;
      endDate = options.endDate;
    }

    const canReview = canReviewAttendance(principal);
    if (!canReview) employeeId = principal.id;
    if (branchId && !canAccessBranch(principal, branchId)) {
      throw new Error("ممنوع الوصول إلى سجلات هذا الفرع");
    }

    const params: Array<string | string[]> = [];
    const filters = ["TRUE"];
    if (employeeId) {
      params.push(employeeId);
      filters.push(`a.user_id::text = $${params.length}::text`);
    }
    if (branchId) {
      params.push(branchId);
      filters.push(`COALESCE(a.branch_id::text, u.primary_branch_id::text, u.branch_id::text, '') = $${params.length}::text`);
    } else if (canReview && principal.systemRole !== "SUPER_ADMIN" && principal.branchScope !== "ALL") {
      const branchIds = principal.branchScope === "CUSTOM"
        ? principal.allowedBranchIds
        : principal.primaryBranchId
          ? [principal.primaryBranchId]
          : [];
      if (branchIds.length) {
        params.push(branchIds);
        filters.push(`COALESCE(a.branch_id::text, u.primary_branch_id::text, u.branch_id::text, '') = ANY($${params.length}::text[])`);
      } else {
        filters.push("FALSE");
      }
    }
    params.push(startDate || "");
    filters.push(`(a.check_in AT TIME ZONE 'Africa/Cairo')::date >= COALESCE(NULLIF($${params.length}, '')::date, (a.check_in AT TIME ZONE 'Africa/Cairo')::date)`);
    params.push(endDate || "");
    filters.push(`(a.check_in AT TIME ZONE 'Africa/Cairo')::date <= COALESCE(NULLIF($${params.length}, '')::date, (a.check_in AT TIME ZONE 'Africa/Cairo')::date)`);

    const result = await query<AttendanceQueryRow>(
      `SELECT a.id::text, a.user_id::text AS employee_id,
              COALESCE(a.branch_id::text, u.primary_branch_id::text, u.branch_id::text) AS branch_id,
              a.check_in, a.check_out, a.check_in_lat, a.check_in_lng,
              a.check_out_lat, a.check_out_lng,
              COALESCE(u.full_name_ar, u.name, u.full_name, '') AS employee_name,
              COALESCE(u.employee_number, u.employee_code, u.id::text) AS employee_code,
              b.name_ar AS branch_name
       FROM attendance a
       LEFT JOIN users u ON a.user_id::text = u.id::text
       LEFT JOIN branches b ON b.id::text = COALESCE(a.branch_id::text, u.primary_branch_id::text, u.branch_id::text, '')
       WHERE ${filters.join(" AND ")}
       ORDER BY a.check_in DESC
       LIMIT 500`,
      params
    );
    const logs = result.rows
      .filter((row) => canAccessBranch(principal, row.branch_id))
      .flatMap((row) => [
        ...(row.check_in ? [{
          id: `${row.id}:IN`,
          employee_id: row.employee_id,
          employee_name: row.employee_name || "",
          employee_code: row.employee_code || "",
          branch_name: row.branch_name || "",
          action_type: "IN",
          face_verified: false,
          latitude: asNumber(row.check_in_lat),
          longitude: asNumber(row.check_in_lng),
          created_at: new Date(row.check_in).toISOString(),
        }] : []),
        ...(row.check_out ? [{
          id: `${row.id}:OUT`,
          employee_id: row.employee_id,
          employee_name: row.employee_name || "",
          employee_code: row.employee_code || "",
          branch_name: row.branch_name || "",
          action_type: "OUT",
          face_verified: false,
          latitude: asNumber(row.check_out_lat),
          longitude: asNumber(row.check_out_lng),
          created_at: new Date(row.check_out).toISOString(),
        }] : []),
      ]);
    return { success: true, logs, data: logs };
  } catch (err) {
    console.error("Error fetching attendance logs:", err);
    return { success: false, error: err instanceof Error ? err.message : "فشل جلب سجلات الحضور" };
  }
}
