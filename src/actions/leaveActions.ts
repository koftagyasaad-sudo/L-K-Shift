"use server";

import { revalidatePath } from "next/cache";
import { neon } from "@neondatabase/serverless";

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  type: string;
  recipient: string; // الحقل الجديد: موجه إلى من
  start_date: string;
  end_date: string;
  reason: string;
  status: "معلق" | "مقبول" | "مرفوض";
  createdAt?: string;
}

const fallbackLeaves: LeaveRequest[] = [
  {
    id: "l1",
    employee_id: "e2",
    employee_name: "محمد علي",
    type: "إجازة سنوية",
    recipient: "المدير العام",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    reason: "إجازة عائلية شتوية",
    status: "معلق",
    createdAt: new Date().toISOString()
  }
];

function getClient() {
  if (!process.env.DATABASE_URL) return null;
  return neon(process.env.DATABASE_URL);
}

export async function getLeaveRequestsAction(): Promise<{ success: boolean; data: LeaveRequest[] }> {
  try {
    const sql = getClient();
    if (!sql) return { success: true, data: fallbackLeaves };

    const rows = await sql`
      SELECT id, employee_id, employee_name, type, recipient, start_date, end_date, reason, status, created_at as "createdAt"
      FROM leave_requests
      ORDER BY created_at DESC
    `;

    return {
      success: true,
      data: rows.map((r: any) => ({
        id: r.id,
        employee_id: r.employee_id,
        employee_name: r.employee_name,
        type: r.type,
        recipient: r.recipient || "مدير الفرع",
        start_date: r.start_date ? new Date(r.start_date).toISOString().split("T")[0] : "",
        end_date: r.end_date ? new Date(r.end_date).toISOString().split("T")[0] : "",
        reason: r.reason || "",
        status: r.status as "معلق" | "مقبول" | "مرفوض",
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
      }))
    };
  } catch (error) {
    console.error("Neon getLeaveRequestsAction Error:", error);
    return { success: true, data: fallbackLeaves };
  }
}

export async function createLeaveRequestAction(request: LeaveRequest): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getClient();
    if (sql) {
      await sql`
        INSERT INTO leave_requests (id, employee_id, employee_name, type, recipient, start_date, end_date, reason, status)
        VALUES (${request.id}, ${request.employee_id}, ${request.employee_name}, ${request.type}, ${request.recipient}, ${request.start_date}, ${request.end_date}, ${request.reason}, ${request.status})
      `;
    }

    revalidatePath("/[locale]/(app)", "page");
    return { success: true };
  } catch (error: any) {
    console.error("Neon createLeaveRequestAction Error:", error);
    return { success: false, error: error?.message || "فشل تقديم طلب الإجازة" };
  }
}

export async function updateLeaveStatusAction(id: string, status: "مقبول" | "مرفوض"): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getClient();
    if (sql) {
      await sql`
        UPDATE leave_requests
        SET status = ${status}
        WHERE id = ${id}
      `;
    }

    revalidatePath("/[locale]/(app)", "page");
    return { success: true };
  } catch (error: any) {
    console.error("Neon updateLeaveStatusAction Error:", error);
    return { success: false, error: error?.message || "فشل تحديث حالة الطلب" };
  }
}
