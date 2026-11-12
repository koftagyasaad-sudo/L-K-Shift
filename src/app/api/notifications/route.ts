import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { authorizeApi } from '@/lib/api-auth';
import { getSqlRows } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const authorization = await authorizeApi();
    if ('response' in authorization) return authorization.response;
    const userId = authorization.principal.id;

    const raw = await db.execute(sql`
      SELECT 
        id,
        user_id as "userId",
        sender_id as "senderId",
        title,
        message,
        COALESCE(type, 'GENERAL') as "type",
        COALESCE(link, '/admin/leave-requests') as "link",
        COALESCE(is_read, false) as "isRead",
        created_at as "createdAt"
      FROM notifications
      WHERE user_id = ${userId}
      ORDER BY id DESC
      LIMIT 30;
    `);

    const notifications = getSqlRows<Record<string, unknown>>(raw);
    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error('Notifications GET Error:', error);
    return NextResponse.json({ message: 'تعذر تحميل الإشعارات.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorization = await authorizeApi('notifications.send');
    if ('response' in authorization) return authorization.response;

    const body = await request.json();
    const { userId, senderId, title, message, type, link } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ message: 'بيانات الإشعار غير مكتملة' }, { status: 400 });
    }

    await db.execute(sql`
      INSERT INTO notifications (user_id, sender_id, title, message, type, link, is_read, created_at)
      VALUES (
        ${String(userId)},
        ${senderId ? String(senderId) : null},
        ${title},
        ${message},
        ${type || 'GENERAL'},
        ${link || null},
        false,
        NOW()
      );
    `);

    return NextResponse.json({ success: true, message: 'تم إرسال الإشعار بنجاح' });
  } catch (error) {
    console.error('Notifications POST Error:', error);
    return NextResponse.json({
      message: error instanceof Error ? error.message : 'فشل إرسال الإشعار',
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authorization = await authorizeApi();
    if ('response' in authorization) return authorization.response;

    const body = await request.json();
    const { notificationId, markAll } = body;
    const userId = authorization.principal.id;

    if (markAll && userId) {
      await db.execute(sql`
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = ${userId};
      `);
      return NextResponse.json({ success: true, message: 'تم تحديد جميع الإشعارات كمقروءة' });
    }

    if (notificationId) {
      await db.execute(sql`
        UPDATE notifications 
        SET is_read = true 
        WHERE id = ${parseInt(notificationId, 10)} AND user_id = ${userId};
      `);
      return NextResponse.json({ success: true, message: 'تم تحديث الإشعار' });
    }

    return NextResponse.json({ message: 'طلب غير محدد' }, { status: 400 });
  } catch (error) {
    console.error('Notifications PATCH Error:', error);
    return NextResponse.json({
      message: error instanceof Error ? error.message : 'فشل التحديث',
    }, { status: 500 });
  }
}
