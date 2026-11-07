import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth-security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fullName = (body.fullName || '').toString().trim();
    const phone = (body.phone || '').toString().trim();
    const password = (body.password || '').toString().trim();

    if (!fullName || !phone || !password) {
      return NextResponse.json(
        { success: false, message: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام' },
        { status: 400 }
      );
    }

    // التحقق من عدم تكرار رقم الموبايل
    const existing = await db.execute(sql`
      SELECT id FROM users WHERE phone = ${phone} LIMIT 1;
    `);
    const existingRows = Array.isArray(existing) ? existing : (existing as any)?.rows || [];
    if (existingRows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'رقم الهاتف مسجل بالفعل مسبقاً' },
        { status: 409 }
      );
    }

    // تشفير كلمة المرور عبر محرك التشفير
    const hashedPassword = hashPassword(password);

    // إضافة الموظف الجديد
    await db.execute(sql`
      INSERT INTO users (
        full_name_ar,
        name,
        phone,
        password_hash,
        system_role,
        job_role,
        verification_mode,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        ${fullName},
        ${fullName},
        ${phone},
        ${hashedPassword},
        'EMPLOYEE',
        'موظف',
        'QR_GPS',
        TRUE,
        NOW(),
        NOW()
      );
    `);

    return NextResponse.json(
      { success: true, message: 'تم إنشاء الحساب وتشفير بيانات الدخول بنجاح!' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Register API Error:', error);
    return NextResponse.json(
      { success: false, message: 'فشل إنشاء الحساب', error: error?.message },
      { status: 500 }
    );
  }
}
