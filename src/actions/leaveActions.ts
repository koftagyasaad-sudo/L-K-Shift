"use server";

import { query } from "@/lib/db";
import { canAccessBranch, hasApiPermission, requireApiPrincipal } from "@/lib/api-auth";
import type { LeaveRequestData } from "@/types";

type LeaveQueryRow = {
  id: string | number;
  employee_id: string;
  employee_name: string | null;
  recipient: string | null;
  leave_type: string | null;
  start_date: string | Date | null;
  end_date: string | Date | null;
  reason: string | null;
  status: string | null;
  created_at: string | Date | null;
};

function formatDate(value: string | Date | null): string {
  if (!value) return "";
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

function toLeave(row: LeaveQueryRow): LeaveRequestData {
  return {
    id: String(row.id),
    employee_id: row.employee_id,
    employee_name: row.employee_name || "",
    recipient: row.recipient || "",
    leave_type: row.leave_type || "annual",
    start_date: formatDate(row.start_date),
    end_date: formatDate(row.end_date),
    reason: row.reason || "",
    status: row.status || "PENDING",
    created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}

function canReviewRequests(principal: Awaited<ReturnType<typeof requireApiPrincipal>>): boolean {
  return principal.systemRole === "SUPER_ADMIN"
    || (principal.systemRole !== "EMPLOYEE" && (
      hasApiPermission(principal, "leaves.view")
      || hasApiPermission(principal, "leaves.approve")
      || hasApiPermission(principal, "staff_requests.manage")
    ));
}

export async function getLeaveRequestsAction(): Promise<{
  success: boolean;
  leaves?: LeaveRequestData[];
  data?: LeaveRequestData[];
  error?: string;
}> {
  try {
    const principal = await requireApiPrincipal();
    const canReview = canReviewRequests(principal);
    const params: Array<string | string[]> = [];
    const filters = ["TRUE"];
    if (!canReview) {
      params.push(principal.id);
      filters.push(`lr.user_id::text = $${params.length}::text`);
    } else if (principal.systemRole !== "SUPER_ADMIN" && principal.branchScope !== "ALL") {
      const branchIds = principal.branchScope === "CUSTOM"
        ? principal.allowedBranchIds
        : principal.primaryBranchId
          ? [principal.primaryBranchId]
          : [];
      if (branchIds.length) {
        params.push(branchIds);
        filters.push(`COALESCE(u.primary_branch_id::text, u.branch_id::text, '') = ANY($${params.length}::text[])`);
      } else {
        filters.push("FALSE");
      }
    }

    const result = await query<LeaveQueryRow>(
      `SELECT lr.id, lr.user_id::text AS employee_id,
              COALESCE(u.full_name_ar, u.name, u.full_name, '') AS employee_name,
              COALESCE(lr.target_role, b.name_ar, '') AS recipient,
              COALESCE(lr.request_type, lr.leave_type, 'annual') AS leave_type,
              lr.start_date, lr.end_date, lr.reason, lr.status, lr.created_at
       FROM leave_requests lr
       LEFT JOIN users u ON lr.user_id::text = u.id::text
       LEFT JOIN branches b ON b.id::text = COALESCE(u.primary_branch_id::text, u.branch_id::text, '')
       WHERE ${filters.join(" AND ")}
       ORDER BY lr.created_at DESC
       LIMIT 500`,
      params
    );
    const leaves = result.rows.map(toLeave);
    return { success: true, leaves, data: leaves };
  } catch (err) {
    console.error("Error fetching leave requests:", err);
    return { success: false, error: err instanceof Error ? err.message : "فشل جلب طلبات الإجازة" };
  }
}

export async function createLeaveRequestAction(
  data: LeaveRequestData
): Promise<{ success: boolean; leave?: LeaveRequestData; data?: LeaveRequestData; error?: string }> {
  try {
    const principal = await requireApiPrincipal();
    if (!data.start_date?.trim() || !data.end_date?.trim()) {
      return { success: false, error: "تاريخ بداية ونهاية الإجازة مطلوبان" };
    }
    const result = await query<LeaveQueryRow>(
      `INSERT INTO leave_requests (
         user_id, target_role, leave_type, request_type, start_date, end_date,
         total_days, duration_days, reason, status
       )
       VALUES (
         $1::text, NULLIF($2, ''), $3, $3,
         NULLIF($4, '')::date, NULLIF($5, '')::date,
         GREATEST(1, NULLIF($5, '')::date - NULLIF($4, '')::date + 1),
         GREATEST(1, NULLIF($5, '')::date - NULLIF($4, '')::date + 1),
         NULLIF($6, ''), 'PENDING'
       )
       RETURNING id, user_id::text AS employee_id, NULL::text AS employee_name,
                 target_role AS recipient, COALESCE(request_type, leave_type) AS leave_type,
                 start_date, end_date, reason, status, created_at`,
      [
        principal.id,
        data.recipient || "",
        data.leave_type || "LEAVE",
        data.start_date,
        data.end_date,
        data.reason || "",
      ]
    );
    const leave = toLeave(result.rows[0]);
    return { success: true, leave, data: leave };
  } catch (err) {
    console.error("Error creating leave request:", err);
    return { success: false, error: err instanceof Error ? err.message : "فشل تقديم طلب الإجازة" };
  }
}

export async function updateLeaveStatusAction(
  id: string,
  status: string
): Promise<{ success: boolean; leave?: LeaveRequestData; data?: LeaveRequestData; error?: string }> {
  try {
    const principal = await requireApiPrincipal();
    if (
      (status !== "APPROVED" && status !== "REJECTED")
      || (!hasApiPermission(principal, "leaves.approve")
        && !hasApiPermission(principal, "staff_requests.manage"))
    ) {
      return { success: false, error: "غير مصرح بتحديث حالة الطلب" };
    }
    const request = await query<{ branch_id: string | null }>(
      `SELECT COALESCE(u.primary_branch_id::text, u.branch_id::text) AS branch_id
       FROM leave_requests lr
       LEFT JOIN users u ON lr.user_id::text = u.id::text
       WHERE lr.id::text = $1
       LIMIT 1`,
      [id]
    );
    if (!request.rows.length) return { success: false, error: "طلب الإجازة غير موجود" };
    if (!canAccessBranch(principal, request.rows[0].branch_id)) {
      return { success: false, error: "ممنوع الوصول إلى طلب هذا الفرع" };
    }

    const result = await query<LeaveQueryRow>(
      `UPDATE leave_requests lr
       SET status = $1
       FROM users u
       WHERE lr.id::text = $2
         AND lr.user_id::text = u.id::text
       RETURNING lr.id, lr.user_id::text AS employee_id,
                 COALESCE(u.full_name_ar, u.name, u.full_name, '') AS employee_name,
                 COALESCE(lr.target_role, '') AS recipient,
                 COALESCE(lr.request_type, lr.leave_type, 'annual') AS leave_type,
                 lr.start_date, lr.end_date, lr.reason, lr.status, lr.created_at`,
      [status, id]
    );
    if (!result.rows.length) return { success: false, error: "طلب الإجازة غير موجود" };
    const leave = toLeave(result.rows[0]);
    return { success: true, leave, data: leave };
  } catch (err) {
    console.error("Error updating leave status:", err);
    return { success: false, error: err instanceof Error ? err.message : "فشل تحديث حالة الإجازة" };
  }
}
