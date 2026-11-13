import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getResilientSessionUser } from "@/lib/resilient-session";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getSqlRows } from "@/lib/db";

export const dynamic = "force-dynamic";

interface AdminLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale === "en" ? "en" : "ar";

  const sessionUser = await getResilientSessionUser();
  if (!sessionUser || (!sessionUser.id && !sessionUser.phone)) {
    redirect(`/${locale}/login`);
  }

  // Verify role resiliently without crashing on missing columns
  let isAllowed =
    sessionUser.systemRole === "SUPER_ADMIN" ||
    sessionUser.role === "مدير النظام" ||
    sessionUser.role === "SUPER_ADMIN" ||
    String(sessionUser.role || "").includes("مدير") ||
    String(sessionUser.role || "").includes("HR") ||
    String(sessionUser.role || "").includes("موارد");

  if (!isAllowed) {
    try {
      const condition = sessionUser.id
        ? sql`id::text = ${String(sessionUser.id).trim()}`
        : sql`BTRIM(phone) = ${String(sessionUser.phone).trim()}`;

      const rows = getSqlRows<{ systemRole: string; jobRole: string }>(
        await db.execute(sql`
          SELECT
            COALESCE(system_role::text, 'EMPLOYEE') AS "systemRole",
            COALESCE(BTRIM(job_role), 'موظف') AS "jobRole"
          FROM users
          WHERE ${condition}
          LIMIT 1;
        `)
      );
      const u = rows[0];
      if (u) {
        if (
          u.systemRole !== "EMPLOYEE" ||
          u.jobRole === "مدير النظام" ||
          u.jobRole.includes("مدير") ||
          u.jobRole.includes("مشرف") ||
          u.jobRole.toUpperCase().includes("HR") ||
          u.jobRole.includes("موارد")
        ) {
          isAllowed = true;
        } else {
          const roleRows = getSqlRows<{ permissions: unknown }>(
            await db.execute(sql`
              SELECT permissions FROM custom_roles
              WHERE BTRIM(name) = ${u.jobRole} OR BTRIM(name_ar) = ${u.jobRole}
              LIMIT 1;
            `)
          );
          const perms = roleRows[0]?.permissions;
          if (Array.isArray(perms) && perms.length > 0) isAllowed = true;
          else if (typeof perms === "object" && perms !== null && Object.values(perms).some(Boolean)) {
            isAllowed = true;
          }
        }
      }
    } catch {
      isAllowed = true;
    }
  }

  if (!isAllowed) {
    redirect(`/${locale}/attendance`);
  }

  return <>{children}</>;
}
