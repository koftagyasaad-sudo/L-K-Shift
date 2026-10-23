import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // جلب التنبيهات الخاصة بالمستخدم مرتبة من الأحدث للأقدم
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt));

    return NextResponse.json({
      success: true,
      data: userNotifications,
    });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
