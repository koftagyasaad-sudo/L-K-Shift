import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getSqlRows } from "@/lib/db";
import { getResilientSessionUser } from "@/lib/resilient-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface NotifRow extends Record<string, unknown> {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  link: string | null;
  type: string | null;
  is_read: boolean;
  created_at: string;
}

let notifSchemaReady = false;
async function ensureNotificationsTable() {
  if (notifSchemaReady) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id serial PRIMARY KEY,
        user_id text,
        title text NOT NULL DEFAULT 'إشعار جديد',
        message text NOT NULL DEFAULT '',
        link text DEFAULT '/admin/dashboard',
        type text DEFAULT 'SYSTEM',
        is_read boolean DEFAULT false,
        created_at timestamptz DEFAULT NOW()
      );
    `);
  } catch {}
  const cols = [
    sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id text`,
    sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title text DEFAULT 'إشعار جديد'`,
    sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message text DEFAULT ''`,
    sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link text DEFAULT '/admin/dashboard'`,
    sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type text DEFAULT 'SYSTEM'`,
    sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false`,
    sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT NOW()`,
  ];
  for (const c of cols) {
    try { await db.execute(c); } catch {}
  }
  notifSchemaReady = true;
}

export async function GET() {
  try {
    const sessionUser = await getResilientSessionUser();
    if (!sessionUser || (!sessionUser.id && !sessionUser.phone)) {
      return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 401 });
    }

    await ensureNotificationsTable();

    const uid = sessionUser.id ? String(sessionUser.id).trim() : "";
    const isAdmin =
      sessionUser.systemRole === "SUPER_ADMIN" ||
      sessionUser.role === "مدير النظام" ||
      sessionUser.phone === "01068390982";

    const rows = getSqlRows(
      await db.execute(
        isAdmin
          ? sql`
              SELECT
                id::text AS id,
                user_id::text AS user_id,
                COALESCE(title, 'إشعار نظام') AS title,
                COALESCE(message, '') AS message,
                COALESCE(link, '/admin/dashboard') AS link,
                COALESCE(type, 'SYSTEM') AS type,
                COALESCE(is_read, false) AS is_read,
                created_at
              FROM notifications
              WHERE user_id::text = ${uid} OR user_id IS NULL OR user_id = '' OR type IN ('STAFF_REQUEST', 'LEAVE_REQUEST', 'ATTENDANCE_ALERT')
              ORDER BY created_at DESC
              LIMIT 30;
            `
          : sql`
              SELECT
                id::text AS id,
                user_id::text AS user_id,
                COALESCE(title, 'إشعار نظام') AS title,
                COALESCE(message, '') AS message,
                COALESCE(link, '/attendance') AS link,
                COALESCE(type, 'SYSTEM') AS type,
                COALESCE(is_read, false) AS is_read,
                created_at
              FROM notifications
              WHERE user_id::text = ${uid}
              ORDER BY created_at DESC
              LIMIT 30;
            `
      )
    );

    const formatted = rows.map((r) => ({
      id: r.id,
      title: r.title,
      message: r.message,
      link: r.link || "/admin/dashboard",
      type: r.type || "SYSTEM",
      isRead: Boolean(r.is_read),
      createdAt: r.created_at,
    }));

    const unreadCount = formatted.filter((n) => !n.isRead).length;
    return NextResponse.json({ notifications: formatted, unreadCount }, { status: 200 });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await getResilientSessionUser();
    if (!sessionUser) return NextResponse.json({ success: false }, { status: 401 });
    await ensureNotificationsTable();

    const body = await request.json().catch(() => ({}));
    if (body.markAll) {
      const uid = sessionUser.id ? String(sessionUser.id).trim() : "";
      await db.execute(sql`UPDATE notifications SET is_read = true WHERE user_id::text = ${uid} OR user_id IS NULL OR is_read = false;`);
    } else if (body.id) {
      await db.execute(sql`UPDATE notifications SET is_read = true WHERE id::text = ${String(body.id).trim()};`);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
