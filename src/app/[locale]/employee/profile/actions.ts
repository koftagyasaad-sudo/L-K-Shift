"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { attendanceExceptions, auditLogs, leaveRequests } from "@/db/schema";
import { requireSession } from "@/lib/auth-guards";

function toDateValue(value: FormDataEntryValue | null) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createLeaveRequestAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ar");
  const session = await requireSession(locale);

  const leaveType = String(formData.get("leaveType") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const startDate = toDateValue(formData.get("startDate"));
  const endDate = toDateValue(formData.get("endDate"));

  if (!leaveType || !startDate || !endDate) {
    return;
  }

  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1);

  await db.insert(leaveRequests).values({
    userId: Number(session.user.id),
    leaveType,
    startDate,
    endDate,
    totalDays,
    reason,
    status: "PENDING",
  });

  await db.insert(auditLogs).values({
    userId: Number(session.user.id),
    action: "LEAVE_REQUEST_SUBMITTED",
    entityType: "leave_requests",
  });

  revalidatePath(`/${locale}/employee/profile`);
}

export async function createExceptionRequestAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ar");
  const session = await requireSession(locale);

  const workDate = toDateValue(formData.get("workDate"));
  const exceptionType = String(formData.get("exceptionType") ?? "OTHER").trim() as
    | "FORGOT_CHECK_IN"
    | "FORGOT_CHECK_OUT"
    | "DEVICE_ISSUE"
    | "GPS_ISSUE"
    | "EMERGENCY"
    | "OTHER";
  const description = String(formData.get("description") ?? "").trim();
  const requestedCheckIn = toDateValue(formData.get("requestedCheckIn"));
  const requestedCheckOut = toDateValue(formData.get("requestedCheckOut"));

  if (!workDate || !description) {
    return;
  }

  await db.insert(attendanceExceptions).values({
    userId: Number(session.user.id),
    workDate,
    exceptionType,
    description,
    requestedCheckIn,
    requestedCheckOut,
    status: "PENDING",
  });

  await db.insert(auditLogs).values({
    userId: Number(session.user.id),
    action: "ATTENDANCE_EXCEPTION_SUBMITTED",
    entityType: "attendance_exceptions",
  });

  revalidatePath(`/${locale}/employee/profile`);
}

export async function justifyMissedDayAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ar");
  const session = await requireSession(locale);
  const workDate = toDateValue(formData.get("workDate"));
  const description = String(formData.get("description") ?? "").trim();

  if (!workDate || !description) {
    return;
  }

  await db.insert(attendanceExceptions).values({
    userId: Number(session.user.id),
    workDate,
    exceptionType: "OTHER",
    description,
    status: "PENDING",
  });

  await db.insert(auditLogs).values({
    userId: Number(session.user.id),
    action: "MISSED_DAY_JUSTIFICATION_SUBMITTED",
    entityType: "attendance_exceptions",
  });

  revalidatePath(`/${locale}/employee/profile`);
}
