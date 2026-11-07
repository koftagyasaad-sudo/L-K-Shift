import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// 1. استرجاع طلبات الإجازات والأذونات والسلف
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const branchId = searchParams.get('branchId');

    let query = sql`
      SELECT 
        l.id,
        CAST(l.user_id AS TEXT) as "userId",
        COALESCE(l.user_name, u.full_name_ar, u.name, 'موظف') as "userName",
        COALESCE(l.user_phone, u.phone, '') as "userPhone",
        COALESCE(l.branch_name, b.name_ar, b.name, 'الفرع') as "branchName",
        COALESCE(l.request_type, l.leave_type, 'ANNUAL') as "requestType",
        COALESCE(l.start_date::text, CURRENT_DATE::text) as "startDate",
        COALESCE(l.end_date::text, CURRENT_DATE::text) as "endDate",
        COALESCE(l.duration_days, l.total_days, 1) as "durationDays",
        COALESCE(l.duration_hours, 0) as "durationHours",
        COALESCE(l.advance_amount, 0) as "advanceAmount",
        COALESCE(l.substitute_name, '—') as "substituteName",
        COALESCE(l.reason, '') as reason,
        COALESCE(l.final_status, 'PENDING_BRANCH') as "finalStatus",
        COALESCE(l.branch_notes, '') as "branchNotes",
        COALESCE(l.hr_notes, '') as "hrNotes",
        COALESCE(l.created_at, NOW()) as "createdAt"
      FROM leave_requests l
      LEFT JOIN users u ON CAST(l.user_id AS TEXT) = CAST(u.id AS TEXT)
      LEFT JOIN branches b ON COALESCE(u.primary_branch_id, u.branch_id) = b.id
      WHERE 1=1
    `;

    if (userId && userId.trim() !== '' && userId !== 'ALL') {
      query = sql`${query} AND CAST(l.user_id AS TEXT) = ${userId.trim()}`;
    }

    if (branchId && branchId.trim() !== '') {
      query = sql`${query} AND COALESCE(u.primary_branch_id, u.branch_id) = ${parseInt(branchId, 10)}`;
    }

    query = sql`${query} ORDER BY COALESCE(l.created_at, NOW()) DESC;`;

    const raw = await db.execute(query);
    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    console.error('Leave Requests GET Error:', error);
    return NextResponse.json({ message: 'فشل استرجاع الطلبات', error: error?.message }, { status: 500 });
  }
}

// 2. تقديم طلب إجازة / إذن / سلفة مالية
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const userId = (body.userId || '1').toString().trim();
    const userName = (body.userName || 'موظف').toString().trim();
    const userPhone = (body.userPhone || '').toString().trim();
    const branchName = (body.branchName || 'الفرع').toString().trim();
    const requestType = body.requestType || body.leaveType || 'ANNUAL';
    const startDate = body.startDate || new Date().toISOString().slice(0, 10);
    const endDate = body.endDate || startDate;
    const durationDays = parseInt(String(body.durationDays || body.totalDays || '1'), 10);
    const durationHours = parseFloat(String(body.durationHours || '0'));
    const advanceAmount = parseFloat(String(body.advanceAmount || '0'));
    const substituteName = (body.substituteName || '—').toString().trim();
    const reason = (body.reason || '').toString().trim();

    if (!reason && requestType !== 'PERMISSION') {
      return NextResponse.json({ message: 'سبب الطلب مطلوب' }, { status: 400 });
    }

    await db.execute(sql`
      INSERT INTO leave_requests (
        user_id,
        user_name,
        user_phone,
        branch_name,
        request_type,
        leave_type,
        start_date,
        end_date,
        duration_days,
        total_days,
        duration_hours,
        advance_amount,
        substitute_name,
        reason,
        final_status,
        created_at
      ) VALUES (
        ${userId},
        ${userName},
        ${userPhone},
        ${branchName},
        ${requestType},
        ${requestType},
        ${startDate}::date,
        ${endDate}::date,
        ${durationDays},
        ${durationDays},
        ${durationHours},
        ${advanceAmount},
        ${substituteName},
        ${reason},
        'PENDING_BRANCH',
        NOW()
      );
    `);

    return NextResponse.json({ success: true, message: 'تم إرسال طلبك بنجاح' }, { status: 201 });
  } catch (error: any) {
    console.error('Leave Requests POST Error:', error);
    return NextResponse.json({ message: error?.message || 'فشل إرسال الطلب', error: error?.message }, { status: 500 });
  }
}

// 3. مسار اعتماد الطلبات (معالجة ذكية تقبل كافة المسميات والقرارات)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. استخراج معرف الطلب بأي مسمى محتمل (id أو requestId أو leaveId)
    const rawId = body.id || body.requestId || body.leaveId;
    const id = parseInt(String(rawId), 10);

    if (!id || isNaN(id)) {
      return NextResponse.json({ message: 'رقم الطلب غير صحيح أو مفقود' }, { status: 400 });
    }

    // 2. تحليل القرار (موافقة أم رفض) من action أو status أو decision
    const rawAction = (body.action || body.status || body.decision || '').toString().toUpperCase();
    const isReject = rawAction.includes('REJECT') || rawAction.includes('رفض');
    const isApprove = rawAction.includes('APPROV') || rawAction.includes('قبول') || rawAction.includes('موافق') || !isReject;

    // 3. تحليل المرحلة (فرع أم إدارة / مدير عام)
    const rawStage = (body.stage || body.role || '').toString().toUpperCase();
    const isBranchStage = rawStage.includes('BRANCH') || rawStage.includes('فرع');

    const notes = (body.notes || body.branchNotes || body.hrNotes || '').toString().trim();

    // تحديد الحالة النهائية بدقة
    let targetStatus = 'APPROVED';
    if (isReject) {
      targetStatus = isBranchStage ? 'REJECTED_BRANCH' : 'REJECTED';
    } else if (isApprove) {
      targetStatus = isBranchStage ? 'PENDING_HR' : 'APPROVED';
    }

    // تحديث قاعدة البيانات
    await db.execute(sql`
      UPDATE leave_requests
      SET 
        final_status = ${targetStatus},
        branch_notes = CASE WHEN ${isBranchStage} THEN ${notes} ELSE COALESCE(branch_notes, '') END,
        hr_notes = CASE WHEN ${!isBranchStage} THEN ${notes} ELSE COALESCE(hr_notes, '') END
      WHERE id = ${id};
    `);

    return NextResponse.json({
      success: true,
      message: 'تم اعتماد وتحديث حالة الطلب بنجاح',
      finalStatus: targetStatus,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Leave Requests PUT Error:', error);
    return NextResponse.json({ message: 'فشل اعتماد الطلب', error: error?.message }, { status: 500 });
  }
}
