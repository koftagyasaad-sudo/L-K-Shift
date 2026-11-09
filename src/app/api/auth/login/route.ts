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

    // 1. جلب المستخدم من قاعدة بيانات Neon
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

    // 2. مطابقة كلمة المرور مع الهاش
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { message: "هذا الحساب معطل حالياً" },
        { status: 403 }
      );
    }

    // 3. إنشاء كوكي الجلسة
    const cookieStore = await cookies();
    cookieStore.set("auth_session", JSON.stringify({
      id: user.id,
      phone: user.phone,
      name: user.name,
      roleId: user.roleId,
      branchId: user.branchId,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // أسبوع
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        roleId: user.roleId,
      },
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ في السيرفر", error: error.message },
      { status: 500 }
    );
  }
}