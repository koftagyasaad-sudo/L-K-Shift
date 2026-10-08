import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceLogs, branches } from "@/db/schema";
import { eq } from "drizzle-orm";

// دالة حساب المسافة بين الإحداثيات بالأمتار (Haversine Formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // نصف قطر الأرض بالأمتار
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const userIdStr = formData.get("userId") as string;
    const branchIdStr = formData.get("branchId") as string;
    const type = formData.get("type") as "CHECK_IN" | "CHECK_OUT";
    const latStr = formData.get("latitude") as string;
    const lngStr = formData.get("longitude") as string;
    const mode = formData.get("mode") as string;
    const photo = formData.get("photo") as File | null;

    if (!userIdStr || !branchIdStr || !type || !latStr || !lngStr) {
      return NextResponse.json(
        { success: false, error: "جميع البيانات الأساسية مطلوبة" },
        { status: 400 }
      );
    }

    const userId = parseInt(userIdStr, 10);
    const branchId = parseInt(branchIdStr, 10);
    const userLat = parseFloat(latStr);
    const userLng = parseFloat(lngStr);

    // 1. جلب بيانات الفرع للتحقق من النطاق الجغرافي الجغرافي (Geofence)
    const branchList = await db
      .select()
      .from(branches)
      .where(eq(branches.id, branchId));

    if (branchList.length === 0) {
      return NextResponse.json(
        { success: false, error: "الفرع المحدّد غير موجود" },
        { status: 404 }
      );
    }

    const branch = branchList[0];
    const distanceMeter = calculateDistance(
      userLat,
      userLng,
      Number(branch.latitude),
      Number(branch.longitude)
    );

    // 2. التحقق الجغرافي السيرفري المزدوج بالأمتار
    if (distanceMeter > branch.geofenceRadius) {
      return NextResponse.json(
        {
          success: false,
          error: `تعديت النطاق المسموح! المسافة الحالية ${distanceMeter} متر (المسموح حتى ${branch.geofenceRadius} متر)`,
        },
        { status: 400 }
      );
    }

    // 3. تحويل الصورة إلى Data URL أو مسار حفظ (تخزين مؤقت/دائم)
    let photoUrl: string | null = null;
    if (photo) {
      const buffer = Buffer.from(await photo.arrayBuffer());
      photoUrl = `data:${photo.type};base64,${buffer.toString("base64")}`;
    }

    // 4. تسجيل الحضور أو الانصراف في داتابيز
    const now = new Date();

    if (type === "CHECK_IN") {
      const [newLog] = await db
        .insert(attendanceLogs)
        .values({
          userId,
          branchId,
          checkInTime: now,
          checkInLat: userLat.toString(),
          checkInLng: userLng.toString(),
          checkInPhotoUrl: photoUrl,
          checkInApprovalStatus: "AUTO_APPROVED",
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: "تم تسجيل الحضور بنجاح",
        data: newLog,
      });
    } else {
      // تسجيل انصراف
      const [updatedLog] = await db
        .insert(attendanceLogs)
        .values({
          userId,
          branchId,
          checkOutTime: now,
          checkOutLat: userLat.toString(),
          checkOutLng: userLng.toString(),
          checkOutPhotoUrl: photoUrl,
          checkOutApprovalStatus: "AUTO_APPROVED",
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: "تم تسجيل الانصراف بنجاح",
        data: updatedLog,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "حدث خطأ في السيرفر" },
      { status: 500 }
    );
  }
}
