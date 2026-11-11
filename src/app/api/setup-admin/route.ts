import { sql } from 'drizzle-orm';
import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { branches, users } from "@/db/schema";
import { hashPassword } from "@/lib/passwords";
import { meetsPasswordMinimum } from "@/lib/password-policy";

export async function POST(request: NextRequest) {
  const setupToken = process.env.SETUP_ADMIN_TOKEN;
  const providedToken = request.headers.get("x-setup-token") || "";
  if (!setupToken) {
    return NextResponse.json({ message: "المسار معطل." }, { status: 404 });
  }
  const expected = Buffer.from(setupToken);
  const provided = Buffer.from(providedToken);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 403 });
  }

  try {
    // [SECURITY LOCK] منع استدعاء التهيئة إذا وجد مدير عام مسجل مسبقاً
    try {
      const existingSuperAdmin = await db.execute(sql`SELECT id FROM users WHERE system_role = 'SUPER_ADMIN' LIMIT 1;`);
      const rows = Array.isArray(existingSuperAdmin) ? existingSuperAdmin : (existingSuperAdmin as any)?.rows || [];
      if (rows.length > 0) {
        return NextResponse.json(
          { message: "تم قفل مسار التهيئة أمنياً؛ النظام يحتوي على مدير عام مسبقاً." /* admin_lock_activated */ },
          { status: 403 }
        );
      }
    } catch (lockErr) {
      console.error("Setup lock check error:", lockErr);
    }

    const [existingAdmin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.systemRole, "SUPER_ADMIN"))
      .limit(1);
    if (existingAdmin) {
      return NextResponse.json({ message: "حساب المدير العام موجود بالفعل." }, { status: 409 });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ message: "بيانات المدير غير صالحة." }, { status: 400 });
    }
    const values = body as Record<string, unknown>;
    const phone = typeof values.phone === "string" ? values.phone.trim() : "";
    const password = typeof values.password === "string" ? values.password : "";
    const fullNameAr = typeof values.fullNameAr === "string" && values.fullNameAr.trim()
      ? values.fullNameAr.trim()
      : "Admin";
    if (!phone || !meetsPasswordMinimum(password)) {
      return NextResponse.json(
        { message: "رقم الهاتف وكلمة مرور من 6 محارف على الأقل مطلوبان." },
        { status: 400 }
      );
    }

    let [branch] = await db.select({ id: branches.id }).from(branches).limit(1);
    if (!branch) {
      [branch] = await db
        .insert(branches)
        .values({
          nameAr: "الإدارة الرئيسية",
          nameEn: "Main Management",
          latitude: 30.0444,
          longitude: 31.2357,
          geofenceRadius: 500,
        })
        .returning({ id: branches.id });
    }

    await db.insert(users).values({
      fullNameAr,
      phone,
      passwordHash: await hashPassword(password),
      systemRole: "SUPER_ADMIN",
      jobRole: "مدير النظام",
      primaryBranchId: branch.id,
      isActive: true,
    });

    return NextResponse.json({ success: true, message: "تم إنشاء حساب المدير العام." }, { status: 201 });
  } catch (error) {
    console.error("Admin setup error:", error);
    return NextResponse.json({ message: "تعذر إنشاء حساب المدير العام." }, { status: 500 });
  }
}
