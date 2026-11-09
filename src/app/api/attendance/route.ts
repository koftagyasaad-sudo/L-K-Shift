import { NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/api-auth";
import {
  attendanceError,
  getAttendanceRecords,
  parseAttendanceInput,
  submitAttendance,
  type AttendanceInput,
} from "@/lib/attendance-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const authorization = await authorizeApi();
  if ("response" in authorization) return authorization.response;

  try {
    const records = await getAttendanceRecords(
      authorization.principal,
      request.nextUrl.searchParams
    );
    return NextResponse.json(records);
  } catch (error) {
    return attendanceError(error);
  }
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeApi();
  if ("response" in authorization) return authorization.response;

  let input: AttendanceInput;
  try {
    input = await parseAttendanceInput(request);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "بيانات الحضور غير صالحة." },
      { status: 400 }
    );
  }

  try {
    return await submitAttendance(authorization.principal, input);
  } catch (error) {
    return attendanceError(error);
  }
}
