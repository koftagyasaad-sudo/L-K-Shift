import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, branches, attendanceLogs, shiftAssignments, shiftTemplates } from "@/db/schema";
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
  if (!user) {
    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }

  if (!user.primaryBranchId) {
    return NextResponse.json({ error: "لا يوجد فرع مرتبط بحسابك، تواصل مع الإدارة" }, { status: 400 });
  }

  const [branch] = await db.select().from(branches).where(eq(branches.id, user.primaryBranchId)).limit(1);
  if (!branch) {
    return NextResponse.json({ error: "الفرع غير موجود" }, { status: 404 });
  }

  const todayStr = getCairoDateString();
  const workDate = new Date(todayStr);

  const [existing] = await db
    .select()
    .from(attendanceLogs)
    .where(and(eq(attendanceLogs.userId, userId), eq(attendanceLogs.workDate, workDate)))
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
      distance = calculateDistanceMeters(lat, lng, branch.latitude, branch.longitude);
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

  let status: "ON_TIME" | "LATE" = "ON_TIME";
  let lateMinutes = 0;
  let shiftAssignmentId: number | null = null;

  const [assignment] = await db
    .select()
    .from(shiftAssignments)
    .where(and(eq(shiftAssignments.userId, userId), eq(shiftAssignments.workDate, workDate)))
    .limit(1);

  if (assignment) {
    shiftAssignmentId = assignment.id;
    const [shift] = await db
      .select()
      .from(shiftTemplates)
      .where(eq(shiftTemplates.id, assignment.shiftId))
      .limit(1);

    if (shift) {
      const now = new Date();
      const [startH, startM] = shift.startTime.split(":").map(Number);
      const shiftStart = new Date(now);
      shiftStart.setHours(startH, startM, 0, 0);
      const graceMs = shift.gracePeriodMinutes * 60 * 1000;
      const diffMs = now.getTime() - (shiftStart.getTime() + graceMs);
      if (diffMs > 0) {
        status = "LATE";
        lateMinutes = Math.round(diffMs / 60000);
      }
    }
  }

  if (existing) {
    await db
      .update(attendanceLogs)
      .set({
        shiftAssignmentId,
        checkInTime: new Date(),
        checkInLat: lat,
        checkInLng: lng,
        checkInDistance: distance,
        checkInMethod: "GPS",
        checkInPhotoUrl: blob.url,
        checkInApprovalStatus: approvalStatus,
        status,
        lateMinutes,
      })
      .where(eq(attendanceLogs.id, existing.id));
  } else {
    await db.insert(attendanceLogs).values({
      userId,
      branchId: user.primaryBranchId,
      shiftAssignmentId,
      workDate,
      checkInTime: new Date(),
      checkInLat: lat,
      checkInLng: lng,
      checkInDistance: distance,
      checkInMethod: "GPS",
      checkInPhotoUrl: blob.url,
      checkInApprovalStatus: approvalStatus,
      status,
      lateMinutes,
    });
  }

  return NextResponse.json({
    success: true,
    approvalStatus,
    distance: distance !== null ? Math.round(distance) : null,
    allowedRadius: branch.geofenceRadius,
    status,
  });
}
