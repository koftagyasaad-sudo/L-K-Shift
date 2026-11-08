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
        r.request_type as "requestType",
        r.start_date as "startDate",
        r.end_date as "endDate",
        COALESCE(r.duration_days, 1) as "durationDays",
        COALESCE(r.advance_amount, 0) as "advanceAmount",
        r.reason,
        COALESCE(r.status, 'PENDING') as "status",
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

    const inserted = await db.execute(sql`
      INSERT INTO leave_requests (
        user_id,
        request_type,
        start_date,
        end_date,
        duration_days,
        advance_amount,
        reason,
        status,
        created_at
      ) VALUES (
        ${parseInt(userId, 10)},
        ${requestType},
        ${startDate || null},
        ${endDate || null},
        ${durationDays ? parseInt(durationDays, 10) : 1},
        ${advanceAmount ? parseFloat(advanceAmount) : 0},
        ${reason},
        'PENDING',
        NOW()
      ) RETURNING id;
    `);

    // إرسال الإشعار للمسؤولين مع حماية شاملة من نقص الأعمدة
    try {
      const notifTitle = requestType === 'COMPLAINT' ? 'شكوى موظف جديدة' : 'طلب موظف جديد';
      const notifMsg = `تم استلام ${requestType === 'COMPLAINT' ? 'شكوى' : 'طلب'} جديد من أحد الموظفين: ${reason.slice(0, 50)}`;

      await db.execute(sql`
        INSERT INTO notifications (user_id, title, message, is_read, link, created_at)
        SELECT id, ${notifTitle}, ${notifMsg}, false, '/admin/leave-requests', NOW()
        FROM users WHERE role IN ('SUPER_ADMIN', 'مدير النظام', 'HR', 'مدير فرع') AND id != ${parseInt(userId, 10)};
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
