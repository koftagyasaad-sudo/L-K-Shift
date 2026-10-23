import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceLogs, branches, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      phone,
      branchId,
      latitude,
      longitude,
      selfieUrl,
      notes,
    } = body;

    if (!userId && !phone) {
      return NextResponse.json(
        { success: false, error: "معرف الموظف أو رقم الهاتف مطلوب" },
        { status: 400 }
      );
    }

    // 1. Find User
    let user = null;
    if (userId) {
      const res = await db
        .select()
        .from(users)
        .where(eq(users.id, String(userId)))
        .limit(1);
      if (res.length > 0) user = res[0];
    } else if (phone) {
      const res = await db
        .select()
        .from(users)
        .where(eq(users.phone, String(phone)))
        .limit(1);
      if (res.length > 0) user = res[0];
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "الموظف غير موجود بالنظام" },
        { status: 404 }
      );
    }

    // 2. Find Branch
    const targetBranchId = branchId || user.branchId;
    if (!targetBranchId) {
      return NextResponse.json(
        { success: false, error: "لم يتم تحديد أو تعيين فرع لهذا الموظف" },
        { status: 400 }
      );
    }

    const branchRes = await db
      .select()
      .from(branches)
      .where(eq(branches.id, String(targetBranchId)))
      .limit(1);

    if (branchRes.length === 0) {
      return NextResponse.json(
        { success: false, error: "الفرع المخصص غير موجود" },
        { status: 404 }
      );
    }

    const branch = branchRes[0];

    // 3. Geofence Verification
    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);
    const branchLat = parseFloat(branch.latitude || "0");
    const branchLon = parseFloat(branch.longitude || "0");

    if (isNaN(userLat) || isNaN(userLon)) {
      return NextResponse.json(
        { success: false, error: "إحداثيات الموقع الجغرافي غير صالحة" },
        { status: 400 }
      );
    }

    const distance = calculateDistanceMeters(userLat, userLon, branchLat, branchLon);
    const allowedRadius = branch.geofenceRadius || branch.radiusMeters || 100;
    const isWithinGeofence = distance <= allowedRadius;

    if (!isWithinGeofence) {
      return NextResponse.json(
        {
          success: false,
          error: `عذراً، أنت خارج نطاق الفرع الجغرافي. المسافة المباشرة: ${Math.round(
            distance
          )} متر (النطاق المسموح: ${allowedRadius} متر)`,
          distanceMeters: Math.round(distance),
          allowedRadius,
        },
        { status: 400 }
      );
    }

    // 4. Check Check-In Status (Must be currently checked in)
    const [latestLog] = await db
      .select()
      .from(attendanceLogs)
      .where(eq(attendanceLogs.userId, user.id))
      .orderBy(desc(attendanceLogs.timestamp))
      .limit(1);

    if (!latestLog || latestLog.type !== "check_in") {
      return NextResponse.json(
        {
          success: false,
          error: "لم تقم بتسجيل الحضور بعد لتتمكن من تسجيل الانصراف.",
        },
        { status: 400 }
      );
    }

    // 5. Create Check-Out Attendance Log
    const logId = crypto.randomUUID();
    const [newLog] = await db
      .insert(attendanceLogs)
      .values({
        id: logId,
        userId: user.id,
        branchId: branch.id,
        type: "check_out",
        timestamp: new Date(),
        latitude: String(latitude),
        longitude: String(longitude),
        distanceMeters: Math.round(distance),
        isWithinGeofence: true,
        selfieUrl: selfieUrl || null,
        verificationStatus: "approved",
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "تم تسجيل الانصراف بنجاح",
      data: newLog,
      distanceMeters: Math.round(distance),
    });
  } catch (error) {
    console.error("Check-out API error:", error);
    const message =
      error instanceof Error ? error.message : "حدث خطأ أثناء تسجيل الانصراف";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
