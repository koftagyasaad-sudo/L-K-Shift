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

  const condition = sessionUser.id
    ? sql`id::text = ${String(sessionUser.id).trim()}`
    : sql`BTRIM(phone) = ${String(sessionUser.phone).trim()}`;

  const rows = getSqlRows<{ systemRole: string; jobRole: string; phone: string; isActive: boolean }>(
    await db.execute(sql`
      SELECT
        COALESCE(system_role::text, 'EMPLOYEE') AS "systemRole",
        COALESCE(BTRIM(job_role), 'موظف') AS "jobRole",
        COALESCE(BTRIM(phone), '') AS "phone",
        COALESCE(is_active, true) AS "isActive"
      FROM users
      WHERE ${condition}
      LIMIT 1;
    `)
  );

  const u = rows[0];
  if (!u || u.isActive !== true) {
    redirect(`/${locale}/login`);
  }

  const isTrueAdmin =
    u.phone === "01068390982" ||
    u.jobRole === "مدير النظام" ||
    u.jobRole.includes("مدير") ||
    u.jobRole.toUpperCase().includes("HR") ||
    u.jobRole.includes("موارد");

  if (!isTrueAdmin) {
    redirect(`/${locale}/attendance`);
  }

  return <>{children}</>;
}
