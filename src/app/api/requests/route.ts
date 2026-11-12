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

let penaltyColumnsEnsured = false;
async function ensurePenaltyColumns() {
  if (penaltyColumnsEnsured) return;
  try {
    await db.execute(sql`
      ALTER TABLE leave_requests
        ADD COLUMN IF NOT EXISTS submitted_by text,
        ADD COLUMN IF NOT EXISTS penalty_category text,
        ADD COLUMN IF NOT EXISTS deduction_amount numeric DEFAULT 0;
    `);
    penaltyColumnsEnsured = true;
  } catch (err) {
    console.warn("Could not alter leave_requests for penalty columns:", err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const authorization = await authorizeApi();
    if ("response" in authorization) return authorization.response;
    await ensurePenaltyColumns();

    const principal = authorization.principal;
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId")?.trim() || null;

    const raw = await db.execute(sql`
      SELECT 
        r.id,
        r.user_id AS "userId",
        COALESCE(r.submitted_by, r.user_id) AS "submittedBy",
        COALESCE(sub.full_name_ar, sub.name, '') AS "submittedByName",
        COALESCE(u.full_name_ar, u.name, 'موظف') AS "userName",
        COALESCE(u.phone, '') AS "userPhone",
        COALESCE(u.primary_branch_id::text, u.branch_id::text) AS "branchId",
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
      LEFT JOIN users sub ON r.submitted_by::text = sub.id::text
      LEFT JOIN branches b ON COALESCE(u.primary_branch_id::text, u.branch_id::text) = b.id::text
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
      const isOwn = rowUserId === principal.id;
      const isSubmittedByMe = rowSubId === principal.id;
      const isBranchMatch = canAccessBranch(principal, rowBranchId);

      return canViewRequestByType(principal, reqType, {
        isOwn,
        isSubmittedByMe,
        isBranchMatch,
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
    await ensurePenaltyColumns();

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

    // Handle Manager Penalty / Deduction submission
    if (normalizedType === "PENALTY") {
      const gov = getGovernanceFlags(principal);
      if (!gov.isBranchOrDirectManager) {
        return NextResponse.json(
          { message: "إرسال الجزاءات والخصومات متاح للمديرين ومدير التشغيل والإدارة فقط." },
          { status: 403 }
        );
      }
      const employeeId = String(targetUserId || "").trim();
      if (!employeeId) {
        return NextResponse.json({ message: "يرجى اختيار الموظف المستهدف بالجزاء أو الخصم." }, { status: 400 });
      }

      const empRaw = await db.execute(sql`
        SELECT id, COALESCE(full_name_ar, name, 'موظف') AS name,
               COALESCE(monthly_salary, 5000) AS salary,
               COALESCE(primary_branch_id::text, branch_id::text) AS branch_id
        FROM users WHERE id::text = ${employeeId} LIMIT 1;
      `);
      const empRows = resultRows<{ id: string; name: string; salary: string | number; branch_id: string | null }>(empRaw);
      if (!empRows.length) {
        return NextResponse.json({ message: "الموظف المحدد غير موجود." }, { status: 404 });
      }

      const empSalary = Number(empRows[0].salary || 5000);
      const dailyRate = empSalary / 30;
      const explicitAmount = parseFloat(String(deductionAmount || advanceAmount || "0")) || 0;
      const computedDeduction = explicitAmount > 0 ? explicitAmount : Math.round(days * dailyRate * 100) / 100;

      if (computedDeduction <= 0 && days <= 0) {
        return NextResponse.json({ message: "يرجى تحديد عدد أيام الخصم أو قيمة الخصم بالجنيه." }, { status: 400 });
      }

      await db.execute(sql`
        INSERT INTO leave_requests (
          user_id,
          submitted_by,
          leave_type,
          request_type,
          penalty_category,
          start_date,
          end_date,
          total_days,
          duration_days,
          advance_amount,
          deduction_amount,
          reason,
          status,
          final_status,
          created_at
        ) VALUES (
          ${employeeId},
          ${principal.id},
          'PENALTY',
          'PENALTY',
          ${penaltyCategory || "DEDUCTION_AMOUNT"},
          NULLIF(${sDate}, '')::date,
          NULLIF(${eDate}, '')::date,
          ${days},
          ${days},
          ${computedDeduction},
          ${computedDeduction},
          ${reason},
          'PENDING',
          'PENDING',
          NOW()
        );
      `);

      try {
        await notifyRequestReviewers(
          principal.id,
          `طلب جزاء / خصم جديد على (${empRows[0].name})`,
          `قيمة الخصم: ${computedDeduction} ج.م — ${String(reason).slice(0, 70)}`,
          "/admin/leave-requests",
          "PENALTY",
          empRows[0].branch_id
        );
      } catch (e) {
        console.warn("Penalty notification skipped:", e);
      }

      return NextResponse.json({
        success: true,
        message: `تم إرسال الجزاء/الخصم (${computedDeduction} ج.م) إلى HR ومدير النظام للمراجعة والاعتماد.`,
      });
    }

    // Standard employee/manager requests (LEAVE, PERMISSION, ADVANCE, COMPLAINT, STAFF_REQUEST)
    const userId = principal.id;
    const amount = advanceAmount ? parseFloat(String(advanceAmount)) || 0 : 0;

    await db.execute(sql`
      INSERT INTO leave_requests (
        user_id,
        submitted_by,
        leave_type,
        request_type,
        start_date,
        end_date,
        total_days,
        duration_days,
        advance_amount,
        target_role,
        staff_count,
        reason,
        status,
        final_status,
        created_at
      ) VALUES (
        ${userId},
        ${userId},
        ${normalizedType},
        ${normalizedType},
        NULLIF(${sDate}, '')::date,
        NULLIF(${eDate}, '')::date,
        ${days},
        ${days},
        ${amount},
        ${targetRole || null},
        ${staffCount ? parseInt(String(staffCount), 10) : 1},
        ${reason},
        'PENDING',
        'PENDING',
        NOW()
      );
    `);

    try {
      const channel =
        normalizedType === "COMPLAINT"
          ? "COMPLAINT"
          : normalizedType === "STAFF_REQUEST"
          ? "STAFF_REQUEST"
          : normalizedType === "ADVANCE"
          ? "ADVANCE"
          : "LEAVE_PERMISSION";

      const notifTitle =
        normalizedType === "STAFF_REQUEST"
          ? "طلب عمالة جديد من مدير فرع"
          : normalizedType === "COMPLAINT"
          ? "شكوى سرية جديدة (HR / الإدارة العليا)"
          : normalizedType === "ADVANCE"
          ? "طلب سلفة مالية جديدة"
          : normalizedType === "PERMISSION"
          ? "طلب إذن جديد"
          : "طلب إجازة جديد";

      await notifyRequestReviewers(
        userId,
        notifTitle,
        `${notifTitle}: "${String(reason).slice(0, 65)}..."`,
        "/admin/leave-requests",
        channel,
        principal.primaryBranchId
      );
    } catch (notifErr) {
      console.warn("Notification insert skipped:", notifErr);
    }

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
    await ensurePenaltyColumns();

    const principal = authorization.principal;
    const body = await request.json();
    const { requestId, status: newStatus, rejectionReason } = body;

    if (!requestId || !newStatus || (newStatus !== "APPROVED" && newStatus !== "REJECTED")) {
      return NextResponse.json({ message: "بيانات غير صحيحة" }, { status: 400 });
    }

    const reqNumericId = Number(requestId);
    if (!Number.isSafeInteger(reqNumericId) || reqNumericId < 1) {
      return NextResponse.json({ message: "معرف الطلب غير صالح" }, { status: 400 });
    }

    const targetReq = await db.execute(sql`
      SELECT r.user_id, r.request_type, r.leave_type,
             COALESCE(u.primary_branch_id::text, u.branch_id::text) AS branch_id
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
    const targetBranchId = reqRows[0].branch_id == null ? null : String(reqRows[0].branch_id);
    const isBranchMatch = canAccessBranch(principal, targetBranchId);

    if (!canApproveRequestByType(principal, rawType, isBranchMatch)) {
      return NextResponse.json({ message: "غير مصرح لك باعتماد هذا النوع من الطلبات" }, { status: 403 });
    }

    await db.execute(sql`
      UPDATE leave_requests
      SET status = ${newStatus},
          final_status = ${newStatus},
          rejection_reason = ${rejectionReason || null}
      WHERE id = ${reqNumericId};
    `);

    const typeNamesAr: Record<string, string> = {
      LEAVE: "الإجازة",
      PERMISSION: "الإذن",
      ADVANCE: "السلفة المالية",
      COMPLAINT: "الشكوى",
      STAFF_REQUEST: "طلب العمالة",
      PENALTY: "الجزاء / الخصم الإداري",
    };
    const reqTypeAr = typeNamesAr[rawType] || "الطلب";

    const notifTitle =
      rawType === "PENALTY"
        ? newStatus === "APPROVED"
          ? "تم اعتماد جزاء / خصم على راتبك ⚠️"
          : "تم إلغاء / رفض طلب الجزاء ✅"
        : newStatus === "APPROVED"
        ? `تمت الموافقة على ${reqTypeAr} ✅`
        : `تم رفض ${reqTypeAr} ❌`;

    const notifMsg =
      rawType === "PENALTY"
        ? newStatus === "APPROVED"
          ? "تم اعتماد الخصم/الجزاء من إدارة الموارد البشرية وإضافته إلى مسير الرواتب."
          : "تم رفض الجزاء الإداري ولن يُخصم من راتبك."
        : newStatus === "APPROVED"
        ? `تمت مراجعة واعتماد ${reqTypeAr} الخاص بك بنجاح.`
        : `تم رفض ${reqTypeAr}.${rejectionReason ? ` سبب الرفض: ${rejectionReason}` : ""}`;

    try {
      await notifyRequestOwner(employeeUserId, notifTitle, notifMsg, "/requests");
    } catch (e) {
      console.warn("Owner notification skipped:", e);
    }

    return NextResponse.json({ success: true, message: "تم تحديث حالة الطلب بنجاح" });
  } catch (error) {
    console.error("Requests PATCH Error:", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "فشل التحديث" }, { status: 500 });
  }
}
