// src/app/api/admin/reset-database/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, branches, customRoles, shiftTemplates, users } from "@/db/schema";
import { ensureDemoLoginUser, ensureSeedData } from "@/db/seed";

export async function POST(request: Request) {
  const token = request.headers.get("x-reset-token");

  if (!process.env.DB_RESET_TOKEN || token !== process.env.DB_RESET_TOKEN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // الترتيب مهم بسبب الـ Foreign Keys:
    // 1) حذف السجلات اللي مش مرتبطة بـ cascade تلقائي
    await db.delete(auditLogs);

    // 2) حذف المستخدمين (سيحذف تلقائيًا عبر cascade: الحضور، الورديات،
    //    الإجازات، الإشعارات، الأجهزة، صلاحيات الفروع، الأدوار المخصصة)
    await db.delete(users);

    // 3) حذف الجداول المستقلة المتبقية
    await db.delete(customRoles);
    await db.delete(shiftTemplates);

    // 4) حذف كل الفروع القديمة
    await db.delete(branches);

    // 5) إعادة الزرع: 4 فروع جديدة + حساب admin
    await ensureSeedData();
    await ensureDemoLoginUser();

    return NextResponse.json({
      success: true,
      message: "تم تصفير قاعدة البيانات بنجاح. سجّل الدخول بـ phone: admin / password: 123",
    });
  } catch (error) {
    console.error("[RESET_DATABASE_ERROR]", error);
    return NextResponse.json(
      { error: "Reset failed", details: String(error) },
      { status: 500 },
    );
  }
}
