// src/app/api/attendance/check-in/route.ts

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
    return NextResponse.json({ error: "الصورة مطلوبة لتسجيل الحضور" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.branchId) {
    return NextResponse.json({ error: "لا يوجد فرع مرتبط بحسابك" }, { status: 400 });
  }

  const [branch] = await db.select().from(branches).where(eq(branches.id, user.branchId)).limit(1);
  if (!branch) {
    return NextResponse.json({ error: "الفرع غير موجود" }, { status: 404 });
  }

  const todayStr = getCairoDateString();

  const [existing] = await db
    .select()
    .from(attendanceLogs)
    .where(and(eq(attendanceLogs.userId, userId), eq(attendanceLogs.workDate, todayStr)))
    .limit(1);

  if (existing?.checkInTime) {
    return NextResponse.json({ error: "تم تسجيل الحضور بالفعل اليوم" }, { status: 400 });
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
      distance = calculateDistanceMeters(lat, lng, Number(branch.latitude), Number(branch.longitude));
      if (distance <= branch.geofenceRadius) {
        approvalStatus = "AUTO_APPROVED";
      }
    }
  }

  const photoBuffer = await photo.arrayBuffer();
  const fileName = `attendance/${userId}/${todayStr}-checkin-${Date.now()}.jpg`;
  const blob = await put(fileName, photoBuffer, {
    access: "public",
    contentType: photo.type || "image/jpeg",
  });

  const checkInTime = new Date();

  if (existing) {
    await db
      .update(attendanceLogs)
      .set({
        checkInTime,
        checkInLat: lat !== null ? String(lat) : null,
        checkInLng: lng !== null ? String(lng) : null,
        checkInDistance: distance !== null ? Math.round(distance) : null,
        checkInMethod: "GPS",
        checkInPhotoUrl: blob.url,
        checkInApprovalStatus: approvalStatus,
      })
      .where(eq(attendanceLogs.id, existing.id));
  } else {
    await db.insert(attendanceLogs).values({
      userId,
      branchId: user.branchId,
      workDate: todayStr,
      checkInTime,
      checkInLat: lat !== null ? String(lat) : null,
      checkInLng: lng !== null ? String(lng) : null,
      checkInDistance: distance !== null ? Math.round(distance) : null,
      checkInMethod: "GPS",
      checkInPhotoUrl: blob.url,
      checkInApprovalStatus: approvalStatus,
    });
  }

  return NextResponse.json({
    success: true,
    approvalStatus,
    distance: distance !== null ? Math.round(distance) : null,
    allowedRadius: branch.geofenceRadius,
  });
}
