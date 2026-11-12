import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceLogs, branches, users } from "@/db/schema";
import { canAccessBranch, hasApiPermission, type ApiPrincipal } from "@/lib/api-auth";
import { isValidCoordinates, isValidGpsAccuracy } from "@/lib/geo";

export type AttendanceAction = "CHECK_IN" | "CHECK_OUT";

export interface AttendanceInput {
  action: AttendanceAction;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  photoUrl: string | null;
  userId: string | null;
  branchId: string | null;
  timestamp: Date;
}

export interface AttendanceRecord {
  id: string | number;
  userId: string;
  userName: string;
  employeeCode: string;
  userPhone: string;
  branchName: string;
  branchId: string | null;
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

function isValidAttendancePhoto(value: string): boolean {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;

  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length === 0 || bytes.length > 5 * 1024 * 1024 || bytes.toString("base64") !== match[2]) {
    return false;
  }

  switch (match[1]) {
    case "image/jpeg":
      return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return bytes.length >= 8
        && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/webp":
      return bytes.length >= 12
        && bytes.toString("ascii", 0, 4) === "RIFF"
        && bytes.toString("ascii", 8, 12) === "WEBP";
    default:
      return false;
  }
}

export async function parseAttendanceInput(
  request: Request,
  forcedAction?: AttendanceAction
): Promise<AttendanceInput> {
  const contentType = request.headers.get("content-type") || "";
  let action: string | null = forcedAction || null;
  let latitude: string | null = null;
  let longitude: string | null = null;
  let accuracy: string | null = null;
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
    accuracy = formValue(form, "accuracy");
    timestamp = formValue(form, "recordedAt", "deviceTimestamp", "offlineTimestamp", "timestamp");

    const photo = form.get("photo");
    if (!photoUrl && photo instanceof File) {
      if (photo.size > 5 * 1024 * 1024) {
        throw new Error("حجم الصورة يتجاوز الحد المسموح.");
      }
      const photoType = photo.type || "image/jpeg";
      if (!["image/jpeg", "image/png", "image/webp"].includes(photoType)) {
        throw new Error("صورة الحضور غير صالحة.");
      }
      const bytes = Buffer.from(await photo.arrayBuffer());
      photoUrl = `data:${photoType};base64,${bytes.toString("base64")}`;
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
    accuracy = values.accuracy == null ? null : String(values.accuracy);
    photoUrl = typeof values.photoBase64 === "string"
      ? values.photoBase64
      : typeof values.photoUrl === "string"
        ? values.photoUrl
        : null;
    userId = values.userId == null ? null : String(values.userId);
    branchId = values.branchId == null ? null : String(values.branchId);
    timestamp = typeof values.recordedAt === "string"
      ? values.recordedAt
      : typeof values.deviceTimestamp === "string"
        ? values.deviceTimestamp
        : typeof values.offlineTimestamp === "string"
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
  if (!isValidCoordinates(lat, lng)) {
    throw new Error("إحداثيات الموقع غير صالحة.");
  }
  const parsedAccuracy = accuracy === null ? null : Number(accuracy);
  if (parsedAccuracy !== null && !isValidGpsAccuracy(parsedAccuracy)) {
    throw new Error("دقة إشارة GPS غير صالحة.");
  }
  if (!photoUrl) {
    throw new Error("صورة الحضور مطلوبة لإتمام العملية.");
  }
  if (photoUrl.length > 7_000_000) {
    throw new Error("حجم الصورة يتجاوز الحد المسموح.");
  }
  if (!isValidAttendancePhoto(photoUrl)) {
    throw new Error("صورة الحضور غير صالحة.");
  }

  const parsedUserId = userId?.trim() || null;
  const parsedBranchId = branchId?.trim() || null;
  if (userId !== null && !parsedUserId) {
    throw new Error("معرف الموظف غير صالح.");
  }
  if (branchId !== null && !parsedBranchId) {
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
    accuracy: parsedAccuracy,
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

async function getLiveAttendanceRecords(
  principal: ApiPrincipal,
  searchParams: URLSearchParams
): Promise<AttendanceRecord[]> {
  const canViewAll = principal.systemRole === "SUPER_ADMIN"
    || (principal.systemRole !== "EMPLOYEE" && (
      hasApiPermission(principal, "attendance.view")
      || hasApiPermission(principal, "attendance.review")
      || hasApiPermission(principal, "attendance.export")
    ));
  const canViewPayroll = hasApiPermission(principal, "payroll.view")
    || hasApiPermission(principal, "reports.view");
  const conditions: SQL[] = [];
  const requestedUserId = searchParams.get("userId");
  const requestedCode = searchParams.get("code");
  const requestedPhone = searchParams.get("phone");
  const requestedBranchId = searchParams.get("branchId");
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");

  if (!canViewAll) {
    conditions.push(sql`user_id = ${principal.id}`);
  } else if (principal.systemRole !== "SUPER_ADMIN" && principal.branchScope !== "ALL") {
    const branchIds = principal.branchScope === "CUSTOM"
      ? principal.allowedBranchIds
      : principal.primaryBranchId
        ? [principal.primaryBranchId]
        : [];
    conditions.push(branchIds.length
      ? sql`effective_branch_id = ANY(${branchIds}::text[])`
      : sql`FALSE`);
  }
  if (canViewAll && requestedUserId && requestedUserId !== "ALL") {
    conditions.push(sql`user_id = ${requestedUserId}`);
  }
  if (canViewAll && requestedCode) conditions.push(sql`employee_code = ${requestedCode}`);
  if (canViewAll && requestedPhone) conditions.push(sql`phone = ${requestedPhone}`);
  if (requestedBranchId) {
    conditions.push(canAccessBranch(principal, requestedBranchId)
      ? sql`effective_branch_id = ${requestedBranchId}`
      : sql`FALSE`);
  }
  conditions.push(sql`work_date >= COALESCE(NULLIF(${fromDate ?? ""}, '')::date, work_date)`);
  conditions.push(sql`work_date <= COALESCE(NULLIF(${toDate ?? ""}, '')::date, work_date)`);

  const raw = await db.execute(sql`
    WITH attendance_rows AS (
      SELECT
        a.id::text AS id,
        a.user_id::text AS user_id,
        COALESCE(a.branch_id::text, u.primary_branch_id::text, u.branch_id::text) AS effective_branch_id,
        COALESCE(u.full_name_ar, u.name, u.full_name, 'موظف') AS user_name,
        COALESCE(u.employee_number, u.employee_code, u.id::text) AS employee_code,
        COALESCE(u.phone, '') AS phone,
        u.monthly_salary AS salary,
        COALESCE(u.working_hours_per_day, 8) AS working_hours_per_day,
        b.name_ar AS branch_name,
        a.check_in,
        a.check_out,
        a.distance_meters,
        a.status,
        CASE
          WHEN (a.check_in AT TIME ZONE 'Africa/Cairo')::time < TIME '06:00'
            THEN (a.check_in AT TIME ZONE 'Africa/Cairo')::date - 1
          ELSE (a.check_in AT TIME ZONE 'Africa/Cairo')::date
        END AS work_date
      FROM attendance a
      LEFT JOIN users u ON a.user_id::text = u.id::text
      LEFT JOIN branches b ON b.id::text = COALESCE(
        a.branch_id::text,
        u.primary_branch_id::text,
        u.branch_id::text,
        ''
      )
    )
    SELECT *
    FROM attendance_rows
    WHERE ${sql.join(conditions, sql` AND `)}
    ORDER BY check_in DESC
    LIMIT 500;
  `);
  const rows = resultRows<{
    id: string;
    user_id: string;
    effective_branch_id: string | null;
    user_name: string;
    employee_code: string;
    phone: string;
    salary: string | number | null;
    working_hours_per_day: number | null;
    branch_name: string | null;
    check_in: string | Date | null;
    check_out: string | Date | null;
    distance_meters: number | null;
    status: string | null;
    work_date: string | Date;
  }>(raw);

  return rows.map((row) => {
    const checkInTime = timestampString(row.check_in);
    const checkOutTime = timestampString(row.check_out);
    const workedMinutes = checkInTime && checkOutTime
      ? Math.max(0, Math.round((new Date(checkOutTime).getTime() - new Date(checkInTime).getTime()) / 60_000))
      : 0;
    const rawStatus = String(row.status || "present").toUpperCase();
    return {
      id: row.id,
      userId: row.user_id,
      userName: row.user_name || "موظف",
      employeeCode: row.employee_code || row.user_id,
      userPhone: row.phone || "",
      branchName: row.branch_name || "الفرع الرئيسي",
      branchId: row.effective_branch_id,
      workDate: row.work_date instanceof Date
        ? row.work_date.toISOString().slice(0, 10)
        : String(row.work_date).slice(0, 10),
      checkInTime,
      checkOutTime,
      gpsDistance: Number(row.distance_meters || 0),
      photoUrl: null,
      workedMinutes,
      lateMinutes: 0,
      overtimeMinutes: Math.max(0, workedMinutes - Number(row.working_hours_per_day || 8) * 60),
      status: rawStatus === "PRESENT" ? "ON_TIME" : rawStatus,
      basicSalary: canViewPayroll ? Number(row.salary || 0) : 0,
      workingHoursPerDay: Number(row.working_hours_per_day || 8),
    };
  });
}

export async function submitAttendance(
  principal: ApiPrincipal,
  input: AttendanceInput
): Promise<NextResponse> {
  const canOverride = hasApiPermission(principal, "attendance.override");
  if (!input.photoUrl || !isValidAttendancePhoto(input.photoUrl)) {
    return errorResponse("صورة الحضور مطلوبة وصالحة لإتمام العملية.", 400);
  }

  if (
    principal.systemRole === "EMPLOYEE" &&
    input.userId !== null &&
    input.userId !== principal.id
  ) {
    return errorResponse("غير مصرح بتسجيل الحضور لموظف آخر.", 403);
  }

  const targetUserId = principal.systemRole === "EMPLOYEE"
    ? principal.id
    : input.userId ?? principal.id;
  if (targetUserId !== principal.id && !canOverride) {
    return errorResponse("غير مصرح بتسجيل الحضور لموظف آخر.", 403);
  }

  const userRows = resultRows<{
    id: string;
    primary_branch_id: string | null;
    branch_id: string | null;
    working_hours_per_day: number | null;
  }>(await db.execute(sql`
    SELECT id::text, primary_branch_id::text, branch_id::text, working_hours_per_day
    FROM users
    WHERE id::text = ${targetUserId} AND is_active = TRUE
    LIMIT 1;
  `));
  const user = userRows[0];
  if (!user) return errorResponse("الموظف غير موجود أو غير نشط.", 404);

  const employeeBranchId = user.primary_branch_id ?? user.branch_id;
  const branchId = input.branchId ?? employeeBranchId;
  if (branchId === null) return errorResponse("لا يوجد فرع معين للموظف.", 400);
  if (!canOverride && branchId !== employeeBranchId) {
    return errorResponse("لا يمكن تسجيل الحضور في فرع غير معين للموظف.", 403);
  }
  if (!canAccessBranch(principal, branchId)) {
    return errorResponse("ممنوع الوصول إلى هذا الفرع.", 403);
  }

  const branchRows = resultRows<{
    id: string;
    latitude: string | null;
    longitude: string | null;
    geofence_radius: number | null;
  }>(await db.execute(sql`
    SELECT id::text, latitude, longitude, geofence_radius
    FROM branches
    WHERE id::text = ${branchId}
    LIMIT 1;
  `));
  const branch = branchRows[0];
  if (!branch) return errorResponse("الفرع غير موجود.", 404);

  const branchLatitude = branch.latitude == null || !branch.latitude.trim()
    ? Number.NaN
    : Number(branch.latitude);
  const branchLongitude = branch.longitude == null || !branch.longitude.trim()
    ? Number.NaN
    : Number(branch.longitude);
  if (!isValidCoordinates(branchLatitude, branchLongitude)) {
    return errorResponse("إحداثيات الفرع غير صالحة.", 500);
  }
  const distance = distanceMeters(input.latitude, input.longitude, branchLatitude, branchLongitude);
  const allowedRadius = Math.max(100, Number(branch.geofence_radius) || 100) + 100;
  if (distance > allowedRadius) {
    return errorResponse(`أنت خارج نطاق الفرع. المسافة ${distance}م (المسموح ${allowedRadius}م).`, 400);
  }

  const { date: workDate, hour, minute } = cairoWorkDate(input.timestamp);
  const existingRows = resultRows<{
    id: string;
    check_in: string | Date | null;
    check_out: string | Date | null;
  }>(await db.execute(sql`
    SELECT id, check_in, check_out
    FROM attendance
    WHERE user_id::text = ${targetUserId}
      AND CASE
        WHEN (check_in AT TIME ZONE 'Africa/Cairo')::time < TIME '06:00'
          THEN (check_in AT TIME ZONE 'Africa/Cairo')::date - 1
        ELSE (check_in AT TIME ZONE 'Africa/Cairo')::date
      END = ${workDate}::date
    ORDER BY check_in DESC
    LIMIT 1;
  `));
  const existing = existingRows[0];

  if (input.action === "CHECK_IN") {
    if (existing?.check_in) {
      await db.execute(sql`
        UPDATE attendance
        SET check_in_lat = ${String(input.latitude)},
            check_in_lng = ${String(input.longitude)},
            distance_meters = ${distance},
            updated_at = NOW()
        WHERE id::text = ${existing.id};
      `);
    } else {
      const lateMinutes = hour > 10 || (hour === 10 && minute > 15)
        ? (hour - 10) * 60 + minute - 15
        : 0;
      await db.execute(sql`
        INSERT INTO attendance (
          user_id, branch_id, check_in, check_in_lat, check_in_lng,
          distance_meters, status, created_at, updated_at
        ) VALUES (
          ${targetUserId}, ${branchId}, ${input.timestamp},
          ${String(input.latitude)}, ${String(input.longitude)},
          ${distance}, ${lateMinutes > 0 ? "late" : "present"}, NOW(), NOW()
        );
      `);
    }
    return NextResponse.json({ success: true, message: "تم تسجيل الحضور بنجاح." });
  }

  if (!existing?.check_in) {
    return errorResponse("يجب تسجيل الحضور أولاً قبل تسجيل الانصراف.", 400);
  }
  if (existing.check_out) {
    return errorResponse("تم تسجيل الانصراف مسبقاً.", 400);
  }
  const checkInTime = new Date(existing.check_in);
  if (input.timestamp < checkInTime) {
    return errorResponse("وقت الانصراف يسبق وقت الحضور.", 400);
  }

  await db.execute(sql`
    UPDATE attendance
    SET check_out = ${input.timestamp},
        check_out_lat = ${String(input.latitude)},
        check_out_lng = ${String(input.longitude)},
        updated_at = NOW()
    WHERE id::text = ${existing.id};
  `);

  return NextResponse.json({ success: true, message: "تم تسجيل الانصراف بنجاح." });
}

export async function getAttendanceRecords(
  principal: ApiPrincipal,
  searchParams: URLSearchParams
): Promise<AttendanceRecord[]> {
  const canonicalTable = resultRows<{ tableName: string | null }>(
    await db.execute(sql`SELECT to_regclass('public.attendance_logs')::text AS "tableName";`)
  )[0];
  if (!canonicalTable?.tableName) {
    return getLiveAttendanceRecords(principal, searchParams);
  }

  const canViewAll = principal.systemRole === "SUPER_ADMIN"
    || (principal.systemRole !== "EMPLOYEE" && (
      hasApiPermission(principal, "attendance.view")
      || hasApiPermission(principal, "attendance.review")
      || hasApiPermission(principal, "attendance.export")
    ));
  const canViewPayroll = hasApiPermission(principal, "payroll.view")
    || hasApiPermission(principal, "reports.view");
  const requestedUserId = searchParams.get("userId");
  const requestedCode = searchParams.get("code");
  const requestedPhone = searchParams.get("phone");
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");
  const conditions = [];

  if (!canViewAll) {
    conditions.push(eq(attendanceLogs.userId, principal.id));
  } else if (principal.systemRole !== "SUPER_ADMIN" && principal.branchScope !== "ALL") {
    const branchIds = principal.branchScope === "CUSTOM"
      ? principal.allowedBranchIds
      : principal.primaryBranchId
        ? [principal.primaryBranchId]
        : [];
    if (branchIds.length === 0) {
      conditions.push(sql`FALSE`);
    } else {
      conditions.push(sql`COALESCE(${attendanceLogs.branchId}, ${users.primaryBranchId}) = ANY(${branchIds}::text[])`);
    }
  }
  if (canViewAll && requestedUserId && requestedUserId !== "ALL") {
    conditions.push(eq(attendanceLogs.userId, requestedUserId));
  }
  if (canViewAll && requestedCode) conditions.push(eq(users.employeeNumber, requestedCode));
  if (canViewAll && requestedPhone) conditions.push(eq(users.phone, requestedPhone));
  conditions.push(sql`${attendanceLogs.workDate}::date >= COALESCE(NULLIF(${fromDate ?? ""}, '')::date, ${attendanceLogs.workDate}::date)`);
  conditions.push(sql`${attendanceLogs.workDate}::date <= COALESCE(NULLIF(${toDate ?? ""}, '')::date, ${attendanceLogs.workDate}::date)`);

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
    .leftJoin(users, sql`${attendanceLogs.userId}::text = ${users.id}::text`)
    .leftJoin(branches, sql`${attendanceLogs.branchId}::text = ${branches.id}::text`)
    .where(and(...conditions))
    .orderBy(desc(attendanceLogs.workDate), desc(attendanceLogs.id))
    .limit(500);

  const canonicalRecords: AttendanceRecord[] = rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    userName: row.userName || "موظف",
    employeeCode: row.employeeNumber || row.employeeCode || String(row.userId),
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
    const branchIds = principal.branchScope === "CUSTOM"
      ? principal.allowedBranchIds
      : principal.primaryBranchId
        ? [principal.primaryBranchId]
        : [];
    const legacyUserId = sql`COALESCE(
      to_jsonb(attendance)->>'user_id',
      to_jsonb(attendance)->>'userId',
      to_jsonb(attendance)->>'employee_id'
    )`;
    const legacyDate = sql`NULLIF(COALESCE(
      to_jsonb(attendance)->>'work_date',
      to_jsonb(attendance)->>'created_at',
      to_jsonb(attendance)->>'timestamp'
    ), '')::date`;
    const legacyConditions = [];
    if (!canViewAll) legacyConditions.push(sql`${legacyUserId} = ${principal.id}`);
    else if (principal.systemRole !== "SUPER_ADMIN" && principal.branchScope !== "ALL") {
      legacyConditions.push(branchIds.length
        ? sql`COALESCE(
            to_jsonb(attendance)->>'branch_id',
            (SELECT primary_branch_id::text FROM users WHERE id::text = ${legacyUserId})
          ) = ANY(${branchIds}::text[])`
        : sql`FALSE`);
    }
    if (canViewAll && requestedUserId && requestedUserId !== "ALL") {
      legacyConditions.push(sql`${legacyUserId} = ${requestedUserId}`);
    }
    if (canViewAll && requestedCode) {
      legacyConditions.push(sql`EXISTS (
        SELECT 1 FROM users
        WHERE users.id::text = ${legacyUserId}
          AND COALESCE(users.employee_number, users.employee_code, '') = ${requestedCode}
      )`);
    }
    if (canViewAll && requestedPhone) {
      legacyConditions.push(sql`EXISTS (
        SELECT 1 FROM users
        WHERE users.id::text = ${legacyUserId}
          AND users.phone = ${requestedPhone}
      )`);
    }
    legacyConditions.push(sql`${legacyDate} >= COALESCE(NULLIF(${fromDate ?? ""}, '')::date, ${legacyDate})`);
    legacyConditions.push(sql`${legacyDate} <= COALESCE(NULLIF(${toDate ?? ""}, '')::date, ${legacyDate})`);
    const [rawLogs, employeeRows, branchRows] = await Promise.all([
      db.execute(sql`SELECT attendance.* FROM attendance AS attendance WHERE ${sql.join(legacyConditions, sql` AND `)} ORDER BY id DESC LIMIT 500;`),
      db.select({
        id: users.id,
        fullNameAr: users.fullNameAr,
        employeeNumber: users.employeeNumber,
        employeeCode: users.employeeCode,
        phone: users.phone,
        salary: users.monthlySalary,
        workingHoursPerDay: users.workingHoursPerDay,
        primaryBranchId: users.primaryBranchId,
      }).from(users).limit(500),
      db.select({ id: branches.id, nameAr: branches.nameAr }).from(branches).limit(500),
    ]);
    const employeeById = new Map(employeeRows.map((employee) => [String(employee.id), employee]));
    const branchNameById = new Map(branchRows.map((branch) => [String(branch.id), branch.nameAr]));

    legacyRecords = resultRows<Record<string, unknown>>(rawLogs).flatMap((log) => {
      const id = Number(log.id);
      const userId = String(log.user_id ?? log.userId ?? log.employee_id ?? "");
      if (!Number.isSafeInteger(id) || id < 1 || !userId) {
        return [];
      }

      const employee = employeeById.get(userId);
      const rawBranchId = log.branch_id ?? log.branchId ?? employee?.primaryBranchId ?? null;
      const branchId = rawBranchId == null ? null : String(rawBranchId);
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
        employeeCode: employee?.employeeNumber || employee?.employeeCode || userId,
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
    .sort((left, right) =>
      new Date(right.checkInTime || right.workDate).getTime()
      - new Date(left.checkInTime || left.workDate).getTime()
    );
}

export function attendanceError(error: unknown): NextResponse {
  console.error("Attendance API error:", error);
  return errorResponse("حدث خطأ أثناء معالجة الحضور.", 500);
}
