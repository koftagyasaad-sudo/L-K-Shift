import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json(
        { message: "يرجى إدخال رقم الهاتف وكلمة المرور" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();

    // البحث عن المستخدم برقم الهاتف
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.phone, cleanPhone))
      .limit(1);

    const user = userRecords[0];

    if (!user) {
      return NextResponse.json(
        { message: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    // فحص كلمة المرور مع الحقل الفعلي
    const passwordToCompare = (user as any).passwordHash || (user as any).password;
    if (!passwordToCompare) {
      return NextResponse.json(
        { message: "حساب المستخدم غير مهيأ بكلمة مرور" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, passwordToCompare);
    if (!isMatch) {
      return NextResponse.json(
        { message: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    if ((user as any).isActive === false) {
      return NextResponse.json(
        { message: "هذا الحساب معطل حالياً" },
        { status: 403 }
      );
    }

    // حفظ الجلسة
    const cookieStore = await cookies();
    cookieStore.set(
      "auth_session",
      JSON.stringify({
        id: user.id,
        phone: user.phone,
        name: (user as any).fullNameAr || (user as any).name || "Admin",
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: (user as any).fullNameAr || (user as any).name || "Admin",
        phone: user.phone,
      },
    });
  } catch (error: any) {
    console.error("Login Route Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ داخلي في الخادم", error: error.message },
      { status: 500 }
    );
  }
}