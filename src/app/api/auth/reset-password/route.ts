import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function hashPassword(password: string): string {
  const salt = 'LK_SHIFT_SECURE_SALT_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// فحص قوة كلمة المرور: 8 خانات، حرف كبير، حرف صغير، رقم، رمز خاص
function isPasswordStrong(pass: string): boolean {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  return strongRegex.test(pass);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, resetToken, newPassword } = body;

    const cleanPhone = (phone || '').trim();
    const cleanToken = (resetToken || '').trim();
    const cleanPass = (newPassword || '').trim();

    if (!cleanPhone || !cleanToken || !cleanPass) {
      return NextResponse.json({ message: 'جميع الحقول مطلوبة لإعادة تعيين كلمة المرور' }, { status: 400 });
    }

    // التحقق من صلاحية توكن إعادة التعيين
    const tokenCheck = await db.execute(sql`
      SELECT id FROM otp_verifications 
      WHERE phone = ${cleanPhone} 
        AND reset_token = ${cleanToken} 
        AND expires_at > NOW() - INTERVAL '15 minutes'
      LIMIT 1;
    `);

    const tokenRows = Array.isArray(tokenCheck) ? tokenCheck : (tokenCheck as any)?.rows || [];
    if (!tokenRows.length) {
      return NextResponse.json(
        { message: 'جلسة تغيير كلمة المرور منتهية الصلاحية، يرجى طلب كود OTP جديد.' },
        { status: 403 }
      );
    }

    // التحقق الصارم من شروط الباسورد القوي
    if (!isPasswordStrong(cleanPass)) {
      return NextResponse.json(
        {
          message: 'كلمة المرور غير مطابقة للشروط! يجب أن تتكون من 8 خانات على الأقل، وتحتوي على حرف كبير (Capital)، وحرف صغير (Small)، ورقم، ورمز خاص (مثل: @, #, $, %).',
        },
        { status: 400 }
      );
    }

    const hashedNewPassword = hashPassword(cleanPass);

    // تحديث الباسورد المشفر للمستخدم
    await db.execute(sql`
      UPDATE users 
      SET 
        password_hash = ${hashedNewPassword},
        updated_at = NOW() 
      WHERE phone = ${cleanPhone};
    `);

    // إبطال توكن إعادة التعيين
    await db.execute(sql`
      UPDATE otp_verifications 
      SET reset_token = NULL 
      WHERE phone = ${cleanPhone} AND reset_token = ${cleanToken};
    `);

    return NextResponse.json({
      success: true,
      message: 'تم تعيين كلمة المرور الجديدة بنجاح! يمكنك الآن تسجيل الدخول بحسابك.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: error?.message || 'فشل تحديث كلمة المرور' }, { status: 500 });
  }
}
