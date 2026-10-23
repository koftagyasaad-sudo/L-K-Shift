import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  attendanceLogs,
  notifications,
  shifts,
  leaveRequests,
  customRoleAssignments,
  adminBranchScopes,
  users,
  customRoles,
  branches,
} from "@/db/schema";

export async function POST(request: Request) {
  try {
    // مسح البيانات من الجداول المعتمدة بالترتيب التنازلي للتعديلات
    await db.delete(attendanceLogs);
    await db.delete(notifications);
    await db.delete(shifts);
    await db.delete(leaveRequests);
    await db.delete(customRoleAssignments);
    await db.delete(adminBranchScopes);
    await db.delete(users);
    await db.delete(customRoles);
    await db.delete(branches);

    return NextResponse.json({
      success: true,
      message: "Database reset successfully",
    });
  } catch (error: any) {
    console.error("Reset database error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to reset database",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
