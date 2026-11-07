import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// 1. طلب إرسال كود التحقق
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    if (!phone) return NextResponse.json({ message: 'رقم الهاتف مطلوب' }, { status: 400 });

    const raw = await db.execute(sql`SELECT id FROM users WHERE phone = ${phone.trim()} LIMIT 1;`);
    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    if (!rows.length) {
      return NextResponse.json({ message: 'رقم الهاتف غير مسجل بالنظام' }, { status: 404 });
    }

    // توليد كود عشوائي مكون من 6 أرقام صالح لمدة 15 دقيقة
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await db.execute(sql`
      UPDATE users 
      SET reset_otp = ${otpCode}, reset_otp_expires_at = NOW() + INTERVAL '15 minutes'
      WHERE phone = ${phone.trim()};
    `);

    // هنا يتم استدعاء بوابة الـ SMS أو طباعة الكود للاستخدام الفوري
    console.log(`[PASSWORD RESET OTP for ${phone}]: ${otpCode}`);

    return NextResponse.json({
      success: true,
      message: 'تم إرسال كود التحقق بنجاح',
      debugCode: otpCode, // متاح للاختبار المباشر الفوري
    });
  } catch (error: any) {
    return NextResponse.json({ message: 'فشل إرسال الكود', error: error.message }, { status: 500 });
  }
}

// 2. التحقق من الكود وتعيين كلمة المرور الجديدة
export async function PUT(request: NextRequest) {
  try {
    const { phone, otp, newPassword } = await request.json();
    if (!phone || !otp || !newPassword) {
      return NextResponse.json({ message: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    const raw = await db.execute(sql`
      SELECT id FROM users 
      WHERE phone = ${phone.trim()} 
        AND reset_otp = ${otp.trim()} 
        AND reset_otp_expires_at > NOW()
      LIMIT 1;
    `);

    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    if (!rows.length) {
      return NextResponse.json({ message: 'كود التحقق غير صحيح أو انتهت صلاحيته' }, { status: 400 });
    }

    await db.execute(sql`
      UPDATE users 
      SET password_hash = ${newPassword.trim()}, reset_otp = NULL, reset_otp_expires_at = NULL
      WHERE id = ${rows[0].id};
    `);

    return NextResponse.json({ success: true, message: 'تم تعيين كلمة المرور الجديدة بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ message: 'فشل إعادة التعيين', error: error.message }, { status: 500 });
  }
}
