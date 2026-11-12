import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getSqlRows } from "@/lib/db";

export type RequestRoutingChannel =
  | "COMPLAINT"
  | "ADVANCE"
  | "LEAVE_PERMISSION"
  | "PENALTY"
  | "STAFF_REQUEST"
  | "management"
  | "hr-management";

async function notificationsTableExists(): Promise<boolean> {
  const rows = getSqlRows<{ tableName: string | null }>(
    await db.execute(sql`SELECT to_regclass('public.notifications')::text AS "tableName";`)
  );
  return Boolean(rows[0]?.tableName);
}

export async function notifyRequestReviewers(
  senderId: string,
  title: string,
  message: string,
  link: string,
  channel: RequestRoutingChannel,
  targetBranchId?: string | null
): Promise<void> {
  if (!(await notificationsTableExists())) return;

  const hrSysOwner = sql`
    system_role = 'SUPER_ADMIN'
    OR job_role ILIKE '%مدير النظام%'
    OR job_role ILIKE '%مسؤول النظام%'
    OR job_role ILIKE '%HR%'
    OR job_role ILIKE '%موارد بشرية%'
    OR job_role ILIKE '%اونر%'
    OR job_role ILIKE '%أونر%'
    OR job_role ILIKE '%owner%'
    OR job_role ILIKE '%مالك%'
  `;

  const opsManager = sql`job_role ILIKE '%مدير تشغيل%' OR job_role ILIKE '%مدير التشغيل%' OR job_role ILIKE '%operations%'`;
  const financeManager = sql`job_role ILIKE '%مدير مالي%' OR job_role ILIKE '%المدير المالي%' OR job_role ILIKE '%مالية%' OR job_role ILIKE '%finance%'`;
  const branchManager = targetBranchId
    ? sql`(
        id::text IN (SELECT manager_id::text FROM branches WHERE id::text = ${targetBranchId} AND manager_id IS NOT NULL)
        OR (
          (job_role ILIKE '%مدير%' OR job_role ILIKE '%مشرف%')
          AND COALESCE(primary_branch_id::text, branch_id::text) = ${targetBranchId}
        )
      )`
    : sql`(job_role ILIKE '%مدير فرع%' OR job_role ILIKE '%مدير%')`;

  let recipientCondition = hrSysOwner;
  if (channel === "COMPLAINT" || channel === "PENALTY" || channel === "STAFF_REQUEST" || channel === "hr-management") {
    recipientCondition = hrSysOwner;
  } else if (channel === "ADVANCE") {
    recipientCondition = sql`(${hrSysOwner}) OR (${opsManager}) OR (${financeManager}) OR (${branchManager})`;
  } else {
    // LEAVE_PERMISSION or management: Direct/Branch Manager + Operations Manager + HR + System Admin + Owner
    recipientCondition = sql`(${hrSysOwner}) OR (${opsManager}) OR (${branchManager})`;
  }

  await db.execute(sql`
    INSERT INTO notifications (user_id, title, message, link, is_read, created_at)
    SELECT DISTINCT id::text, ${title}, ${message}, ${link}, false, NOW()
    FROM users
    WHERE is_active = true
      AND (${recipientCondition})
      AND id::text <> ${senderId};
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
