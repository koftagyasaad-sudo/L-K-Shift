// src/app/api/attendance/check-out/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, branches, attendanceLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { put } from "@vercel/blob";
import { calculateDistanceMeters } from "@/lib/geo";
import { getCairoDateString } from "@/lib/date";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const formData = await request.formData();
  const photo = formData.get("photo") as File | null;
  const latRaw = formData.get("lat") as string | null;
  const lngRaw = formData.get("lng") as string | null;

  if (!photo) {
    return NextResponse.json({ error: "الصورة مطلوبة لتسجيل الانصراف" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.primaryBranchId) {
    return NextResponse.json({ error: "لا يوجد فرع مرتبط بحسابك" }, { status: 400 });
  }

  const [branch] = await db.select().from(branches).where(eq(branches.id, user.primaryBranchId)).limit(1);
  if (!branch) {
    return NextResponse.json({ error: "الفرع غير موجود" }, { status: 404 });
  }

  const todayStr = getCairoDateString();

  const [existing] = await db
    .select()
    .from(attendanceLogs)
    .where(and(eq(attendanceLogs.userId, userId), eq(attendanceLogs.workDate, todayStr)))
    .limit(1);

  if (!existing || !existing.checkInTime) {
    return NextResponse.json({ error: "لم تسجل حضورك اليوم بعد" }, { status: 400 });
  }

  if (existing.checkOutTime) {
    return NextResponse.json({ error: "تم تسجيل الانصراف بالفعل اليوم" }, { status: 400 });
  }

  let distance: number | null = null;
  let lat: number | null = null;
  let lng: number | null = null;
  let approvalStatus: "AUTO_APPROVED" | "PENDING_REVIEW" = "PENDING_REVIEW";

  if (latRaw && lngRaw) {
    const parsedLat = Number(latRaw);
    const parsedLng = Number(lngRaw);
    if (!Number.isNaN(parsedLat) && !Number.isNaN(parsedLng)) {
      lat = parsedLat;
      lng = parsedLng;
      distance = calculateDistanceMeters(lat, lng, branch.latitude, branch.longitude);
      if (distance <= branch.geofenceRadius) {
        approvalStatus = "AUTO_APPROVED";
      }
    }
  }

  const photoBuffer = await photo.arrayBuffer();
  const fileName = `attendance/${userId}/${todayStr}-checkout-${Date.now()}.jpg`;
  const blob = await put(fileName, photoBuffer, {
    access: "public",
    contentType: photo.type || "image/jpeg",
  });

  const checkOutTime = new Date();
  const workedMinutes = Math.max(
    Math.round((checkOutTime.getTime() - new Date(existing.checkInTime).getTime()) / 60000),
    0
  );

  await db
    .update(attendanceLogs)
    .set({
      checkOutTime,
      checkOutLat: lat,
      checkOutLng: lng,
      checkOutDistance: distance,
      checkOutMethod: "GPS",
      checkOutPhotoUrl: blob.url,
      checkOutApprovalStatus: approvalStatus,
      actualWorkedMinutes: workedMinutes,
    })
    .where(eq(attendanceLogs.id, existing.id));

  return NextResponse.json({
    success: true,
    approvalStatus,
    distance: distance !== null ? Math.round(distance) : null,
    allowedRadius: branch.geofenceRadius,
    workedMinutes,
  });
}
