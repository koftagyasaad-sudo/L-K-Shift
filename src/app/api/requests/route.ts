import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { authorizeApi, canAccessBranch } from "@/lib/api-auth";
import { notifyRequestOwner, notifyRequestReviewers } from "@/lib/request-notifications";
import {
  canApproveRequestByType,
  canViewRequestByType,
  getGovernanceFlags,
} from "@/lib/workflow-routing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function resultRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (typeof result === "object" && result !== null && "rows" in result && Array.isArray(result.rows)) {
    return result.rows as T[];
  }
  return [];
}

let cachedLeaveColumns: Set<string> | null = null;

async function getLeaveRequestsColumns(): Promise<Set<string>> {
  if (cachedLeaveColumns) return cachedLeaveColumns;
  const alterStatements = [
    sql`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS request_type text`,
    sql`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS leave_type text`,
    sql`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT 1`,
    sql`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS total_days integer DEFAULT 1`,
    sql`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS advance_amount numeric DEFAULT 0`,
    sql`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS deduction_amount numeric DEFAULT 0`,
    sql`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS submitted_by text`,
    sql`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS penalty_category text`,
    sql`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS target_role text`,
    sql`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS staff_count integer DEFAULT 1`,
    sql`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS rejection_reason text`,
    sql`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS final_status text DEFAULT 'PENDING'`,
  ];
  for (const stmt of alterStatements) {
    try { await db.execute(stmt); } catch {}
  }
  const raw = await db.execute(sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'leave_requests';
  `);
  const cols = new Set(resultRows<{ column_name: string }>(raw).map((r) => r.column_name));
  if (cols.size > 0) cachedLeaveColumns = cols;
  return cols;
}

export async function GET(request: NextRequest) {
  try {
    const authorization = await authorizeApi();
    if ("response" in authorization) return authorization.response;
    await getLeaveRequestsColumns();

    const principal = authorization.principal;
    const { searchParams } = new URL(request.url);
    const rawReqUserId = searchParams.get("userId")?.trim() || null;
    const isReviewer = principal.systemRole === "SUPER_ADMIN" || principal.jobRole.includes("مدير") || principal.jobRole.toUpperCase().includes("HR") || principal.jobRole.includes("موارد");
    const requestedUserId = isReviewer ? rawReqUserId : String(principal.id);

    const raw = await db.execute(sql`
      SELECT 
        r.id,
        r.user_id AS "userId",
        COALESCE(r.submitted_by, r.user_id) AS "submittedBy",
        COALESCE(u.full_name_ar, 'موظف') AS "userName",
        COALESCE(u.phone, '') AS "userPhone",
        u.primary_branch_id::text AS "branchId",
        COALESCE(b.name_ar, 'الإدارة') AS "branchName",
        COALESCE(r.request_type, r.leave_type, 'LEAVE') AS "requestType",
        COALESCE(r.penalty_category, '') AS "penaltyCategory",
        TO_CHAR(r.start_date, 'YYYY-MM-DD') AS "startDate",
        TO_CHAR(r.end_date, 'YYYY-MM-DD') AS "endDate",
        COALESCE(r.duration_days, r.total_days, 1) AS "durationDays",
        COALESCE(NULLIF(r.deduction_amount, 0), r.advance_amount, 0) AS "advanceAmount",
        COALESCE(r.deduction_amount, 0) AS "deductionAmount",
        r.reason,
        COALESCE(r.status::text, 'PENDING') AS "status",
        COALESCE(r.rejection_reason, '') AS "rejectionReason",
        r.created_at AS "createdAt"
      FROM leave_requests r
      LEFT JOIN users u ON r.user_id::text = u.id::text
      LEFT JOIN branches b ON u.primary_branch_id::text = b.id::text
      WHERE (${requestedUserId}::text IS NULL OR r.user_id::text = ${requestedUserId}::text)
      ORDER BY r.id DESC
      LIMIT 600;
    `);

    const rows = resultRows<Record<string, unknown>>(raw);
    const filtered = rows.filter((row) => {
      const rowUserId = String(row.userId || "");
      const rowSubId = String(row.submittedBy || "");
      const rowBranchId = row.branchId ? String(row.branchId) : null;
      const reqType = String(row.requestType || "LEAVE");
      return canViewRequestByType(principal, reqType, {
        isOwn: rowUserId === principal.id,
        isSubmittedByMe: rowSubId === principal.id,
        isBranchMatch: canAccessBranch(principal, rowBranchId),
      });
    });

    return NextResponse.json(filtered, { status: 200 });
  } catch (error) {
    console.error("Requests GET Error:", error);
    return NextResponse.json({ message: "تعذر تحميل الطلبات." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorization = await authorizeApi();
    if ("response" in authorization) return authorization.response;
    const cols = await getLeaveRequestsColumns();

    const principal = authorization.principal;
    const body = await request.json();
    const {
      requestType,
      targetUserId,
      penaltyCategory,
      startDate,
      endDate,
      durationDays,
      advanceAmount,
      deductionAmount,
      reason,
      targetRole,
      staffCount,
    } = body;

    if (!requestType || !reason) {
      return NextResponse.json({ message: "البيانات غير مكتملة" }, { status: 400 });
    }

    const normalizedType = String(requestType).toUpperCase();
    const sDate = startDate || new Date().toISOString().slice(0, 10);
    const eDate = endDate || sDate;
    const days = durationDays ? Math.max(0, parseInt(String(durationDays), 10) || 0) : 1;

    let finalUserId = principal.id;
    let finalAmount = advanceAmount ? parseFloat(String(advanceAmount)) || 0 : 0;

    if (normalizedType === "PENALTY") {
      const gov = getGovernanceFlags(principal);
      if (!gov.isBranchOrDirectManager) {
        return NextResponse.json({ message: "إرسال الجزاءات متاح للمديرين فقط." }, { status: 403 });
      }
      const employeeId = String(targetUserId || "").trim();
      if (!employeeId) {
        return NextResponse.json({ message: "يرجى اختيار الموظف المستهدف." }, { status: 400 });
      }
      const empRaw = await db.execute(sql`
        SELECT id, COALESCE(full_name_ar, 'موظف') AS name, COALESCE(monthly_salary, 5000) AS salary
        FROM users WHERE id::text = ${employeeId} LIMIT 1;
      `);
      const empRows = resultRows<{ id: string; name: string; salary: string | number }>(empRaw);
      if (!empRows.length) {
        return NextResponse.json({ message: "الموظف غير موجود." }, { status: 404 });
      }
      const dailyRate = Number(empRows[0].salary || 5000) / 30;
      const explicitAmount = parseFloat(String(deductionAmount || advanceAmount || "0")) || 0;
      finalAmount = explicitAmount > 0 ? explicitAmount : Math.round(days * dailyRate * 100) / 100;
      finalUserId = employeeId;
    }

    await db.execute(sql`
      INSERT INTO leave_requests (
        user_id,
        leave_type,
        request_type,
        start_date,
        end_date,
        total_days,
        duration_days,
        advance_amount,
        reason,
        status,
        created_at
      ) VALUES (
        ${finalUserId},
        ${normalizedType},
        ${normalizedType},
        NULLIF(${sDate}, '')::date,
        NULLIF(${eDate}, '')::date,
        ${days},
        ${days},
        ${finalAmount},
        ${reason},
        'PENDING',
        NOW()
      );
    `);

    // Update optional extended columns safely if present
    if (cols.has("submitted_by") || cols.has("deduction_amount") || cols.has("penalty_category")) {
      try {
        await db.execute(sql`
          UPDATE leave_requests
          SET submitted_by = ${principal.id},
              deduction_amount = ${normalizedType === "PENALTY" ? finalAmount : 0},
              penalty_category = ${penaltyCategory || null},
              target_role = ${targetRole || null},
              staff_count = ${staffCount ? parseInt(String(staffCount), 10) : 1}
          WHERE id = (SELECT MAX(id) FROM leave_requests WHERE user_id::text = ${finalUserId});
        `);
      } catch {}
    }

    try {
      const channel =
        normalizedType === "COMPLAINT"
          ? "COMPLAINT"
          : normalizedType === "PENALTY"
          ? "PENALTY"
          : normalizedType === "STAFF_REQUEST"
          ? "STAFF_REQUEST"
          : normalizedType === "ADVANCE"
          ? "ADVANCE"
          : "LEAVE_PERMISSION";

      await notifyRequestReviewers(
        principal.id,
        `طلب جديد (${normalizedType})`,
        String(reason).slice(0, 80),
        "/admin/leave-requests",
        channel,
        principal.primaryBranchId
      );
    } catch {}

    return NextResponse.json({ success: true, message: "تم إرسال الطلب بنجاح" });
  } catch (error) {
    console.error("Requests POST Error:", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "فشل إرسال الطلب" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authorization = await authorizeApi();
    if ("response" in authorization) return authorization.response;
    const cols = await getLeaveRequestsColumns();

    const principal = authorization.principal;
    const body = await request.json();
    const { requestId, status: newStatus, rejectionReason } = body;

    if (!requestId || !newStatus || (newStatus !== "APPROVED" && newStatus !== "REJECTED")) {
      return NextResponse.json({ message: "بيانات غير صحيحة" }, { status: 400 });
    }

    const reqNumericId = Number(requestId);
    const targetReq = await db.execute(sql`
      SELECT r.user_id, r.request_type, r.leave_type, u.primary_branch_id::text AS branch_id
      FROM leave_requests r
      LEFT JOIN users u ON u.id::text = r.user_id::text
      WHERE r.id = ${reqNumericId} LIMIT 1;
    `);
    const reqRows = resultRows<{
      user_id: string;
      request_type: string | null;
      leave_type: string | null;
      branch_id: string | null;
    }>(targetReq);

    if (!reqRows.length) {
      return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 });
    }

    const employeeUserId = reqRows[0].user_id;
    const rawType = String(reqRows[0].request_type || reqRows[0].leave_type || "LEAVE").toUpperCase();
    const isBranchMatch = canAccessBranch(principal, reqRows[0].branch_id);

    if (!canApproveRequestByType(principal, rawType, isBranchMatch)) {
      return NextResponse.json({ message: "غير مصرح لك باعتماد هذا الطلب" }, { status: 403 });
    }

    const cleanRejection = rejectionReason ? String(rejectionReason).trim() : null;

    await db.execute(sql`
      UPDATE leave_requests
      SET status = ${newStatus},
          rejection_reason = ${cleanRejection}
      WHERE id = ${reqNumericId};
    `);

    if (cols.has("final_status")) {
      try {
        await db.execute(sql`UPDATE leave_requests SET final_status = ${newStatus} WHERE id = ${reqNumericId};`);
      } catch {}
    }

    try {
      await notifyRequestOwner(
        employeeUserId,
        newStatus === "APPROVED" ? "تمت الموافقة على طلبك ✅" : "تم رفض طلبك ❌",
        newStatus === "APPROVED" ? "تم اعتماد طلبك بنجاح." : `تم رفض الطلب.${cleanRejection ? " السبب: " + cleanRejection : ""}`,
        "/requests"
      );
    } catch {}

    return NextResponse.json({ success: true, message: "تم تحديث حالة الطلب بنجاح" });
  } catch (error) {
    console.error("Requests PATCH Error:", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "فشل التحديث" }, { status: 500 });
  }
}
