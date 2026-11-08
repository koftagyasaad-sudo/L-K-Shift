import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id') || searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'معرف المستخدم مفقود' }, { status: 400 });
    }

    const result = await db.execute(sql`
      SELECT 
        u.id,
        COALESCE(u.full_name_ar, u.name, 'موظف') as "fullName",
        COALESCE(u.full_name_en, '') as "fullNameEn",
        COALESCE(u.phone, '') as "phone",
        COALESCE(u.national_id, '') as "nationalId",
        COALESCE(u.address, '') as "address",
        COALESCE(u.job_role, u.role, 'موظف') as "role"
      FROM users u
      WHERE u.id = ${parseInt(userId, 10)}
      LIMIT 1;
    `);

    const usersList = Array.isArray(result) ? result : (result as any)?.rows || [];
    if (!usersList.length) {
      return NextResponse.json({ message: 'المستخدم غير موجود' }, { status: 404 });
    }

    return NextResponse.json(usersList[0], { status: 200 });
  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ message: 'فشل جلب البيانات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fullName, fullNameEn, phone, nationalId, address, currentPassword, newPassword } = body;

    if (!userId) {
      return NextResponse.json({ message: 'معرف المستخدم مفقود' }, { status: 400 });
    }

    const numericId = parseInt(userId, 10);

    // التحقق من كلمة المرور السابقة إن وجدت
    if (newPassword) {
      const userCheck = await db.execute(sql`
        SELECT id, password_hash, password FROM users WHERE id = ${numericId} LIMIT 1;
      `);
      const existing = Array.isArray(userCheck) ? userCheck : (userCheck as any)?.rows || [];
      if (existing.length > 0) {
        const storedPwd = existing[0].password_hash || existing[0].password;
        if (storedPwd && storedPwd !== currentPassword) {
          return NextResponse.json({ message: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
        }
      }
    }

    // تحديث البيانات الأساسية المتوافقة مع جدول users
    await db.execute(sql`
      UPDATE users
      SET
        full_name_ar = COALESCE(${fullName || null}, full_name_ar),
        full_name_en = COALESCE(${fullNameEn || null}, full_name_en),
        phone = COALESCE(${phone || null}, phone),
        national_id = COALESCE(${nationalId || null}, national_id),
        address = COALESCE(${address || null}, address),
        updated_at = NOW()
        ${newPassword ? sql`, password_hash = ${newPassword}` : sql``}
      WHERE id = ${numericId};
    `);

    return NextResponse.json({
      success: true,
      message: 'تم حفظ وتحديث بياناتك الشخصية بنجاح!',
    });
  } catch (error: any) {
    console.error('Profile POST error:', error);
    return NextResponse.json({ message: error?.message || 'فشل تحديث البيانات' }, { status: 500 });
  }
}
