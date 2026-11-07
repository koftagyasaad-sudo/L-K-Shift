import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// 1. جلب الطلبات (للموظف أو للإدارة)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let query;

    if (userId) {
      // جلب طلبات موظف محدد
      query = sql`
        SELECT 
          lr.id,
          lr.user_id as "userId",
          COALESCE(u.full_name_ar, u.name, 'موظف') as "userName",
          COALESCE(lr.leave_type, lr.request_type, 'ANNUAL') as "requestType",
          TO_CHAR(lr.start_date, 'YYYY-MM-DD') as "startDate",
          TO_CHAR(lr.end_date, 'YYYY-MM-DD') as "endDate",
          COALESCE(lr.duration_days, lr.total_days, 1) as "durationDays",
          COALESCE(lr.advance_amount, 0) as "advanceAmount",
          lr.reason,
          COALESCE(lr.final_status, lr.status::text, 'PENDING') as status,
          COALESCE(lr.rejection_reason, lr.rejection_notes, '') as "rejectionReason",
          lr.created_at as "createdAt"
        FROM leave_requests lr
        LEFT JOIN users u ON lr.user_id = u.id
        WHERE lr.user_id::text = ${userId} OR CAST(lr.user_id AS TEXT) = ${userId}
        ORDER BY lr.created_at DESC;
      `;
    } else {
      // جلب جميع الطلبات للوحة الإدارة
      query = sql`
        SELECT 
          lr.id,
          lr.user_id as "userId",
          COALESCE(u.full_name_ar, u.name, 'موظف') as "userName",
          u.phone as "userPhone",
          COALESCE(b.name_ar, 'الفرع الرئيسي') as "branchName",
          COALESCE(lr.leave_type, lr.request_type, 'ANNUAL') as "requestType",
          TO_CHAR(lr.start_date, 'YYYY-MM-DD') as "startDate",
          TO_CHAR(lr.end_date, 'YYYY-MM-DD') as "endDate",
          COALESCE(lr.duration_days, lr.total_days, 1) as "durationDays",
          COALESCE(lr.advance_amount, 0) as "advanceAmount",
          lr.reason,
          COALESCE(lr.final_status, lr.status::text, 'PENDING') as status,
          COALESCE(lr.rejection_reason, lr.rejection_notes, '') as "rejectionReason",
          lr.created_at as "createdAt"
        FROM leave_requests lr
        LEFT JOIN users u ON lr.user_id = u.id
        LEFT JOIN branches b ON u.primary_branch_id = b.id
        ORDER BY lr.created_at DESC;
      `;
    }

    const raw = await db.execute(query);
    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];

    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    console.error('Leave requests GET error:', error);
    return NextResponse.json({ message: 'فشل جلب الطلبات', error: error?.message }, { status: 500 });
  }
}

// 2. إرسال طلب جديد من الموظف
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, requestType, startDate, endDate, durationDays, advanceAmount, reason } = body;

    if (!userId || !requestType || !startDate) {
      return NextResponse.json({ message: 'البيانات الأساسية للطلب مطلوبة' }, { status: 400 });
    }

    await db.execute(sql`
      INSERT INTO leave_requests (
        user_id,
        leave_type,
        request_type,
        start_date,
        end_date,
        duration_days,
        total_days,
        advance_amount,
        reason,
        status,
        final_status,
        created_at
      ) VALUES (
        ${userId},
        ${requestType},
        ${requestType},
        ${startDate}::date,
        ${endDate || startDate}::date,
        ${durationDays || 1},
        ${durationDays || 1},
        ${advanceAmount || 0},
        ${reason || ''},
        'PENDING',
        'PENDING',
        NOW()
      );
    `);

    return NextResponse.json({ success: true, message: 'تم إرسال طلبك بنجاح وفي انتظار مراجعة الإدارة' }, { status: 201 });
  } catch (error: any) {
    console.error('Leave request POST error:', error);
    return NextResponse.json({ message: 'فشل إرسال الطلب', error: error?.message }, { status: 500 });
  }
}

// 3. اعتماد أو رفض الطلب من قبل الإدارة
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, status, rejectionReason, reviewerId } = body;

    if (!requestId || !status) {
      return NextResponse.json({ message: 'معرف الطلب والحالة مطلوبان' }, { status: 400 });
    }

    if (status === 'REJECTED') {
      await db.execute(sql`
        UPDATE leave_requests
        SET 
          status = 'REJECTED',
          final_status = 'REJECTED',
          rejection_reason = ${rejectionReason || 'لم يتم تحديد سبب الرفض'},
          rejection_notes = ${rejectionReason || 'لم يتم تحديد سبب الرفض'},
          approved_by = ${reviewerId || null}
        WHERE id = ${requestId};
      `);
    } else if (status === 'APPROVED') {
      await db.execute(sql`
        UPDATE leave_requests
        SET 
          status = 'APPROVED',
          final_status = 'APPROVED',
          rejection_reason = NULL,
          rejection_notes = NULL,
          approved_by = ${reviewerId || null}
        WHERE id = ${requestId};
      `);
    }

    return NextResponse.json({ success: true, message: 'تم تحديث حالة الطلب بنجاح' });
  } catch (error: any) {
    console.error('Leave request PUT error:', error);
    return NextResponse.json({ message: 'فشل تحديث حالة الطلب', error: error?.message }, { status: 500 });
  }
}
