import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { attendanceLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCairoDateString } from "@/lib/date";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const workDate = new Date(getCairoDateString());

  const [record] = await db
    .select()
    .from(attendanceLogs)
    .where(and(eq(attendanceLogs.userId, userId), eq(attendanceLogs.workDate, workDate)))
    .limit(1);

  return NextResponse.json({ record: record ?? null });
}
