import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 1. جلب إشعارات المستخدم الحالية
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'معرف المستخدم غير محدد' }, { status: 400 });
    }

    const raw = await db.execute(sql`
      SELECT 
        id,
        user_id as "userId",
        sender_id as "senderId",
        title,
        message,
        type,
        link,
        is_read as "isRead",
        created_at as "createdAt"
      FROM notifications
      WHERE user_id = ${parseInt(userId, 10)}
      ORDER BY id DESC
      LIMIT 25;
    `);

    const notifications = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    return NextResponse.json(notifications, { status: 200 });
  } catch (error: any) {
    console.error('Notifications GET Error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

// 2. إرسال إشعار جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, senderId, title, message, type, link } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ message: 'البيانات الأساسية للإشعار ناقصة' }, { status: 400 });
    }

    await db.execute(sql`
      INSERT INTO notifications (user_id, sender_id, title, message, type, link, is_read, created_at)
      VALUES (
        ${parseInt(userId, 10)},
        ${senderId ? parseInt(senderId, 10) : null},
        ${title},
        ${message},
        ${type || 'GENERAL'},
        ${link || null},
        false,
        NOW()
      );
    `);

    return NextResponse.json({ success: true, message: 'تم إرسال الإشعار بنجاح' });
  } catch (error: any) {
    console.error('Notifications POST Error:', error);
    return NextResponse.json({ message: error?.message || 'فشل إرسال الإشعار' }, { status: 500 });
  }
}

// 3. تحديد الإشعار كمقروء
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, userId, markAll } = body;

    if (markAll && userId) {
      await db.execute(sql`
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = ${parseInt(userId, 10)};
      `);
      return NextResponse.json({ success: true, message: 'تم تحديد الكل كمقروء' });
    }

    if (notificationId) {
      await db.execute(sql`
        UPDATE notifications 
        SET is_read = true 
        WHERE id = ${parseInt(notificationId, 10)};
      `);
      return NextResponse.json({ success: true, message: 'تم تحديث الإشعار' });
    }

    return NextResponse.json({ message: 'معرف غير محدد' }, { status: 400 });
  } catch (error: any) {
    console.error('Notifications PATCH Error:', error);
    return NextResponse.json({ message: error?.message || 'فشل التحديث' }, { status: 500 });
  }
}
