import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = (body.phone || body.username || "").trim();
    const password = body.password || "";

    if (!phone || !password) {
      return NextResponse.json(
        { message: "يرجى إدخال رقم الهاتف وكلمة المرور" },
        { status: 400 }
      );
    }

    // استعلام SQL مباشر يتجاوز مشاكل تطابق Drizzle Schema ويقرأ من Neon مباشرة
    const result: any = await db.execute(sql`
      SELECT 
        id, 
        COALESCE(name, '') as name,
        phone, 
        COALESCE(password_hash, password, '') as "passwordHash",
        is_active as "isActive"
      FROM users 
      WHERE phone = ${phone}
      LIMIT 1;
    `);

    const rows = Array.isArray(result) ? result : result?.rows || [];
    const user = rows[0];

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
    const cookieStore = await cookies();
    cookieStore.set(
      "auth_session",
      JSON.stringify({
        id: user.id,
        phone: user.phone,
        name: user.name,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // أسبوع
      }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    console.error("Login System Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ في الخادم", error: error.message },
      { status: 500 }
    );
  }
}