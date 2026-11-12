import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { getSqlRows } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { phone?: string | null; id?: string | null; name?: string | null } | undefined;

    const phone = sessionUser?.phone ? String(sessionUser.phone).trim() : null;
    const rawId = sessionUser?.id ? String(sessionUser.id).trim() : null;

    if (!session || (!phone && !rawId)) {
      return NextResponse.json({ authenticated: false, message: "غير مصرح" }, { status: 401 });
    }

    const condition = rawId ? sql`u.id::text = ${rawId}` : sql`BTRIM(u.phone) = ${phone}`;
    const userRows = getSqlRows<{
      id: string;
      phone: string;
      fullNameAr: string | null;
      fullNameEn: string | null;
      jobRole: string | null;
      systemRole: string | null;
      primaryBranchId: string | null;
      isActive: boolean | null;
      branchName: string | null;
      shiftStart: string | null;
      shiftEnd: string | null;
    }>(await db.execute(sql`
      SELECT
        u.id::text AS id,
        BTRIM(u.phone) AS phone,
        u.full_name_ar AS "fullNameAr",
        u.full_name_en AS "fullNameEn",
        COALESCE(BTRIM(u.job_role), 'موظف') AS "jobRole",
        COALESCE(u.system_role::text, 'EMPLOYEE') AS "systemRole",
        u.primary_branch_id::text AS "primaryBranchId",
        COALESCE(u.is_active, true) AS "isActive",
        COALESCE(b.name_ar, 'الإدارة') AS "branchName",
        COALESCE(u.shift_start_time, b.shift_start_time, '10:00') AS "shiftStart",
        COALESCE(u.shift_end_time, b.shift_end_time, '18:00') AS "shiftEnd"
      FROM users u
      LEFT JOIN branches b ON u.primary_branch_id::text = b.id::text
      WHERE ${condition}
      LIMIT 1;
    `));

    const dbUser = userRows[0];
    if (!dbUser || dbUser.isActive === false) {
      return NextResponse.json({ authenticated: false, message: "غير مصرح" }, { status: 401 });
    }

    const isSuperAdmin =
      dbUser.systemRole === "SUPER_ADMIN" ||
      dbUser.jobRole === "مدير النظام" ||
      dbUser.jobRole === "SUPER_ADMIN";

    let permissions: string[] = [];
    if (isSuperAdmin) {
      permissions = ["*"];
    } else {
      try {
        const roleRows = getSqlRows<{ permissions: unknown }>(await db.execute(sql`
          SELECT permissions FROM custom_roles
          WHERE BTRIM(name) = ${dbUser.jobRole} OR BTRIM(name_ar) = ${dbUser.jobRole}
          LIMIT 1;
        `));
        const rolePerms = roleRows[0]?.permissions;
        if (Array.isArray(rolePerms)) {
          permissions = rolePerms.filter((p): p is string => typeof p === "string");
        } else if (typeof rolePerms === "object" && rolePerms !== null) {
          permissions = Object.entries(rolePerms)
            .filter(([, enabled]) => enabled === true)
            .map(([perm]) => perm);
        }
      } catch {}
    }

    const displayName = dbUser.fullNameAr || dbUser.fullNameEn || sessionUser?.name || dbUser.phone;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: dbUser.id,
        name: displayName,
        fullName: displayName,
        phone: dbUser.phone,
        role: dbUser.jobRole || "EMPLOYEE",
        systemRole: isSuperAdmin ? "SUPER_ADMIN" : (dbUser.systemRole || "EMPLOYEE"),
        branchId: dbUser.primaryBranchId,
        branchName: dbUser.branchName || "",
        shiftStart: dbUser.shiftStart || "10:00",
        shiftEnd: dbUser.shiftEnd || "18:00",
        permissions,
        isOnboarded: true,
      },
    });
  } catch (error) {
    console.error("Session endpoint error:", error);
    return NextResponse.json({ authenticated: false, message: "خطأ في السيرفر" }, { status: 500 });
  }
}
