import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import crypto from 'crypto';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// دالة إرسال رسالة SMS حقيقية إلى هاتف الموظف
async function sendSmsOtp(phone: string, otpCode: string): Promise<boolean> {
  const messageText = `كود التحقق الخاص بك لتطبيق L-K Shift هو: ${otpCode} (صالح لمدة 10 دقائق). لا تشارك هذا الرمز مع أي شخص.`;

  // 1. التكامل مع بوابة SMS Misr المصرية في حال وجود المفاتيح بمتغيرات البيئة
  if (process.env.SMSMISR_USERNAME && process.env.SMSMISR_PASSWORD) {
    try {
      const smsRes = await fetch('https://smsmisr.com/api/v2/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment: 1,
          username: process.env.SMSMISR_USERNAME,
          password: process.env.SMSMISR_PASSWORD,
          sender: process.env.SMSMISR_SENDER || 'LK-Shift',
          mobile: phone.startsWith('0') ? `2${phone}` : phone,
          template: messageText,
        }),
      });
      if (smsRes.ok) return true;
    } catch (e) {
      console.warn('SMSMisr dispatch failed:', e);
    }
  }

  // 2. التكامل مع بوابة Twilio في حال إعدادها
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const formattedPhone = phone.startsWith('+') ? phone : (phone.startsWith('0') ? `+2${phone}` : `+${phone}`);
      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: formattedPhone,
            From: process.env.TWILIO_PHONE_NUMBER,
            Body: messageText,
          }).toString(),
        }
      );
      if (twilioRes.ok) return true;
    } catch (e) {
      console.warn('Twilio dispatch failed:', e);
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(`forgot-password:${getClientIp(request)}`, 5, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { message: 'تم تجاوز عدد المحاولات. يرجى الانتظار قبل إعادة المحاولة.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ message: 'بيانات الطلب غير صالحة' }, { status: 400 });
    }

    const values = body as Record<string, unknown>;
    const action = values.action;
    const phone = typeof values.phone === 'string' ? values.phone.trim() : '';
    const otp = typeof values.otp === 'string' ? values.otp.trim() : '';

    if (!phone) {
      return NextResponse.json({ message: 'يرجى إدخال رقم الهاتف المسجل' }, { status: 400 });
    }

    // 1. إجراء إرسال كود الـ OTP في رسالة SMS
    if (action === 'SEND_OTP') {
      const [user] = await db
        .select({ id: users.id, phone: users.phone })
        .from(users)
        .where(eq(users.phone, phone))
        .limit(1);

      if (!user) {
        return NextResponse.json(
          { message: 'رقم الهاتف هذا غير مسجل لدينا في النظام، يرجى مراجعة الإدارة.' },
          { status: 404 }
        );
      }

      const otpCode = crypto.randomInt(100000, 1000000).toString();
      await db
        .update(users)
        .set({
          resetOtp: otpCode,
          resetOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        })
        .where(eq(users.id, user.id));

      if (!(await sendSmsOtp(user.phone, otpCode))) {
        await db
          .update(users)
          .set({ resetOtp: null, resetOtpExpiresAt: null })
          .where(and(eq(users.id, user.id), eq(users.resetOtp, otpCode)));

        return NextResponse.json(
          { message: 'تعذر إرسال رمز التحقق. خدمة الرسائل غير مهيأة، يرجى التواصل مع الإدارة.' },
          { status: 503 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'تم إرسال كود التحقق (OTP) في رسالة نصية قصيرة إلى رقم هاتفك.',
      });
    }

    // 2. إجراء مطابقة وتأكيد كود الـ OTP
    if (action === 'VERIFY_OTP') {
      if (!/^\d{6}$/.test(otp)) {
        return NextResponse.json({ message: 'يرجى إدخال كود التحقق المكون من 6 أرقام' }, { status: 400 });
      }

      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(
          eq(users.phone, phone),
          eq(users.resetOtp, otp),
          gt(users.resetOtpExpiresAt, new Date())
        ))
        .limit(1);

      if (!user) {
        return NextResponse.json(
          { message: 'كود التحقق منتهي الصلاحية أو غير موجود، يرجى طلب كود جديد.' },
          { status: 400 }
        );
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const [verifiedUser] = await db
        .update(users)
        .set({
          resetOtp: resetToken,
          resetOtpExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        })
        .where(and(
          eq(users.id, user.id),
          eq(users.resetOtp, otp),
          gt(users.resetOtpExpiresAt, new Date())
        ))
        .returning({ id: users.id });

      if (!verifiedUser) {
        return NextResponse.json(
          { message: 'كود التحقق منتهي الصلاحية أو غير صحيح، يرجى طلب كود جديد.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'تم التحقق من هويتك بنجاح!',
        resetToken,
      });
    }

    return NextResponse.json({ message: 'إجراء غير مدعوم' }, { status: 400 });
  } catch (error) {
    console.error('Forgot-password route error:', error);
    return NextResponse.json({ message: 'حدث خطأ أثناء تنفيذ طلب استعادة كلمة المرور.' }, { status: 500 });
  }
}
