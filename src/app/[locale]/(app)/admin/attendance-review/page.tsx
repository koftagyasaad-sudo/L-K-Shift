import { auth } from "@/auth";
import { db } from "@/db";
import { users, adminBranchScopes, attendanceLogs, branches } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { redirect } from "@/i18n/navigation";
import { AttendanceReviewList } from "@/components/admin/attendance-review-list";

export default async function AttendanceReviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect({ href: "/login", locale });
    return null;
  }

  const userId = Number(session.user.id);
  const isSuperAdmin = session.user.systemRole === "SUPER_ADMIN";

  let branchIds: number[] | null = null;

  if (!isSuperAdmin) {
    const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!currentUser || currentUser.managementRole === "NONE") {
      redirect({ href: "/employee/profile", locale });
      return null;
    }

    const scopes = await db.select().from(adminBranchScopes).where(eq(adminBranchScopes.userId, userId));
    branchIds = scopes.map((s) => s.branchId);
    if (currentUser.primaryBranchId && !branchIds.includes(currentUser.primaryBranchId)) {
      branchIds.push(currentUser.primaryBranchId);
    }
  }

  const allLogs =
    branchIds && branchIds.length === 0
      ? []
      : branchIds
        ? await db.select().from(attendanceLogs).where(inArray(attendanceLogs.branchId, branchIds))
        : await db.select().from(attendanceLogs);

  const filtered = allLogs.filter(
    (log) => log.checkInApprovalStatus === "PENDING_REVIEW" || log.checkOutApprovalStatus === "PENDING_REVIEW"
  );

  const userIds = Array.from(new Set(filtered.map((l) => l.userId)));
  const branchIdsUsed = Array.from(new Set(filtered.map((l) => l.branchId)));

  const relatedUsers = userIds.length ? await db.select().from(users).where(inArray(users.id, userIds)) : [];
  const relatedBranches = branchIdsUsed.length
    ? await db.select().from(branches).where(inArray(branches.id, branchIdsUsed))
    : [];

  const userMap = new Map(relatedUsers.map((u) => [u.id, u]));
  const branchMap = new Map(relatedBranches.map((b) => [b.id, b]));

  const items = filtered.map((log) => ({
    id: log.id,
    employeeName: userMap.get(log.userId)?.fullNameAr ?? "—",
    employeeNameEn: userMap.get(log.userId)?.fullNameEn ?? null,
    branchNameAr: branchMap.get(log.branchId)?.nameAr ?? "—",
    branchNameEn: branchMap.get(log.branchId)?.nameEn ?? "—",
    workDate: String(log.workDate),
    checkInTime: log.checkInTime ? log.checkInTime.toISOString() : null,
    checkInPhotoUrl: log.checkInPhotoUrl,
    checkInApprovalStatus: log.checkInApprovalStatus,
    checkInDistance: log.checkInDistance !== null ? Math.round(log.checkInDistance) : null,
    checkOutTime: log.checkOutTime ? log.checkOutTime.toISOString() : null,
    checkOutPhotoUrl: log.checkOutPhotoUrl,
    checkOutApprovalStatus: log.checkOutApprovalStatus,
    checkOutDistance: log.checkOutDistance !== null ? Math.round(log.checkOutDistance) : null,
  }));

  const isAr = locale === "ar";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isAr ? "مراجعة طلبات الحضور" : "Attendance Review"}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {isAr
            ? "راجع طلبات الحضور والانصراف التي تعذر تأكيد موقعها تلقائيًا"
            : "Review check-in/out requests that could not be auto-verified"}
        </p>
      </div>

      <AttendanceReviewList locale={locale as "ar" | "en"} items={items} />
    </div>
  );
}
