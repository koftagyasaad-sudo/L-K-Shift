import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { hashPassword, verifyPassword } from "@/lib/passwords";

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "بيانات تسجيل الدخول غير صالحة" },
        { status: 400 }
      );
    }

    const values = body as Record<string, unknown>;
    const phone = typeof values.phone === "string" ? values.phone.trim() : "";
    const password = typeof values.password === "string" ? values.password : "";

    if (!phone || !password) {
      return NextResponse.json(
        { message: "يرجى إدخال رقم الهاتف وكلمة المرور" },
        { status: 400 }
      );
    }

    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    const user = userRecords[0];

    if (!user) {
      return NextResponse.json(
        { message: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { message: "حساب المستخدم غير مهيأ بكلمة مرور" },
        { status: 401 }
      );
    }

    const verification = await verifyPassword(password, user.passwordHash);
    if (!verification.isValid) {
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

    if (verification.needsRehash) {
      await db
        .update(users)
        .set({ passwordHash: await hashPassword(password), updatedAt: new Date() })
        .where(eq(users.id, user.id));
    }

    const name = user.fullNameAr || "Admin";

    // حفظ الجلسة
    const cookieStore = await cookies();
    cookieStore.set(
      "auth_session",
      JSON.stringify({
        id: user.id,
        phone: user.phone,
        name,
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
        name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Login Route Error:", error);
    return NextResponse.json(
      { message: "حدث خطأ داخلي في الخادم" },
      { status: 500 }
    );
  }
}