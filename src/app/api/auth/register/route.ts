import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fullName = (body.fullName || body.name || '').toString().trim();
    const phone = (body.phone || '').toString().trim();
    const password = (body.password || '').toString().trim();

    if (!fullName || !phone || !password) {
      return NextResponse.json(
        { message: 'الاسم الرباعي، رقم الهاتف، وكلمة المرور حقول مطلوبة' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'يجب ألا تقل كلمة المرور عن 6 خانات' },
        { status: 400 }
      );
    }

    // 1. التحقق من عدم تسجيل رقم الهاتف مسبقاً
    const checkUser = await db.execute(sql`
      SELECT id, full_name_ar as name FROM users WHERE phone = ${phone} LIMIT 1;
    `);
    const existing = Array.isArray(checkUser) ? checkUser : (checkUser as any)?.rows || [];

    if (existing.length > 0) {
      return NextResponse.json(
        { message: 'رقم الهاتف مسجل مسبقاً في المنظومة، يمكنك تسجيل الدخول مباشرة' },
        { status: 409 }
      );
    }

    // 2. إنشاء حساب الموظف برتبة مبدئية غير معينة
    const insertRaw = await db.execute(sql`
      INSERT INTO users (
        full_name_ar,
        full_name_en,
        name,
        phone,
        password,
        password_hash,
        job_role,
        role,
        system_role,
        primary_branch_id,
        is_active,
        is_onboarded,
        annual_leave_days,
        used_leave_days,
        monthly_salary,
        created_at,
        updated_at
      ) VALUES (
        ${fullName},
        ${fullName},
        ${fullName},
        ${phone},
        ${password},
        ${password},
        'موظف جديد',
        'موظف جديد',
        'EMPLOYEE',
        NULL,
        true,
        false,
        21,
        0,
        0,
        NOW(),
        NOW()
      )
      RETURNING id, full_name_ar as name, phone, job_role as role;
    `);

    const rows = Array.isArray(insertRaw) ? insertRaw : (insertRaw as any)?.rows || [];
    const newUser = rows[0];

    return NextResponse.json(
      {
        success: true,
        message: 'تم إنشاء حسابك بنجاح! سيتم إسناد الفرع والصلاحيات من قبل الإدارة.',
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { message: error?.message || 'حدث خطأ أثناء إنشاء الحساب', error: error?.message },
      { status: 500 }
    );
  }
}
