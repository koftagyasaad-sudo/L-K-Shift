import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    const sessionUserEmail = session?.user?.email;
    const sessionUserName = session?.user?.name;

    let userId: string | null = null;

    if (sessionUserEmail) {
      const userRes = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, sessionUserEmail))
        .limit(1);

      if (userRes.length > 0) {
        userId = String(userRes[0].id);
      }
    }

    if (!userId && sessionUserName) {
      const userRes = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.phone, sessionUserName))
        .limit(1);

      if (userRes.length > 0) {
        userId = String(userRes[0].id);
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "غير مصرح - تعذر تحديد الموظف" },
        { status: 401 }
      );
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return NextResponse.json({
      success: true,
      message: "تم تحديد جميع التنبيهات كمقروءة",
    });
  } catch (error) {
    console.error("POST /api/notifications/mark-all-read error:", error);
    const message =
      error instanceof Error ? error.message : "حدث خطأ أثناء تحديث التنبيهات";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  return POST(req);
}

export async function PATCH(req: Request) {
  return POST(req);
}
