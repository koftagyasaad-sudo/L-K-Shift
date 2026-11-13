import { getResilientSessionUser } from "@/lib/resilient-session";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { getSqlRows } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionUser = await getResilientSessionUser();
    const session = sessionUser ? { user: sessionUser } : null;

    const phone = sessionUser?.phone ? String(sessionUser.phone).trim() : null;
    const rawId = sessionUser?.id ? String(sessionUser.id).trim() : null;

    if (!session || (!phone && !rawId)) {
      return NextResponse.json({ authenticated: false, message: "غير مصرح" }, { status: 401 });
    }

    // 1. Safe core user query (only guaranteed columns)
    let dbUser: {
      id: string;
      phone: string;
      fullNameAr: string | null;
      jobRole: string | null;
      systemRole: string | null;
      primaryBranchId: string | null;
      isActive: boolean | null;
    } | undefined;

    try {
      const condition = rawId ? sql`id::text = ${rawId}` : sql`BTRIM(phone) = ${phone}`;
      const userRows = getSqlRows<NonNullable<typeof dbUser>>(await db.execute(sql`
        SELECT
          id::text AS id,
          BTRIM(phone) AS phone,
          full_name_ar AS "fullNameAr",
          COALESCE(BTRIM(job_role), 'موظف') AS "jobRole",
          COALESCE(system_role::text, 'EMPLOYEE') AS "systemRole",
          primary_branch_id::text AS "primaryBranchId",
          COALESCE(is_active, true) AS "isActive"
        FROM users
        WHERE ${condition}
        LIMIT 1;
      `));
      dbUser = userRows[0];
    } catch (dbErr) {
      console.error("Primary user lookup error, falling back to JWT session:", dbErr);
      dbUser = {
        id: rawId || phone || "1",
        phone: phone || "",
        fullNameAr: sessionUser?.name || phone,
        jobRole: sessionUser?.role || "مدير النظام",
        systemRole: sessionUser?.systemRole || "SUPER_ADMIN",
        primaryBranchId: sessionUser?.branchId || null,
        isActive: true,
      };
    }

    if (!dbUser || dbUser.isActive !== true || String(dbUser.jobRole || "").includes("قيد المراجعة")) {
      return NextResponse.json({ authenticated: false, message: "غير مصرح" }, { status: 401 });
    }

    // 2. Isolated optional branch lookup (never crashes session if column is missing)
    let branchName = "الإدارة";
    const shiftStart = "10:00";
    const shiftEnd = "18:00";

    if (dbUser.primaryBranchId) {
      try {
        const bRows = getSqlRows<{ nameAr: string | null }>(await db.execute(sql`
          SELECT name_ar AS "nameAr"
          FROM branches
          WHERE id::text = ${dbUser.primaryBranchId}
          LIMIT 1;
        `));
        if (bRows[0]?.nameAr) {
          branchName = bRows[0].nameAr;
        }
      } catch {}
    }

    const isSuperAdmin =
      dbUser.phone === "01068390982" ||
      dbUser.jobRole === "مدير النظام";

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

    const displayName = dbUser.fullNameAr || sessionUser?.name || dbUser.phone;

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
