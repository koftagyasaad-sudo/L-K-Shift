import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { verifyPassword, hashPassword } from '@/lib/auth-security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = (body.phone || body.username || '').toString().trim();
    const password = (body.password || '').toString().trim();

    if (!phone || !password) {
      return NextResponse.json(
        { success: false, message: 'يرجى إدخال رقم الهاتف وكلمة المرور' },
        { status: 400 }
      );
    }

    // استرجاع المستخدم من قاعدة البيانات
    const userRaw = await db.execute(sql`
      SELECT 
        u.id,
        u.phone,
        COALESCE(u.full_name_ar, u.name, 'مستخدم') as name,
        COALESCE(u.password_hash, '') as password_hash,
        COALESCE(u.system_role, 'EMPLOYEE') as system_role,
        COALESCE(u.job_role, 'موظف') as job_role,
        u.primary_branch_id,
        b.name_ar as branch_name,
        u.is_active
      FROM users u
      LEFT JOIN branches b ON u.primary_branch_id = b.id
      WHERE u.phone = ${phone}
      LIMIT 1;
    `);

    const rows = Array.isArray(userRaw) ? userRaw : (userRaw as any)?.rows || [];
    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: 'رقم الهاتف أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    const user = rows[0];

    // التحقق من أن الحساب نشط
    if (user.is_active === false) {
      return NextResponse.json(
        { success: false, message: 'تم إيقاف هذا الحساب، يرجى مراجعة إدارة الموارد البشرية' },
        { status: 403 }
      );
    }

    // التحقق من كلمة المرور عبر محرك التشفير
    const { isValid, needsRehash } = verifyPassword(password, user.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'رقم الهاتف أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // إذا كان الحساب مسجلاً بكلمة مرور قديمة غير مشفرة، يتم تشفيرها وحفظها تلقائياً الآن
    if (needsRehash) {
      const secureHash = hashPassword(password);
      await db.execute(sql`
        UPDATE users 
        SET password_hash = ${secureHash}, updated_at = NOW() 
        WHERE id = ${user.id};
      `);
    }

    // تحديث تاريخ آخر ظهور للمستخدم
    await db.execute(sql`
      UPDATE users 
      SET last_login_at = NOW() 
      WHERE id = ${user.id};
    `);

    const userRole = user.system_role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : (user.job_role || 'موظف');
    const permissions = user.system_role === 'SUPER_ADMIN' ? ['*'] : ['attendance.submit', 'profile.edit'];

    return NextResponse.json(
      {
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: userRole,
          branchId: user.primary_branch_id,
          branchName: user.branch_name || 'الفرع الرئيسي',
          permissions,
          isOnboarded: true,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Login Auth Error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم أثناء تسجيل الدخول', error: error?.message },
      { status: 500 }
    );
  }
}
