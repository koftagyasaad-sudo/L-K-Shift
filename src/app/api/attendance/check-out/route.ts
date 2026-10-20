import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceLogs, branches, users } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { put } from "@vercel/blob";

function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) *
      Math.cos(lat2 * rad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, latitude, longitude, imageBase64 } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "معرف الموظف مطلوب" },
        { status: 400 }
      );
    }

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: "الموقع الجغرافي (GPS) مطلوب لإتمام التسجيل" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "الموظف غير موجود بالنظام" },
        { status: 404 }
      );
    }

    const [activeLog] = await db
      .select()
      .from(attendanceLogs)
      .where(and(eq(attendanceLogs.userId, userId), isNull(attendanceLogs.checkOut)))
      .limit(1);

    if (!activeLog) {
      return NextResponse.json(
        { success: false, error: "لا يوجد تسجيل حضور نشط لهذا الموظف" },
        { status: 400 }
      );
    }

    const branchId = activeLog.branchId || user.branchId;
    let distance: number | null = null;

    if (branchId) {
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);

      if (branch) {
        const branchLat = parseFloat(branch.latitude);
        const branchLng = parseFloat(branch.longitude);
        const userLat = parseFloat(String(latitude));
        const userLng = parseFloat(String(longitude));

        if (Number.isFinite(userLat) && Number.isFinite(userLng)) {
          distance = calculateDistanceMeters(userLat, userLng, branchLat, branchLng);
          const maxAllowedRadius = branch.radiusMeters || branch.geofenceRadius || 100;

          if (distance > maxAllowedRadius) {
            return NextResponse.json(
              {
                success: false,
                error: `أنت خارج النطاق المسموح للفرع عند الانصراف. المسافة: ${Math.round(distance)} متر، الحد المسموح: ${maxAllowedRadius} متر`,
                distance: Math.round(distance),
                maxAllowedRadius,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    let selfieUrl: string | null = null;
    if (imageBase64) {
      try {
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          const buffer = Buffer.from(
            imageBase64.replace(/^data:image\/\w+;base64,/, ""),
            "base64"
          );
          const filename = `attendance/check-out-${userId}-${Date.now()}.jpg`;
          const blob = await put(filename, buffer, {
            access: "public",
            contentType: "image/jpeg",
          });
          selfieUrl = blob.url;
        } else {
          selfieUrl = imageBase64;
        }
      } catch (uploadError) {
        console.error("Selfie checkout upload failed, fallback to raw base64:", uploadError);
        selfieUrl = imageBase64;
      }
    }

    const now = new Date();
    const [updatedLog] = await db
      .update(attendanceLogs)
      .set({
        checkOut: now,
        checkOutLatitude: String(latitude),
        checkOutLongitude: String(longitude),
        checkOutSelfieUrl: selfieUrl,
        updatedAt: now,
      })
      .where(eq(attendanceLogs.id, activeLog.id))
      .returning();

    return NextResponse.json({
      success: true,
      message: "تم تسجيل الانصراف بنجاح",
      data: updatedLog,
      distance: distance !== null ? Math.round(distance) : null,
    });
  } catch (error) {
    console.error("Check-out route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "فشل في تسجيل الانصراف",
      },
      { status: 500 }
    );
  }
}
