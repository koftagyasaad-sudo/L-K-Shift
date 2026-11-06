import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  attendanceLogs,
  notifications,
  leaveRequests,
  customRoleAssignments,
  adminBranchScopes,
} from "@/db/schema";
import { sql } from "drizzle-orm";

export async function POST() {
  try {
    await db.execute(sql`
      DO $$ BEGIN
        TRUNCATE TABLE attendance_logs CASCADE;
        TRUNCATE TABLE leave_requests CASCADE;
        TRUNCATE TABLE notifications CASCADE;
      EXCEPTION WHEN others THEN NULL;
      END $$;
    `);

    return NextResponse.json({
      success: true,
      message: "تمت إعادة تعيين البيانات بنجاح",
    });
  } catch (error: any) {
    console.error("Reset Database Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "ready" });
}
