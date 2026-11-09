import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { authorizeApi } from "@/lib/api-auth";
import { db } from "@/db";
import { branches } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const authorization = await authorizeApi();
    if ("response" in authorization) return authorization.response;

    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as
      | { name?: string | null; phone?: string | null; fullNameAr?: string | null }
      | undefined;
    const branchId = authorization.principal.primaryBranchId;
    const [branch] = branchId
      ? await db
          .select({ name: branches.nameAr, start: branches.shiftStartTime, end: branches.shiftEndTime })
          .from(branches)
          .where(eq(branches.id, branchId))
          .limit(1)
      : [];

    return NextResponse.json({
      authenticated: true,
      user: {
        id: authorization.principal.id,
        name: sessionUser?.name || sessionUser?.fullNameAr || "",
        fullName: sessionUser?.fullNameAr || sessionUser?.name || "",
        phone: sessionUser?.phone || "",
        role: authorization.principal.jobRole,
        systemRole: authorization.principal.systemRole,
        branchId,
        branchName: branch?.name || "",
        shiftStart: branch?.start || "10:00",
        shiftEnd: branch?.end || "18:00",
        permissions: authorization.principal.permissions,
      },
    });
  } catch (error) {
    console.error("Session endpoint error:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}