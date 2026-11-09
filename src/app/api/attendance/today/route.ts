import { NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/api-auth";
import { attendanceError, getAttendanceRecords } from "@/lib/attendance-api";

export async function GET(request: NextRequest) {
  const authorization = await authorizeApi();
  if ("response" in authorization) return authorization.response;

  try {
    const records = await getAttendanceRecords(
      authorization.principal,
      request.nextUrl.searchParams
    );
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
    }).format(new Date());
    const logs = records.filter((record) => record.workDate === today);
    const lastCheckIn = logs.find((record) => record.checkInTime) || null;
    const lastCheckOut = logs.find((record) => record.checkOutTime) || null;
    const isCheckedIn = Boolean(lastCheckIn && !lastCheckIn.checkOutTime);

    return NextResponse.json({
      success: true,
      data: { logs, lastCheckIn, lastCheckOut, isCheckedIn },
      record: logs[0] || null,
    });
  } catch (error) {
    return attendanceError(error);
  }
}
