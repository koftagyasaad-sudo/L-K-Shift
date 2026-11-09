import { NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/api-auth";
import { attendanceError, getAttendanceRecords } from "@/lib/attendance-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authorization = await authorizeApi();
  if ("response" in authorization) return authorization.response;

  try {
    const { id } = await params;
    const searchParams = new URLSearchParams(request.nextUrl.searchParams);
    if (!searchParams.has("userId")) searchParams.set("userId", id);
    const records = await getAttendanceRecords(authorization.principal, searchParams);
    return NextResponse.json(records);
  } catch (error) {
    return attendanceError(error);
  }
}
