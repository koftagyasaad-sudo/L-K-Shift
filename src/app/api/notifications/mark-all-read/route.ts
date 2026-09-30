import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ ok: false }, { status: 401 });
  }

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, Number(session.user.id)), eq(notifications.isRead, false)));

  return Response.json({ ok: true });
}
