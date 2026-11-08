import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('role') || 'موظف';

    const isHrOrSuperAdmin =
      userRole === 'SUPER_ADMIN' ||
      userRole === 'مدير النظام' ||
      userRole === 'HR' ||
      userRole === 'مسؤول موارد بشرية';

    let query;
    if (isHrOrSuperAdmin) {
      // الـ HR ومدير النظام يريان كافة الطلبات والشكاوى السرية
      query = sql`
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
          r.status,
          r.created_at as "createdAt"
        FROM leave_requests r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN branches b ON COALESCE(u.primary_branch_id, u.branch_id) = b.id
        ORDER BY r.id DESC;
      `;
    } else {
      // الموظف العادي ومدير الفرع: يتم استبعاد الشكاوى السرية ما لم تكن مرسلة من الموظف نفسه
      query = sql`
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
          r.status,
          r.created_at as "createdAt"
        FROM leave_requests r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN branches b ON COALESCE(u.primary_branch_id, u.branch_id) = b.id
        WHERE (r.request_type != 'COMPLAINT' OR r.user_id::text = ${userId || ''})
        ORDER BY r.id DESC;
      `;
    }

    const raw = await db.execute(query);
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

    // 1. تسجيل الطلب في قاعدة البيانات
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

    // 2. إرسال الإشعارات التفاعلية للمسؤولين
    const isComplaint = requestType === 'COMPLAINT';

    // إذا كانت شكوى: تُرسل فقط للمدير العام والـ HR. غير ذلك: تُرسل لمديري الفروع أيضاً.
    const recipientRoles = isComplaint
      ? sql`role IN ('SUPER_ADMIN', 'مدير النظام', 'HR', 'مسؤول موارد بشرية')`
      : sql`role IN ('SUPER_ADMIN', 'مدير النظام', 'HR', 'مدير فرع')`;

    const recipients = await db.execute(sql`
      SELECT id FROM users WHERE ${recipientRoles};
    `);
    const recipientRows = Array.isArray(recipients) ? recipients : (recipients as any)?.rows || [];

    const notifTitle = isComplaint ? '⚠️ شكوى سرية جديدة موجهة للموارد البشرية' : 'طلب موظف جديد بانتظار الاعتماد';
    const notifMsg = isComplaint
      ? `تم تقديم شكوى سرية من أحد الموظفين: "${reason.slice(0, 60)}..."`
      : `تم تقديم طلب (${requestType}) بانتظار مراجعتك واعتماده.`;
    const targetLink = isComplaint ? '/admin/leave-requests?tab=COMPLAINT' : '/admin/leave-requests';

    for (const r of recipientRows) {
      await db.execute(sql`
        INSERT INTO notifications (user_id, sender_id, title, message, type, link, is_read, created_at)
        VALUES (${r.id}, ${parseInt(userId, 10)}, ${notifTitle}, ${notifMsg}, ${isComplaint ? 'COMPLAINT' : 'REQUEST'}, ${targetLink}, false, NOW());
      `);
    }

    return NextResponse.json({ success: true, message: 'تم إرسال طلبك بنجاح' });
  } catch (error: any) {
    console.error('Requests POST Error:', error);
    return NextResponse.json({ message: error?.message || 'فشل إرسال الطلب' }, { status: 500 });
  }
}
