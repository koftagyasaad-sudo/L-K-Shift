import { NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/api-auth";
import {
  attendanceError,
  parseAttendanceInput,
  submitAttendance,
} from "@/lib/attendance-api";

export async function POST(request: NextRequest) {
  const authorization = await authorizeApi();
  if ("response" in authorization) return authorization.response;

  let input;
  try {
    input = await parseAttendanceInput(request, "CHECK_IN");
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
