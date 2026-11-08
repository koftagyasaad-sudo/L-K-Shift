import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, phone, password } = body;

    if (!fullName || !phone || !password) {
      return NextResponse.json(
        { success: false, message: 'يرجى إدخال جميع البيانات المطلوبة' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();
    const cleanName = fullName.trim();

    // التحقق من عدم وجود حساب سابق بنفس رقم الهاتف
    const existing = await db.execute(sql`
      SELECT id FROM users WHERE phone = ${cleanPhone} LIMIT 1;
    `);
    const existingRows = Array.isArray(existing) ? existing : (existing as any)?.rows || [];
    if (existingRows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'رقم الهاتف مسجل بالفعل مسبقاً، يمكنك تسجيل الدخول مباشرة' },
        { status: 400 }
      );
    }

    // إدراج الموظف الجديد في جدول users
    const inserted = await db.execute(sql`
      INSERT INTO users (
        full_name_ar,
        phone,
        password_hash,
        system_role,
        job_role,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        ${cleanName},
        ${cleanPhone},
        ${password.trim()},
        'EMPLOYEE',
        'موظف',
        true,
        NOW(),
        NOW()
      ) RETURNING id;
    `);

    const newRows = Array.isArray(inserted) ? inserted : (inserted as any)?.rows || [];
    const newUserId = newRows[0]?.id;

    // إرسال إشعار فوري لمدير النظام ومسؤولي الـ HR فقط
    try {
      const managers = await db.execute(sql`
        SELECT id FROM users 
        WHERE system_role = 'SUPER_ADMIN' 
           OR job_role ILIKE '%مدير النظام%' 
           OR job_role ILIKE '%HR%' 
           OR job_role ILIKE '%موارد بشرية%';
      `);
      const managerRows = Array.isArray(managers) ? managers : (managers as any)?.rows || [];

      const notifTitle = 'تسجيل موظف جديد';
      const notifMsg = `قام الموظف (${cleanName}) برقم هاتف (${cleanPhone}) بإنشاء حساب جديد بالنظام.`;

      for (const m of managerRows) {
        await db.execute(sql`
          INSERT INTO notifications (user_id, sender_id, title, message, type, link, is_read, created_at)
          VALUES (
            ${m.id},
            ${newUserId || null},
            ${notifTitle},
            ${notifMsg},
            'GENERAL',
            '/admin/employees',
            false,
            NOW()
          );
        `);
      }
    } catch (notifErr) {
      console.warn('Notification for new registration skipped:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء حسابك بنجاح! يمكنك الآن تسجيل الدخول.',
    });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'حدث خطأ أثناء إنشاء الحساب' },
      { status: 500 }
    );
  }
}
