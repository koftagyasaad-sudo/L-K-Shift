import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { authorizeApi, canAccessBranch, hasApiPermission } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const authorization = await authorizeApi();
    if ('response' in authorization) return authorization.response;

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const requestedId = requestedUserId ? Number(requestedUserId) : null;
    if (requestedId !== null && (!Number.isSafeInteger(requestedId) || requestedId < 1)) {
      return NextResponse.json({ message: 'معرف المستخدم غير صالح' }, { status: 400 });
    }
    const isSelf = requestedId === authorization.principal.id;
    const canView = ['leaves.view', 'leaves.approve', 'staff_requests.manage'].some((permission) =>
      hasApiPermission(authorization.principal, permission)
    );
    if (!isSelf && !canView) {
      return NextResponse.json({ message: 'ممنوع' }, { status: 403 });
    }

    const branchFilter = isSelf || authorization.principal.branchScope === 'ALL'
      ? sql`1=1`
      : authorization.principal.branchScope === 'CUSTOM'
        ? sql`COALESCE(u.primary_branch_id, u.branch_id) = ANY(${authorization.principal.allowedBranchIds}::int[])`
        : authorization.principal.primaryBranchId
          ? sql`COALESCE(u.primary_branch_id, u.branch_id) = ${authorization.principal.primaryBranchId}`
          : sql`1=0`;

    const raw = await db.execute(sql`
      SELECT 
        r.id,
        r.user_id as "userId",
        COALESCE(u.full_name_ar, u.name, 'موظف') as "userName",
        COALESCE(u.phone, '') as "userPhone",
        COALESCE(b.name_ar, 'الإدارة') as "branchName",
        COALESCE(r.request_type, r.leave_type, 'LEAVE') as "requestType",
        TO_CHAR(r.start_date, 'YYYY-MM-DD') as "startDate",
        TO_CHAR(r.end_date, 'YYYY-MM-DD') as "endDate",
        COALESCE(r.duration_days, r.total_days, 1) as "durationDays",
        COALESCE(r.advance_amount, 0) as "advanceAmount",
        r.reason,
        COALESCE(r.status::text, 'PENDING') as "status",
        COALESCE(r.rejection_reason, '') as "rejectionReason",
        r.created_at as "createdAt"
      FROM leave_requests r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN branches b ON COALESCE(u.primary_branch_id, u.branch_id) = b.id
      WHERE ${requestedId !== null ? sql`r.user_id = ${requestedId}` : sql`1=1`}
        AND ${branchFilter}
      ORDER BY r.id DESC;
    `);

    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    console.error('Requests GET Error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorization = await authorizeApi();
    if ('response' in authorization) return authorization.response;

    const body = await request.json();
    const { requestType, startDate, endDate, durationDays, advanceAmount, reason, targetRole, staffCount } = body;
    const userId = authorization.principal.id;

    if (!userId || !requestType || !reason) {
      return NextResponse.json({ message: 'البيانات غير مكتملة' }, { status: 400 });
    }

    const sDate = startDate || new Date().toISOString().slice(0, 10);
    const eDate = endDate || sDate;
    const days = durationDays ? parseInt(durationDays, 10) : 1;
    const amount = advanceAmount ? parseFloat(advanceAmount) : 0;

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
        target_role,
        staff_count,
        reason,
        status,
        created_at
      ) VALUES (
        ${userId},
        ${requestType},
        ${requestType},
        ${sDate}::date,
        ${eDate}::date,
        ${days},
        ${days},
        ${amount},
        ${targetRole || null},
        ${staffCount ? parseInt(staffCount, 10) : 1},
        ${reason},
        'PENDING',
        NOW()
      );
    `);

    // إرسال الإشعار التفاعلي
    try {
      const isStaffReq = requestType === 'STAFF_REQUEST';
      const isComplaint = requestType === 'COMPLAINT';

      const notifTitle = isStaffReq
        ? 'طلب عمالة جديد من مدير فرع'
        : isComplaint
        ? 'شكوى موظف جديدة'
        : requestType === 'ADVANCE'
        ? 'طلب سلفة مالية جديدة'
        : requestType === 'PERMISSION'
        ? 'طلب إذن جديد'
        : 'طلب إجازة جديد';

      const notifMsg = `تم استلام ${notifTitle}: "${reason.slice(0, 60)}..."`;

      // طلب العمالة والشكوى يصلان لمدير النظام والـ HR فقط
      const recipientFilter = isStaffReq || isComplaint
        ? sql`system_role = 'SUPER_ADMIN' OR job_role ILIKE '%مدير النظام%' OR job_role ILIKE '%HR%' OR job_role ILIKE '%موارد بشرية%'`
        : sql`system_role = 'SUPER_ADMIN' OR job_role ILIKE '%مدير%' OR job_role ILIKE '%HR%'`;

      await db.execute(sql`
        INSERT INTO notifications (user_id, sender_id, title, message, type, link, is_read, created_at)
        SELECT id, ${userId}, ${notifTitle}, ${notifMsg}, ${requestType}, '/admin/leave-requests', false, NOW()
        FROM users 
        WHERE (${recipientFilter}) AND id != ${userId};
      `);
    } catch (notifErr) {
      console.warn('Notification insert skipped:', notifErr);
    }

    return NextResponse.json({ success: true, message: 'تم إرسال الطلب بنجاح' });
  } catch (error: any) {
    console.error('Requests POST Error:', error);
    return NextResponse.json({ message: error?.message || 'فشل إرسال الطلب' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authorization = await authorizeApi();
    if ('response' in authorization) return authorization.response;

    const body = await request.json();
    const { requestId, status: newStatus, rejectionReason } = body;

    if (!requestId || !newStatus || (newStatus !== 'APPROVED' && newStatus !== 'REJECTED')) {
      return NextResponse.json({ message: 'بيانات غير صحيحة' }, { status: 400 });
    }

    const reqNumericId = Number(requestId);
    if (!Number.isSafeInteger(reqNumericId) || reqNumericId < 1) {
      return NextResponse.json({ message: 'معرف الطلب غير صالح' }, { status: 400 });
    }
    const adminNumericId = authorization.principal.id;

    const targetReq = await db.execute(sql`
      SELECT r.user_id, r.request_type, r.leave_type,
             COALESCE(u.primary_branch_id, u.branch_id) AS branch_id
      FROM leave_requests r
      LEFT JOIN users u ON u.id = r.user_id
      WHERE r.id = ${reqNumericId} LIMIT 1;
    `);
    const reqRows = Array.isArray(targetReq) ? targetReq : (targetReq as any)?.rows || [];
    if (!reqRows.length) {
      return NextResponse.json({ message: 'الطلب غير موجود' }, { status: 404 });
    }

    const employeeUserId = reqRows[0].user_id;
    const rawType = reqRows[0].request_type || reqRows[0].leave_type || 'LEAVE';
    const requiredPermission = rawType === 'STAFF_REQUEST' || rawType === 'COMPLAINT'
      ? 'staff_requests.manage'
      : 'leaves.approve';
    const targetBranchId = reqRows[0].branch_id == null ? null : Number(reqRows[0].branch_id);
    if (
      !hasApiPermission(authorization.principal, requiredPermission) ||
      !canAccessBranch(authorization.principal, targetBranchId)
    ) {
      return NextResponse.json({ message: 'ممنوع' }, { status: 403 });
    }

    try {
      await db.execute(sql`
        UPDATE leave_requests
        SET 
          status = ${newStatus}::leave_status,
          approved_by = ${adminNumericId},
          rejection_reason = ${rejectionReason || null}
        WHERE id = ${reqNumericId};
      `);
    } catch {
      await db.execute(sql`
        UPDATE leave_requests
        SET 
          status = ${newStatus},
          approved_by = ${adminNumericId},
          rejection_reason = ${rejectionReason || null}
        WHERE id = ${reqNumericId};
      `);
    }

    const typeNamesAr: { [key: string]: string } = {
      LEAVE: 'الإجازة',
      PERMISSION: 'الإذن',
      ADVANCE: 'السلفة المالية',
      COMPLAINT: 'الشكوى',
      STAFF_REQUEST: 'طلب العمالة',
    };
    const reqTypeAr = typeNamesAr[rawType] || 'الطلب';

    const notifTitle = newStatus === 'APPROVED' ? `تمت الموافقة على ${reqTypeAr} ✅` : `تم رفض ${reqTypeAr} ❌`;
    const notifMsg =
      newStatus === 'APPROVED'
        ? `تمت مراجعة واعتماد ${reqTypeAr} الخاص بك بنجاح.`
        : `تم رفض ${reqTypeAr}.${rejectionReason ? ` سبب الرفض: ${rejectionReason}` : ''}`;

    try {
      await db.execute(sql`
        INSERT INTO notifications (user_id, sender_id, title, message, type, link, is_read, created_at)
        VALUES (
          ${employeeUserId},
          ${adminNumericId},
          ${notifTitle},
          ${notifMsg},
          'REQUEST',
          '/requests',
          false,
          NOW()
        );
      `);
    } catch {}

    return NextResponse.json({ success: true, message: 'تم تحديث حالة الطلب بنجاح' });
  } catch (error: any) {
    console.error('Requests PATCH Error:', error);
    return NextResponse.json({ message: error?.message || 'فشل التحديث' }, { status: 500 });
  }
}
