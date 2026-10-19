"use server";

import { query } from "@/lib/db";
import type { LeaveRequestData } from "@/types";

export async function getLeaveRequestsAction(): Promise<{
  success: boolean;
  leaves?: LeaveRequestData[];
  error?: string;
}> {
  try {
    const result = await query(
      `SELECT l.id, l.employee_id, l.recipient, l.leave_type, l.start_date, l.end_date, l.reason, l.status, l.created_at,
              e.name as employee_name
       FROM leave_requests l
       LEFT JOIN employees e ON l.employee_id = e.id
       ORDER BY l.created_at DESC`
    );

    const leaves: LeaveRequestData[] = result.rows.map((row) => ({
      id: row.id,
      employee_id: row.employee_id,
      employee_name: row.employee_name || "",
      recipient: row.recipient || "",
      leave_type: row.leave_type || "annual",
      start_date: row.start_date ? new Date(row.start_date).toISOString().split("T")[0] : "",
      end_date: row.end_date ? new Date(row.end_date).toISOString().split("T")[0] : "",
      reason: row.reason || "",
      status: row.status || "pending",
      created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    }));

    return { success: true, leaves };
  } catch (err: any) {
    console.error("Error fetching leave requests:", err);
    return { success: false, error: err.message || "فشل جلب طلبات الإجازة" };
  }
}

export async function createLeaveRequestAction(
  data: LeaveRequestData
): Promise<{ success: boolean; leave?: LeaveRequestData; error?: string }> {
  try {
    const { employee_id, recipient, leave_type, start_date, end_date, reason } = data;

    if (!employee_id) {
      return { success: false, error: "معرف الموظف مطلوب" };
    }

    const result = await query(
      `INSERT INTO leave_requests (employee_id, recipient, leave_type, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, employee_id, recipient, leave_type, start_date, end_date, reason, status, created_at`,
      [employee_id, recipient || "", leave_type || "annual", start_date, end_date, reason || ""]
    );

    const row = result.rows[0];
    const leave: LeaveRequestData = {
      id: row.id,
      employee_id: row.employee_id,
      recipient: row.recipient || "",
      leave_type: row.leave_type,
      start_date: row.start_date,
      end_date: row.end_date,
      reason: row.reason || "",
      status: row.status,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };

    return { success: true, leave };
  } catch (err: any) {
    console.error("Error creating leave request:", err);
    return { success: false, error: err.message || "فشل تقديم طلب الإجازة" };
  }
}
