import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users, branches } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { phone?: string | null; id?: string | null; name?: string | null } | undefined;

    const phone = sessionUser?.phone ? String(sessionUser.phone).trim() : null;
    const rawId = sessionUser?.id ? String(sessionUser.id).trim() : null;

    if (!session || (!phone && !rawId)) {
      return NextResponse.json({ authenticated: false, message: "غير مصرح" }, { status: 401 });
    }

    // استعلام فوري بحساب المستخدم عبر الهاتف أو المعرف
    const conditions = [];
    if (phone) conditions.push(eq(users.phone, phone));
    if (rawId) conditions.push(eq(users.id, rawId));

    const [dbUser] = await db
      .select()
      .from(users)
      .where(conditions.length > 1 ? or(...conditions) : conditions[0])
      .limit(1);

    if (!dbUser || dbUser.isActive === false) {
      return NextResponse.json({ authenticated: false, message: "غير مصرح" }, { status: 401 });
    }

    const isSuperAdmin = dbUser.systemRole === "SUPER_ADMIN" || dbUser.jobRole === "SUPER_ADMIN";
    const permissions = isSuperAdmin ? ["*"] : ["dashboard.view", "attendance.view"];

    let branchName = "";
    let shiftStart = "10:00";
    let shiftEnd = "18:00";

    if (dbUser.primaryBranchId) {
      try {
        const [b] = await db
          .select({ name: branches.nameAr, start: branches.shiftStartTime, end: branches.shiftEndTime })
          .from(branches)
          .where(eq(branches.id, dbUser.primaryBranchId))
          .limit(1);
        if (b) {
          branchName = b.name || "";
          shiftStart = b.start || "10:00";
          shiftEnd = b.end || "18:00";
        }
      } catch (error) {
        console.error("Session branch lookup failed:", error);
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: dbUser.id,
        name: dbUser.fullNameAr || dbUser.fullNameEn || sessionUser?.name || phone,
        fullName: dbUser.fullNameAr || dbUser.fullNameEn || sessionUser?.name || phone,
        phone: dbUser.phone,
        role: dbUser.jobRole || "SUPER_ADMIN",
        systemRole: dbUser.systemRole || "SUPER_ADMIN",
        branchId: dbUser.primaryBranchId,
        branchName,
        shiftStart,
        shiftEnd,
        permissions,
        isOnboarded: true,
      },
    });
  } catch (error) {
    console.error("Session endpoint error:", error);
    return NextResponse.json({ authenticated: false, message: "خطأ في السيرفر" }, { status: 500 });
  }
}
