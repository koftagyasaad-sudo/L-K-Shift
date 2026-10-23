import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const logId = String(id);

    if (!logId || logId.trim() === "") {
      return NextResponse.json(
        { success: false, error: "معرف سجل الحضور مطلوب" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { verificationStatus, status, notes } = body;

    const newStatus = verificationStatus || status || "approved";

    // 1. Check if the attendance log exists
    const [existingLog] = await db
      .select()
      .from(attendanceLogs)
      .where(eq(attendanceLogs.id, logId))
      .limit(1);

    if (!existingLog) {
      return NextResponse.json(
        { success: false, error: "سجل الحضور غير موجود بالنظام" },
        { status: 404 }
      );
    }

    // 2. Update the log status
    const [updatedLog] = await db
      .update(attendanceLogs)
      .set({
        verificationStatus: String(newStatus),
        notes: notes !== undefined ? String(notes) : existingLog.notes,
      })
      .where(eq(attendanceLogs.id, logId))
      .returning();

    return NextResponse.json({
      success: true,
      message: "تم تحديث حالة سجل الحضور بنجاح",
      data: updatedLog,
    });
  } catch (error) {
    console.error("Attendance review PATCH error:", error);
    const message =
      error instanceof Error ? error.message : "حدث خطأ أثناء تحديث حالة السجل";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request, context: RouteParams) {
  return PATCH(req, context);
}

export async function PUT(req: Request, context: RouteParams) {
  return PATCH(req, context);
}
