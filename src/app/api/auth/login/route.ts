import { checkRateLimit, clearRateLimit, getClientIp } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSqlRows } from "@/lib/db";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(req: Request) {
  const rateLimitKey = `login:${getClientIp(req)}`;
  const rateLimit = checkRateLimit(rateLimitKey, 5, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { message: "تم تجاوز عدد محاولات تسجيل الدخول. يرجى الانتظار قبل إعادة المحاولة." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const body: unknown = await req.json();
    if (!isRecord(body)) {
      return NextResponse.json({ message: "بيانات الدخول غير صالحة" }, { status: 400 });
    }
    const phoneValue = typeof body.phone === "string" ? body.phone : body.username;
    const phone = typeof phoneValue === "string" ? phoneValue.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!phone || !password) {
      return NextResponse.json(
        { message: "يرجى إدخال رقم الهاتف وكلمة المرور" },
        { status: 400 }
      );
    }

    // استعلام SQL مباشر يتجاوز مشاكل تطابق Drizzle Schema ويقرأ من Neon مباشرة
    const result = await db.execute(sql`
      SELECT 
        id, 
        COALESCE(full_name_ar, '') as name,
        phone, 
        COALESCE(password_hash, '') as "passwordHash",
        is_active as "isActive"
      FROM users 
      WHERE phone = ${phone}
      LIMIT 1;
    `);

    const [user] = getSqlRows<{
      id: string;
      name: string;
      phone: string;
      passwordHash: string;
      isActive: boolean | null;
    }>(result);

    // 1. التحقق من وجود المستخدم
    if (!user) {
      return NextResponse.json(
        { message: "بيانات الدخول غير صحيحة", debug_reason: "USER_NOT_FOUND" },
        { status: 401 }
      );
    }

    // 2. التحقق من حالة التفعيل
    if (user.isActive === false) {
      return NextResponse.json(
        { message: "هذا الحساب معطل حالياً", debug_reason: "ACCOUNT_INACTIVE" },
        { status: 403 }
      );
    }

    // 3. التحقق من وجود الهاش في قاعدة البيانات
    if (!user.passwordHash) {
      return NextResponse.json(
        { message: "حساب المستخدم غير مهيأ بكلمة مرور", debug_reason: "NO_HASH_FOUND" },
        { status: 401 }
      );
    }

    // 4. مطابقة كلمة المرور مع الهاش الحقيقي
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { message: "بيانات الدخول غير صحيحة", debug_reason: "HASH_MISMATCH" },
        { status: 401 }
      );
    }

    // 5. حفظ الجلسة الرسمية في الكوكيز
    // Unsigned cookie removed for security; NextAuth signed JWT is used.
    clearRateLimit(rateLimitKey);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Login System Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
