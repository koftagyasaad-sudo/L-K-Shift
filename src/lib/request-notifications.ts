import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getSqlRows } from "@/lib/db";

type RequestReviewerGroup = "management" | "hr-management";

async function notificationsTableExists(): Promise<boolean> {
  const rows = getSqlRows<{ tableName: string | null }>(
    await db.execute(sql`SELECT to_regclass('public.notifications')::text AS "tableName";`)
  );
  if (rows[0]?.tableName) return true;
  console.warn("Request notification skipped: public.notifications does not exist.");
  return false;
}

export async function notifyRequestReviewers(
  senderId: string,
  title: string,
  message: string,
  link: string,
  group: RequestReviewerGroup
): Promise<void> {
  if (!(await notificationsTableExists())) return;

  const roles = group === "hr-management"
    ? sql`system_role = 'SUPER_ADMIN' OR job_role ILIKE '%مدير النظام%' OR job_role ILIKE '%HR%' OR job_role ILIKE '%موارد بشرية%'`
    : sql`system_role = 'SUPER_ADMIN' OR job_role ILIKE '%مدير%' OR job_role ILIKE '%HR%'`;
  await db.execute(sql`
    INSERT INTO notifications (user_id, title, message, link, is_read, created_at)
    SELECT id::text, ${title}, ${message}, ${link}, false, NOW()
    FROM users
    WHERE (${roles}) AND id::text <> ${senderId};
  `);
}

export async function notifyRequestOwner(
  userId: string,
  title: string,
  message: string,
  link: string
): Promise<void> {
  if (!(await notificationsTableExists())) return;
  await db.execute(sql`
    INSERT INTO notifications (user_id, title, message, link, is_read, created_at)
    VALUES (${userId}, ${title}, ${message}, ${link}, false, NOW());
  `);
}
