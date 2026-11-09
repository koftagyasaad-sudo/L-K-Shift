import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceLogs, branches, users } from "@/db/schema";
import { canAccessBranch, hasApiPermission, type ApiPrincipal } from "@/lib/api-auth";

export type AttendanceAction = "CHECK_IN" | "CHECK_OUT";

export interface AttendanceInput {
  action: AttendanceAction;
  latitude: number;
  longitude: number;
  photoUrl: string | null;
  userId: number | null;
  branchId: number | null;
  timestamp: Date;
}

export interface AttendanceRecord {
  id: number;
  userId: number;
  userName: string;
  employeeCode: string;
  userPhone: string;
  branchName: string;
  branchId: number | null;
  workDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  gpsDistance: number;
  photoUrl: string | null;
  workedMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
  status: string;
  basicSalary: number;
  workingHoursPerDay: number;
}

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ success: false, error: message, message }, { status });
}

function resultRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (typeof result === "object" && result !== null && "rows" in result) {
    const rows = result.rows;
    if (Array.isArray(rows)) return rows as T[];
  }
  return [];
}

function timestampString(value: unknown): string | null {
  if (value == null) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function formValue(form: FormData, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = form.get(key);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export async function parseAttendanceInput(
  request: Request,
  forcedAction?: AttendanceAction
): Promise<AttendanceInput> {
  const contentType = request.headers.get("content-type") || "";
  let action: string | null = forcedAction || null;
  let latitude: string | null = null;
  let longitude: string | null = null;
  let photoUrl: string | null = null;
  let userId: string | null = null;
  let branchId: string | null = null;
  let timestamp: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    action ||= formValue(form, "action", "type");
    latitude = formValue(form, "latitude", "lat");
    longitude = formValue(form, "longitude", "lng");
    photoUrl = formValue(form, "photoBase64", "photoUrl");
    userId = formValue(form, "userId");
    branchId = formValue(form, "branchId");
    timestamp = formValue(form, "offlineTimestamp", "timestamp");

    const photo = form.get("photo");
    if (!photoUrl && photo instanceof File) {
      if (photo.size > 5 * 1024 * 1024) {
        throw new Error("حجم الصورة يتجاوز الحد المسموح.");
      }
      const bytes = Buffer.from(await photo.arrayBuffer());
      photoUrl = `data:${photo.type || "image/jpeg"};base64,${bytes.toString("base64")}`;
    }
  } else {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("بيانات الحضور غير صالحة.");
    }
    const values = body as Record<string, unknown>;
    action ||= typeof values.action === "string" ? values.action : typeof values.type === "string" ? values.type : null;
    latitude = values.latitude == null ? null : String(values.latitude);
    longitude = values.longitude == null ? null : String(values.longitude);
    photoUrl = typeof values.photoBase64 === "string"
      ? values.photoBase64
      : typeof values.photoUrl === "string"
        ? values.photoUrl
        : null;
    userId = values.userId == null ? null : String(values.userId);
    branchId = values.branchId == null ? null : String(values.branchId);
    timestamp = typeof values.offlineTimestamp === "string"
      ? values.offlineTimestamp
      : typeof values.timestamp === "string"
        ? values.timestamp
        : null;
  }

  if (action !== "CHECK_IN" && action !== "CHECK_OUT") {
    throw new Error("نوع الحركة غير صالح.");
  }

  const lat = latitude === null ? Number.NaN : Number(latitude);
  const lng = longitude === null ? Number.NaN : Number(longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new Error("إحداثيات الموقع غير صالحة.");
  }
  if (photoUrl && photoUrl.length > 7_000_000) {
    throw new Error("حجم الصورة يتجاوز الحد المسموح.");
  }

  const parsedUserId = userId === null ? null : Number(userId);
  const parsedBranchId = branchId === null ? null : Number(branchId);
  if (parsedUserId !== null && (!Number.isSafeInteger(parsedUserId) || parsedUserId < 1)) {
    throw new Error("معرف الموظف غير صالح.");
  }
  if (parsedBranchId !== null && (!Number.isSafeInteger(parsedBranchId) || parsedBranchId < 1)) {
    throw new Error("معرف الفرع غير صالح.");
  }

  const eventTime = timestamp === null ? new Date() : new Date(timestamp);
  if (Number.isNaN(eventTime.getTime())) {
    throw new Error("تاريخ الحركة غير صالح.");
  }

  return {
    action,
    latitude: lat,
    longitude: lng,
    photoUrl,
    userId: parsedUserId,
    branchId: parsedBranchId,
    timestamp: eventTime,
  };
}

