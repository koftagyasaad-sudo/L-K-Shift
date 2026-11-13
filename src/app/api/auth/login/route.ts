import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getSqlRows } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { checkRateLimit, clearRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  "lk-shift-super-secret-jwt-key-prod-2026";

export async function POST(req: NextRequest) {
  const rateLimitKey = `login:${getClientIp(req)}`;
  const rateLimit = checkRateLimit(rateLimitKey, 10, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { message: "تم تجاوز عدد محاولات تسجيل الدخول. يرجى الانتظار دقيقة." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const rawPhone = body?.phone || body?.username || "";
    const phone = String(rawPhone).trim();
    const password = String(body?.password || "");

    if (!phone || !password) {
      return NextResponse.json(
        { message: "يرجى إدخال رقم الهاتف وكلمة المرور" },
        { status: 400 }
      );
    }

    const rows = getSqlRows<{
      id: string;
      phone: string;
      fullNameAr: string | null;
      passwordHash: string;
      isActive: boolean;
      systemRole: string;
      jobRole: string;
      primaryBranchId: string | null;
    }>(
      await db.execute(sql`
        SELECT
          id::text AS id,
          BTRIM(phone) AS phone,
          COALESCE(full_name_ar, phone) AS "fullNameAr",
          COALESCE(password_hash, '') AS "passwordHash",
          COALESCE(is_active, true) AS "isActive",
          COALESCE(system_role::text, 'EMPLOYEE') AS "systemRole",
          COALESCE(BTRIM(job_role), 'موظف') AS "jobRole",
          primary_branch_id::text AS "primaryBranchId"
        FROM users
        WHERE BTRIM(phone) = ${phone}
        LIMIT 1;
      `)
    );

    const user = rows[0];
    if (!user) {
      return NextResponse.json({ message: "رقم الهاتف أو كلمة المرور غير صحيحة" }, { status: 401 });
    }

    const isSuperAdmin =
      (user.phone === "01068390982" || user.jobRole === "مدير النظام") &&
      user.isActive === true;

    if (user.isActive !== true || user.jobRole.includes("قيد المراجعة")) {
      return NextResponse.json(
        { message: "حسابك قيد المراجعة حالياً بانتظار التفعيل وتحديد الصلاحيات من الإدارة." },
        { status: 403 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json({ message: "الحساب غير مهيأ بكلمة مرور" }, { status: 401 });
    }

    const verification = await verifyPassword(password, user.passwordHash);
    if (!verification.isValid) {
      return NextResponse.json({ message: "رقم الهاتف أو كلمة المرور غير صحيحة" }, { status: 401 });
    }

    if (verification.needsRehash) {
      try {
        const newHash = await hashPassword(password);
        await db.execute(sql`UPDATE users SET password_hash = ${newHash} WHERE id::text = ${user.id};`);
      } catch {}
    }

    let branchName = "الإدارة";
    if (user.primaryBranchId) {
      try {
        const bRows = getSqlRows<{ nameAr: string | null }>(
          await db.execute(sql`SELECT name_ar AS "nameAr" FROM branches WHERE id::text = ${user.primaryBranchId} LIMIT 1;`)
        );
        if (bRows[0]?.nameAr) branchName = bRows[0].nameAr;
      } catch {}
    }

    let permissions: string[] = [];
    if (isSuperAdmin) {
      permissions = ["*"];
    } else {
      try {
        const rRows = getSqlRows<{ permissions: unknown }>(
          await db.execute(sql`
            SELECT permissions FROM custom_roles
            WHERE BTRIM(name) = ${user.jobRole} OR BTRIM(name_ar) = ${user.jobRole}
            LIMIT 1;
          `)
        );
        const rp = rRows[0]?.permissions;
        if (Array.isArray(rp)) {
          permissions = rp.filter((p): p is string => typeof p === "string");
        } else if (typeof rp === "object" && rp !== null) {
          permissions = Object.entries(rp)
            .filter(([, enabled]) => enabled === true)
            .map(([k]) => k);
        }
      } catch {}
    }

    const tokenPayload = {
      name: user.fullNameAr || user.phone,
      sub: user.id,
      id: user.id,
      phone: user.phone,
      role: user.jobRole,
      systemRole: isSuperAdmin ? "SUPER_ADMIN" : user.systemRole,
      fullNameAr: user.fullNameAr,
      branchId: user.primaryBranchId,
      primaryBranchId: user.primaryBranchId,
    };

    const signedJwt = await encode({
      token: tokenPayload,
      secret: JWT_SECRET,
      maxAge: 30 * 24 * 60 * 60,
    });

    clearRateLimit(rateLimitKey);

    const response = NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        name: user.fullNameAr || user.phone,
        fullName: user.fullNameAr || user.phone,
        phone: user.phone,
        role: user.jobRole,
        systemRole: isSuperAdmin ? "SUPER_ADMIN" : user.systemRole,
        branchId: user.primaryBranchId,
        branchName,
        permissions,
        isOnboarded: true,
      },
    });

    const isHttps = req.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      secure: isHttps,
    };

    // Set both standard and __Secure- NextAuth session cookies on the exact current host
    response.cookies.set("next-auth.session-token", signedJwt, cookieOptions);
    if (isHttps) {
      response.cookies.set("__Secure-next-auth.session-token", signedJwt, {
        ...cookieOptions,
        secure: true,
      });
    }

    return response;
  } catch (error) {
    console.error("Direct Login Error:", error);
    return NextResponse.json({ message: "حدث خطأ أثناء تسجيل الدخول" }, { status: 500 });
  }
}
