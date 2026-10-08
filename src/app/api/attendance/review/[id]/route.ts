import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { attendanceLogs, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح (Unauthorized)" }, { status: 401 });
    }

    const reviewerId = Number(session.user.id);
    const { id } = await params;
    const logId = Number(id);

    if (isNaN(logId)) {
      return NextResponse.json({ error: "معرف السجل غير صالح" }, { status: 400 });
    }

    const body = await request.json();
    const { type, decision, notes } = body as {
      type: "checkIn" | "checkOut";
      decision: "APPROVED" | "REJECTED";
      notes?: string;
    };

    if (!["checkIn", "checkOut"].includes(type) || !["APPROVED", "REJECTED"].includes(decision)) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }

    // التحقق من وجود السجل في قاعدة البيانات
    const [log] = await db
      .select()
      .from(attendanceLogs)
      .where(eq(attendanceLogs.id, logId))
      .limit(1);

    if (!log) {
      return NextResponse.json({ error: "السجل غير موجود" }, { status: 404 });
    }

    // إعداد البيانات المراد تحديثها بناءً على نوع الحركة (حضور / انصراف)
    const updateData =
      type === "checkIn"
        ? {
            checkInApprovalStatus: decision,
            notes: notes ?? log.notes ?? null,
          }
        : {
            checkOutApprovalStatus: decision,
            notes: notes ?? log.notes ?? null,
          };

    await db
      .update(attendanceLogs)
      .set(updateData)
      .where(eq(attendanceLogs.id, logId));

    return NextResponse.json({
      success: true,
      message: "تم تحديث حالة المراجعة بنجاح",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء التحديث" },
      { status: 500 }
    );
  }
}