function cairoWorkDate(date: Date): { date: string; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const workDate = new Date(`${value("year")}-${value("month")}-${value("day")}T00:00:00.000Z`);
  const hour = Number(value("hour"));
  const minute = Number(value("minute"));
  if (hour < 6) workDate.setUTCDate(workDate.getUTCDate() - 1);
  return { date: workDate.toISOString().slice(0, 10), hour, minute };
}

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export async function submitAttendance(
  principal: ApiPrincipal,
  input: AttendanceInput
): Promise<NextResponse> {
  const canOverride = hasApiPermission(principal, "attendance.override");
  const targetUserId = input.userId ?? principal.id;
  if (targetUserId !== principal.id && !canOverride) {
    return errorResponse("غير مصرح بتسجيل الحضور لموظف آخر.", 403);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, targetUserId), eq(users.isActive, true)))
    .limit(1);
  if (!user) return errorResponse("الموظف غير موجود أو غير نشط.", 404);

  const branchId = input.branchId ?? user.primaryBranchId;
  if (branchId === null) return errorResponse("لا يوجد فرع معين للموظف.", 400);
  if (!canOverride && branchId !== user.primaryBranchId) {
    return errorResponse("لا يمكن تسجيل الحضور في فرع غير معين للموظف.", 403);
  }
  if (!canAccessBranch(principal, branchId)) {
    return errorResponse("ممنوع الوصول إلى هذا الفرع.", 403);
  }

  const [branch] = await db
    .select()
    .from(branches)
    .where(eq(branches.id, branchId))
    .limit(1);
  if (!branch) return errorResponse("الفرع غير موجود.", 404);

  const distance = distanceMeters(input.latitude, input.longitude, branch.latitude, branch.longitude);
  const allowedRadius = branch.geofenceRadius + 100;
  if (distance > allowedRadius) {
    return errorResponse(`أنت خارج نطاق الفرع. المسافة ${distance}م (المسموح ${allowedRadius}م).`, 400);
  }

  const { date: workDate, hour, minute } = cairoWorkDate(input.timestamp);
  const [existing] = await db
    .select()
    .from(attendanceLogs)
    .where(and(eq(attendanceLogs.userId, targetUserId), eq(attendanceLogs.workDate, workDate)))
    .orderBy(desc(attendanceLogs.id))
    .limit(1);

  if (input.action === "CHECK_IN") {
    if (existing?.checkInTime) {
      await db
        .update(attendanceLogs)
        .set({
          checkInLat: input.latitude,
          checkInLng: input.longitude,
          checkInDistance: distance,
          checkInPhotoUrl: input.photoUrl ?? existing.checkInPhotoUrl,
        })
        .where(eq(attendanceLogs.id, existing.id));
    } else {
      const lateMinutes = hour > 10 || (hour === 10 && minute > 15)
        ? (hour - 10) * 60 + minute - 15
        : 0;
      await db.insert(attendanceLogs).values({
        userId: targetUserId,
        branchId,
        workDate,
        checkInTime: input.timestamp,
        checkInLat: input.latitude,
        checkInLng: input.longitude,
        checkInDistance: distance,
        checkInPhotoUrl: input.photoUrl,
        status: lateMinutes > 0 ? "LATE" : "ON_TIME",
        lateMinutes,
      });
    }
    return NextResponse.json({ success: true, message: "تم تسجيل الحضور بنجاح." });
  }

  if (!existing?.checkInTime) {
    return errorResponse("يجب تسجيل الحضور أولاً قبل تسجيل الانصراف.", 400);
  }
  if (input.timestamp < existing.checkInTime) {
    return errorResponse("وقت الانصراف يسبق وقت الحضور.", 400);
  }

  const workedMinutes = Math.max(1, Math.round(
    (input.timestamp.getTime() - existing.checkInTime.getTime()) / 60_000
  ));
  await db
    .update(attendanceLogs)
    .set({
      checkOutTime: input.timestamp,
      checkOutLat: input.latitude,
      checkOutLng: input.longitude,
      checkOutDistance: distance,
      actualWorkedMinutes: workedMinutes,
      overtimeMinutes: Math.max(0, workedMinutes - user.workingHoursPerDay * 60),
    })
    .where(eq(attendanceLogs.id, existing.id));

  return NextResponse.json({ success: true, message: "تم تسجيل الانصراف بنجاح." });
}

