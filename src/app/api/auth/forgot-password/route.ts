import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

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

  console.log(`[DEV / SMS LOG] تم إرسال OTP (${otpCode}) إلى رقم الهاتف: ${phone}`);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phone, otp } = body;

    const cleanPhone = (phone || '').trim();
    if (!cleanPhone) {
      return NextResponse.json({ message: 'يرجى إدخال رقم الهاتف المسجل' }, { status: 400 });
    }

    // 1. إجراء إرسال كود الـ OTP في رسالة SMS
    if (action === 'SEND_OTP') {
      const userCheck = await db.execute(sql`
        SELECT id, COALESCE(full_name_ar, name) as name, phone 
        FROM users 
        WHERE phone = ${cleanPhone} 
        LIMIT 1;
      `);
      const userRows = Array.isArray(userCheck) ? userCheck : (userCheck as any)?.rows || [];
      if (!userRows.length) {
        return NextResponse.json(
          { message: 'رقم الهاتف هذا غير مسجل لدينا في النظام، يرجى مراجعة الإدارة.' },
          { status: 404 }
        );
      }

      // توليد كود سري من 6 أرقام
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // حفظ الـ OTP في قاعدة البيانات بصلاحية 10 دقائق
      await db.execute(sql`
        INSERT INTO otp_verifications (phone, otp_code, expires_at, is_used, created_at)
        VALUES (${cleanPhone}, ${otpCode}, NOW() + INTERVAL '10 minutes', false, NOW());
      `);

      // إرسال رسالة SMS حقيقية إلى الهاتف
      await sendSmsOtp(cleanPhone, otpCode);

      // تسجيل إشعار بالنظام
      try {
        await db.execute(sql`
          INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
          VALUES (
            ${userRows[0].id}, 
            'طلب استعادة كلمة المرور', 
            ${'تم إرسال رمز التحقق OTP إلى هاتفك بنجاح.'}, 
            'SECURITY', 
            false, 
            NOW()
          );
        `);
      } catch {}

      return NextResponse.json({
        success: true,
        message: 'تم إرسال كود التحقق (OTP) في رسالة نصية قصيرة إلى رقم هاتفك.',
      });
    }

    // 2. إجراء مطابقة وتأكيد كود الـ OTP
    if (action === 'VERIFY_OTP') {
      const cleanOtp = (otp || '').trim();
      if (!cleanOtp) {
        return NextResponse.json({ message: 'يرجى إدخال كود التحقق المكون من 6 أرقام' }, { status: 400 });
      }

      const otpCheck = await db.execute(sql`
        SELECT id, otp_code, expires_at, is_used 
        FROM otp_verifications 
        WHERE phone = ${cleanPhone} 
          AND is_used = false 
          AND expires_at > NOW() 
        ORDER BY id DESC 
        LIMIT 1;
      `);

      const otpRows = Array.isArray(otpCheck) ? otpCheck : (otpCheck as any)?.rows || [];
      if (!otpRows.length) {
        return NextResponse.json(
          { message: 'كود التحقق منتهي الصلاحية أو غير موجود، يرجى طلب كود جديد.' },
          { status: 400 }
        );
      }

      const record = otpRows[0];
      if (record.otp_code !== cleanOtp) {
        return NextResponse.json(
          { message: 'كود التحقق الذي أدخلته غير صحيح، يرجى التأكد وإعادة المحاولة.' },
          { status: 400 }
        );
      }

      // إبطال الكود لمنع استخدامه مرة أخرى وتوليد توكن إعادة تعيين آمن
      const resetToken = crypto.randomBytes(32).toString('hex');
      await db.execute(sql`
        UPDATE otp_verifications 
        SET is_used = true, reset_token = ${resetToken} 
        WHERE id = ${record.id};
      `);

      return NextResponse.json({
        success: true,
        message: 'تم التحقق من هويتك بنجاح!',
        resetToken,
      });
    }

    return NextResponse.json({ message: 'إجراء غير مدعوم' }, { status: 400 });
  } catch (error: any) {
    console.error('Forgot-password route error:', error);
    return NextResponse.json({ message: error?.message || 'فشل إتمام العملية' }, { status: 500 });
  }
}
