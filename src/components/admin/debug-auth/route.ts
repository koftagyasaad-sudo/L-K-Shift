import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function GET() {
  const diagnosis: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    status: "ok",
  };

  try {
    const allUsers = await db
      .select({
        id: users.id,
        phone: users.phone,
        name: users.fullNameAr,
        isActive: users.isActive,
        role: users.jobRole,
        branchId: users.primaryBranchId,
      })
      .from(users);

    diagnosis.total_users_in_db = allUsers.length;
    diagnosis.users = allUsers.map((u) => ({
      ...u,
      systemRole: u.role, // توافق مع أداة التشخيص
    }));

    return NextResponse.json({
      success: true,
      diagnosis,
    });
  } catch (error: unknown) {
    console.error("Debug auth error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
        diagnosis,
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
