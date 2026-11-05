import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// 1. استرجاع طلبات الإجازات والأذونات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');

    let query = sql`
      SELECT 
        id,
        user_id as "userId",
        user_name as "userName",
        user_phone as "userPhone",
        branch_id as "branchId",
        branch_name as "branchName",
        request_type as "requestType",
        start_date::text as "startDate",
        end_date::text as "endDate",
        duration_days as "durationDays",
        duration_hours as "durationHours",
        substitute_name as "substituteName",
        reason,
        branch_status as "branchStatus",
        branch_notes as "branchNotes",
        branch_reviewed_by as "branchReviewedBy",
        branch_reviewed_at as "branchReviewedAt",
        hr_status as "hrStatus",
        hr_notes as "hrNotes",
        hr_reviewed_by as "hrReviewedBy",
        hr_reviewed_at as "hrReviewedAt",
        final_status as "finalStatus",
        created_at as "createdAt"
      FROM leave_requests
      WHERE 1=1
    `;

    if (userId) {
      query = sql`${query} AND user_id = ${userId}`;
    }
    if (branchId) {
      query = sql`${query} AND branch_id = ${parseInt(branchId, 10)}`;
    }
    if (status) {
      query = sql`${query} AND final_status = ${status}`;
    }

    query = sql`${query} ORDER BY created_at DESC LIMIT 200;`;

    const raw = await db.execute(query);
    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json({ message: 'فشل استرجاع الطلبات', error: error?.message }, { status: 500 });
  }
}

// 2. تقديم طلب إجازة أو إذن جديد من الموظف
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const userId = (body.userId || '1').toString().trim();
    const userName = (body.userName || 'موظف').toString().trim();
    const userPhone = (body.userPhone || '').toString().trim();
    const branchId = body.branchId ? parseInt(String(body.branchId), 10) : null;
    const branchName = (body.branchName || 'الفرع الرئيسي').toString().trim();
    const requestType = body.requestType || 'ANNUAL';
    const startDate = body.startDate;
    const endDate = body.endDate || startDate;
    const durationDays = parseFloat(body.durationDays || '1') || 1;
    const durationHours = parseFloat(body.durationHours || '0') || 0;
    const substituteName = body.substituteName || '—';
    const reason = (body.reason || '').toString().trim();

    if (!startDate || !reason) {
      return NextResponse.json({ message: 'تاريخ الطلب وسبب الإجازة/الإذن حقول مطلوبة' }, { status: 400 });
    }

    const insertRaw = await db.execute(sql`
      INSERT INTO leave_requests (
        user_id, user_name, user_phone, branch_id, branch_name,
        request_type, start_date, end_date, duration_days, duration_hours,
        substitute_name, reason, branch_status, hr_status, final_status, created_at
      ) VALUES (
        ${userId}, ${userName}, ${userPhone}, ${branchId}, ${branchName},
        ${requestType}, ${startDate}::date, ${endDate}::date, ${durationDays}, ${durationHours},
        ${substituteName}, ${reason}, 'PENDING', 'PENDING', 'PENDING_BRANCH', NOW()
      )
      RETURNING id, final_status as "finalStatus";
    `);

    const rows = Array.isArray(insertRaw) ? insertRaw : (insertRaw as any)?.rows || [];
    return NextResponse.json({ success: true, message: 'تم إرسال الطلب لمدير الفرع بنجاح', data: rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating leave request:', error);
    return NextResponse.json({ message: error?.message || 'فشل إرسال الطلب', error: error?.message }, { status: 500 });
  }
}

// 3. مسار اتخاذ القرار (موافقة/رفض مدير الفرع أو الـ HR)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const requestId = parseInt(String(body.requestId), 10);
    const actionBy = body.actionBy; // 'BRANCH_MANAGER' أو 'HR_ADMIN'
    const decision = body.decision; // 'APPROVE' أو 'REJECT'
    const notes = (body.notes || '').toString().trim();
    const reviewerName = body.reviewerName || 'الإدارة';

    if (!requestId || !actionBy || !decision) {
      return NextResponse.json({ message: 'معرف الطلب ونوع الاعتماد والقرار حقول مطلوبة' }, { status: 400 });
    }

    if (decision === 'REJECT' && !notes) {
      return NextResponse.json({ message: 'يجب كتابة سبب الرفض لتوضيحه للموظف' }, { status: 400 });
    }

    if (actionBy === 'BRANCH_MANAGER') {
      const newBranchStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      const newFinalStatus = decision === 'APPROVE' ? 'PENDING_HR' : 'REJECTED_BRANCH';

      await db.execute(sql`
        UPDATE leave_requests
        SET 
          branch_status = ${newBranchStatus},
          branch_notes = ${notes},
          branch_reviewed_by = ${reviewerName},
          branch_reviewed_at = NOW(),
          final_status = ${newFinalStatus}
        WHERE id = ${requestId};
      `);

      return NextResponse.json({
        success: true,
        message: decision === 'APPROVE' ? 'تمت موافقة مدير الفرع، وتم تحويل الطلب للـ HR' : 'تم رفض الطلب من مدير الفرع',
      });
    }

    if (actionBy === 'HR_ADMIN') {
      const newHrStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      const newFinalStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED_HR';

      await db.execute(sql`
        UPDATE leave_requests
        SET 
          hr_status = ${newHrStatus},
          hr_notes = ${notes},
          hr_reviewed_by = ${reviewerName},
          hr_reviewed_at = NOW(),
          final_status = ${newFinalStatus}
        WHERE id = ${requestId};
      `);

      // إذا تمت الموافقة النهائية وكانت إجازة سنوية، يتم خصم الأيام من رصيد الموظف
      if (decision === 'APPROVE') {
        await db.execute(sql`
          UPDATE users 
          SET used_leave_days = COALESCE(used_leave_days, 0) + COALESCE((SELECT duration_days FROM leave_requests WHERE id = ${requestId}), 1)
          WHERE id::text = (SELECT user_id FROM leave_requests WHERE id = ${requestId});
        `);
      }

      return NextResponse.json({
        success: true,
        message: decision === 'APPROVE' ? 'تم اعتماد الطلب نهائياً وخصم الرصيد بنجاح' : 'تم رفض الطلب نهائياً من الـ HR',
      });
    }

    return NextResponse.json({ message: 'نوع الاعتماد غير صالح' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating leave decision:', error);
    return NextResponse.json({ message: error?.message || 'فشل اتخاذ الإجراء', error: error?.message }, { status: 500 });
  }
}
