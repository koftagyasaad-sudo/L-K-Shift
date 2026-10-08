// src/app/api/attendance/check-in/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, attendanceLogs } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    // 1) التحقق من الجلسة
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    // 2) جلب بيانات المستخدم مع الحقل الصحيح branchId
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        branchId: users.branchId,
      })
      .from(users)
      .where(eq(users.id, Number(session.user.id)))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    // 3) التحقق من وجود فرع مرتبط بالمستخدم
    if (!user.branchId) {
      return NextResponse.json(
        { error: "لا يوجد فرع مرتبط بحسابك، تواصل مع الإدارة" },
        { status: 400 }
      );
    }

    // 4) التأكد إن المستخدم مش عامل تسجيل حضور مفتوح بالفعل (بدون check-out)
    const [openLog] = await db
      .select({ id: attendanceLogs.id })
      .from(attendanceLogs)
      .where(
        and(
          eq(attendanceLogs.userId, user.id),
          isNull(attendanceLogs.checkOutTime)
        )
      )
      .limit(1);

    if (openLog) {
      return NextResponse.json(
        { error: "لديك تسجيل حضور مفتوح بالفعل، يجب تسجيل الانصراف أولاً" },
        { status: 400 }
      );
    }

    // 5) تسجيل الحضور
    const [newLog] = await db
      .insert(attendanceLogs)
      .values({
        userId: user.id,
        branchId: user.branchId,
        workDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD
        checkInTime: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "تم تسجيل الحضور بنجاح",
        data: newLog,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الحضور" },
      { status: 500 }
    );
  }
}
