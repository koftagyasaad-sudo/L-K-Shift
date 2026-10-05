import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { attendanceLogs, users, adminBranchScopes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviewerId = Number(session.user.id);
  const isSuperAdmin = session.user.systemRole === "SUPER_ADMIN";
  const { id } = await params;
  const logId = Number(id);
  const body = await request.json();
  const { type, decision, notes } = body as {
    type: "checkIn" | "checkOut";
    decision: "APPROVED" | "REJECTED";
    notes?: string;
  };

  if (!["checkIn", "checkOut"].includes(type) || !["APPROVED", "REJECTED"].includes(decision)) {
    return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
  }

  const [log] = await db.select().from(attendanceLogs).where(eq(attendanceLogs.id, logId)).limit(1);
  if (!log) {
    return NextResponse.json({ error: "السجل غير موجود" }, { status: 404 });
  }

  if (!isSuperAdmin) {
    const [currentUser] = await db.select().from(users).where(eq(users.id, reviewerId)).limit(1);
    if (!currentUser || currentUser.managementRole === "NONE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const scopes = await db.select().from(adminBranchScopes).where(eq(adminBranchScopes.userId, reviewerId));
    const allowedBranchIds = scopes.map((s) => s.branchId);
    if (currentUser.primaryBranchId) allowedBranchIds.push(currentUser.primaryBranchId);

    if (!allowedBranchIds.includes(log.branchId)) {
      return NextResponse.json({ error: "لا تملك صلاحية مراجعة هذا الفرع" }, { status: 403 });
    }
  }

  const updateData =
    type === "checkIn"
      ? {
          checkInApprovalStatus: decision,
          checkInReviewedBy: reviewerId,
          checkInReviewedAt: new Date(),
          checkInReviewNotes: notes ?? null,
        }
      : {
          checkOutApprovalStatus: decision,
          checkOutReviewedBy: reviewerId,
          checkOutReviewedAt: new Date(),
          checkOutReviewNotes: notes ?? null,
        };

  await db.update(attendanceLogs).set(updateData).where(eq(attendanceLogs.id, logId));

  return NextResponse.json({ success: true });
}
