import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceLogs, users } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");
    const phoneParam = searchParams.get("phone");

    let targetUserId: string | null = null;

    if (userIdParam) {
      targetUserId = String(userIdParam);
    } else if (phoneParam) {
      const userRes = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.phone, String(phoneParam)))
        .limit(1);

      if (userRes.length > 0) {
        targetUserId = String(userRes[0].id);
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "معرف الموظف أو رقم الهاتف مطلوب" },
        { status: 400 }
      );
    }

    // حساب نطاق بداية ونهاية اليوم الحالي
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // جلب سجلات اليوم للموظف
    const logs = await db
      .select()
      .from(attendanceLogs)
      .where(
        and(
          eq(attendanceLogs.userId, targetUserId),
          gte(attendanceLogs.timestamp, startOfToday),
          lte(attendanceLogs.timestamp, endOfToday)
        )
      )
      .orderBy(desc(attendanceLogs.timestamp));

    const lastCheckIn = logs.find((l) => l.type === "check_in") || null;
    const lastCheckOut = logs.find((l) => l.type === "check_out") || null;
    const isCheckedIn = logs.length > 0 && logs[0].type === "check_in";

    return NextResponse.json({
      success: true,
      data: {
        logs,
        lastCheckIn,
        lastCheckOut,
        isCheckedIn,
      },
      record: logs[0] || null, // للتوافق مع الطلبات السابقة
    });
  } catch (error) {
    console.error("Attendance today API error:", error);
    const message =
      error instanceof Error ? error.message : "حدث خطأ أثناء جلب سجل اليوم";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