export async function getAttendanceRecords(
  principal: ApiPrincipal,
  searchParams: URLSearchParams
): Promise<AttendanceRecord[]> {
  const canViewAll = hasApiPermission(principal, "attendance.view")
    || hasApiPermission(principal, "attendance.review")
    || hasApiPermission(principal, "attendance.export");
  const canViewPayroll = hasApiPermission(principal, "payroll.view")
    || hasApiPermission(principal, "reports.view");
  const rows = await db
    .select({
      id: attendanceLogs.id,
      userId: attendanceLogs.userId,
      branchId: attendanceLogs.branchId,
      workDate: attendanceLogs.workDate,
      checkInTime: attendanceLogs.checkInTime,
      checkOutTime: attendanceLogs.checkOutTime,
      checkInDistance: attendanceLogs.checkInDistance,
      checkInPhotoUrl: attendanceLogs.checkInPhotoUrl,
      actualWorkedMinutes: attendanceLogs.actualWorkedMinutes,
      lateMinutes: attendanceLogs.lateMinutes,
      overtimeMinutes: attendanceLogs.overtimeMinutes,
      status: attendanceLogs.status,
      userName: users.fullNameAr,
      employeeNumber: users.employeeNumber,
      employeeCode: users.employeeCode,
      phone: users.phone,
      salary: users.monthlySalary,
      workingHoursPerDay: users.workingHoursPerDay,
      branchName: branches.nameAr,
    })
    .from(attendanceLogs)
    .leftJoin(users, eq(attendanceLogs.userId, users.id))
    .leftJoin(branches, eq(attendanceLogs.branchId, branches.id))
    .orderBy(desc(attendanceLogs.workDate), desc(attendanceLogs.id));

  const requestedUserId = searchParams.get("userId");
  const requestedCode = searchParams.get("code");
  const requestedPhone = searchParams.get("phone");
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");

  const canonicalRecords: AttendanceRecord[] = rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    userName: row.userName || "موظف",
    employeeCode: row.employeeNumber || row.employeeCode || String(row.userId).padStart(3, "0"),
    userPhone: row.phone || "",
    branchName: row.branchName || "الفرع الرئيسي",
    branchId: row.branchId,
    workDate: String(row.workDate).slice(0, 10),
    checkInTime: row.checkInTime?.toISOString() || null,
    checkOutTime: row.checkOutTime?.toISOString() || null,
    gpsDistance: Number(row.checkInDistance || 0),
    photoUrl: row.checkInPhotoUrl,
    workedMinutes: row.actualWorkedMinutes,
    lateMinutes: row.lateMinutes,
    overtimeMinutes: row.overtimeMinutes,
    status: row.status,
    basicSalary: canViewPayroll ? Number(row.salary || 0) : 0,
    workingHoursPerDay: row.workingHoursPerDay || 8,
  }));

  const legacyTable = resultRows<{ tableName: string | null }>(
    await db.execute(sql`SELECT to_regclass('attendance')::text AS "tableName";`)
  )[0];
  let legacyRecords: AttendanceRecord[] = [];
  if (legacyTable?.tableName) {
    const [rawLogs, employeeRows, branchRows] = await Promise.all([
      db.execute(sql`SELECT * FROM attendance ORDER BY id DESC;`),
      db.select({
        id: users.id,
        fullNameAr: users.fullNameAr,
        employeeNumber: users.employeeNumber,
        employeeCode: users.employeeCode,
        phone: users.phone,
        salary: users.monthlySalary,
        workingHoursPerDay: users.workingHoursPerDay,
        primaryBranchId: users.primaryBranchId,
      }).from(users),
      db.select({ id: branches.id, nameAr: branches.nameAr }).from(branches),
    ]);
    const employeeById = new Map(employeeRows.map((employee) => [String(employee.id), employee]));
    const branchNameById = new Map(branchRows.map((branch) => [String(branch.id), branch.nameAr]));

    legacyRecords = resultRows<Record<string, unknown>>(rawLogs).flatMap((log) => {
      const id = Number(log.id);
      const userId = Number(log.user_id ?? log.userId ?? log.employee_id);
      if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(userId) || userId < 1) {
        return [];
      }

      const employee = employeeById.get(String(userId));
      const rawBranchId = log.branch_id ?? log.branchId ?? employee?.primaryBranchId ?? null;
      const branchId = rawBranchId == null ? null : Number(rawBranchId);
      const branchName = branchId === null ? null : branchNameById.get(String(branchId));
      const rawCheckIn = log.check_in_time ?? log.checkInTime ?? log.timestamp ?? log.created_at;
      const rawCheckOut = log.check_out_time ?? log.checkOutTime;
      const rawWorkDate = log.work_date ?? log.workDate ?? rawCheckIn ?? log.created_at;
      if (rawWorkDate == null) return [];

      const workDate = rawWorkDate instanceof Date
        ? rawWorkDate.toISOString().slice(0, 10)
        : String(rawWorkDate).slice(0, 10);
      return [{
        id,
        userId,
        userName: employee?.fullNameAr || String(log.user_name ?? log.userName ?? "موظف"),
        employeeCode: employee?.employeeNumber || employee?.employeeCode || String(userId).padStart(3, "0"),
        userPhone: employee?.phone || "",
        branchName: branchName || String(log.branch_name ?? log.branchName ?? "الفرع الرئيسي"),
        branchId,
        workDate,
        checkInTime: timestampString(rawCheckIn),
        checkOutTime: timestampString(rawCheckOut),
        gpsDistance: Number(log.check_in_distance ?? log.gps_distance ?? log.distance ?? 0),
        photoUrl: String(log.check_in_photo_url ?? log.photo_url ?? "") || null,
        workedMinutes: Number(log.actual_worked_minutes ?? log.worked_minutes ?? 0),
        lateMinutes: Number(log.late_minutes ?? 0),
        overtimeMinutes: Number(log.overtime_minutes ?? 0),
        status: String(log.status ?? "ON_TIME"),
        basicSalary: canViewPayroll ? Number(employee?.salary || 0) : 0,
        workingHoursPerDay: employee?.workingHoursPerDay || 8,
      }];
    });
  }

  const uniqueRecords = new Map<string, AttendanceRecord>();
  [...canonicalRecords, ...legacyRecords].forEach((record) => {
    uniqueRecords.set(`${record.userId}_${record.workDate}_${record.id}`, record);
  });

  return [...uniqueRecords.values()]
    .filter((record) => {
      if (!canViewAll && record.userId !== principal.id) return false;
      if (canViewAll && !canAccessBranch(principal, record.branchId)) return false;
      if (canViewAll && requestedUserId && requestedUserId !== "ALL"
        && String(record.userId) !== requestedUserId) return false;
      if (canViewAll && requestedCode && requestedCode !== record.employeeCode) return false;
      if (canViewAll && requestedPhone && requestedPhone !== record.userPhone) return false;
      if (fromDate && record.workDate < fromDate) return false;
      if (toDate && record.workDate > toDate) return false;
      return true;
    })
    .sort((left, right) =>
      new Date(right.checkInTime || right.workDate).getTime()
      - new Date(left.checkInTime || left.workDate).getTime()
    );
}

export function attendanceError(error: unknown): NextResponse {
  console.error("Attendance API error:", error);
  return errorResponse("حدث خطأ أثناء معالجة الحضور.", 500);
}
