import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const raw = await db.execute(sql`
      SELECT 
        r.id,
        r.user_id as "userId",
        COALESCE(u.full_name_ar, u.name, 'موظف') as "userName",
        COALESCE(b.name_ar, 'الإدارة') as "branchName",
        COALESCE(r.request_type, r.leave_type, 'LEAVE') as "requestType",
        TO_CHAR(r.start_date, 'YYYY-MM-DD') as "startDate",
        TO_CHAR(r.end_date, 'YYYY-MM-DD') as "endDate",
        COALESCE(r.duration_days, r.total_days, 1) as "durationDays",
        COALESCE(r.advance_amount, 0) as "advanceAmount",
        r.reason,
        COALESCE(r.status::text, 'PENDING') as "status",
        r.created_at as "createdAt"
      FROM leave_requests r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN branches b ON COALESCE(u.primary_branch_id, u.branch_id) = b.id
      WHERE ${userId ? sql`r.user_id::text = ${userId}` : sql`1=1`}
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
    const body = await request.json();
    const { userId, requestType, startDate, endDate, durationDays, advanceAmount, reason } = body;

    if (!userId || !requestType || !reason) {
      return NextResponse.json({ message: 'البيانات غير مكتملة' }, { status: 400 });
    }

    const sDate = startDate || new Date().toISOString().slice(0, 10);
    const eDate = endDate || sDate;
    const days = durationDays ? parseInt(durationDays, 10) : 1;
    const amount = advanceAmount ? parseFloat(advanceAmount) : 0;

    // إدراج الطلب مع ملء العمودين القديم والجديد لضمان القراءة في كل الشاشات
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
        ${parseInt(userId, 10)},
        ${requestType},
        ${requestType},
        ${sDate}::date,
        ${eDate}::date,
        ${days},
        ${days},
        ${amount},
        ${reason},
        'PENDING',
        NOW()
      );
    `);

    // إرسال الإشعار التفاعلي لمديري النظام والـ HR
    try {
      const notifTitle =
        requestType === 'COMPLAINT'
          ? 'شكوى موظف جديدة'
          : requestType === 'ADVANCE'
          ? 'طلب سلفة مالية'
          : requestType === 'PERMISSION'
          ? 'طلب إذن جديد'
          : 'طلب إجازة جديد';

      const notifMsg = `تم تقديم ${notifTitle}: "${reason.slice(0, 50)}..."`;

      await db.execute(sql`
        INSERT INTO notifications (user_id, sender_id, title, message, type, link, is_read, created_at)
        SELECT id, ${parseInt(userId, 10)}, ${notifTitle}, ${notifMsg}, ${requestType}, '/admin/leave-requests', false, NOW()
        FROM users 
        WHERE (system_role = 'SUPER_ADMIN' OR job_role ILIKE '%مدير%' OR job_role ILIKE '%HR%')
          AND id != ${parseInt(userId, 10)};
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
