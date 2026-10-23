import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function GET(req: NextRequest) {
  const diagnosis: Record<string, any> = {
    timestamp: new Date().toISOString(),
    status: "ok",
  };

  try {
    const allUsers = await db
      .select({
        id: users.id,
        phone: users.phone,
        name: users.name,
        isActive: users.isActive,
        role: users.role,
        branchId: users.branchId,
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
  } catch (error: any) {
    console.error("Debug auth error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal Server Error",
        diagnosis,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
