import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { hashPassword } from '@/lib/passwords';
import { meetsPasswordMinimum } from '@/lib/password-policy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ message: 'بيانات الطلب غير صالحة' }, { status: 400 });
    }

    const values = body as Record<string, unknown>;
    const cleanPhone = typeof values.phone === 'string' ? values.phone.trim() : '';
    const cleanToken = typeof values.resetToken === 'string' ? values.resetToken.trim() : '';
    const cleanPass = typeof values.newPassword === 'string' ? values.newPassword : '';

    if (!cleanPhone || !cleanToken || !cleanPass) {
      return NextResponse.json({ message: 'جميع الحقول مطلوبة لإعادة تعيين كلمة المرور' }, { status: 400 });
    }

    // التحقق الصارم من شروط الباسورد القوي
    if (!meetsPasswordMinimum(cleanPass)) {
      return NextResponse.json(
        { message: 'يجب أن تتكون كلمة المرور من 6 محارف على الأقل.' },
        { status: 400 }
      );
    }

    const hashedNewPassword = await hashPassword(cleanPass);

    const [updatedUser] = await db
      .update(users)
      .set({
        passwordHash: hashedNewPassword,
        resetOtp: null,
        resetOtpExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(users.phone, cleanPhone),
        eq(users.resetOtp, cleanToken),
        gt(users.resetOtpExpiresAt, new Date())
      ))
      .returning({ id: users.id });

    if (!updatedUser) {
      return NextResponse.json(
        { message: 'جلسة تغيير كلمة المرور منتهية الصلاحية، يرجى طلب كود OTP جديد.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم تعيين كلمة المرور الجديدة بنجاح! يمكنك الآن تسجيل الدخول بحسابك.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'حدث خطأ أثناء تحديث كلمة المرور.' }, { status: 500 });
  }
}
