import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, adminBranchScopes, customRoleAssignments } from "@/db/schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

async function checkAdmin() {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") return null;
  return session;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const [user] = await db.select().from(users).where(eq(users.id, Number(id))).limit(1);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scopes = await db.select().from(adminBranchScopes).where(eq(adminBranchScopes.userId, user.id));
  const assignments = await db
    .select()
    .from(customRoleAssignments)
    .where(eq(customRoleAssignments.userId, user.id));

  return NextResponse.json({
    ...user,
    passwordHash: undefined,
    managedBranchIds: scopes.map((s) => s.branchId),
    customRoleIds: assignments.map((a) => a.roleId),
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const userId = Number(id);
  const body = await request.json();

  const updateData: Record<string, unknown> = {
    fullNameAr: body.fullNameAr,
    fullNameEn: body.fullNameEn || null,
    phone: body.phone,
    nationalId: body.nationalId || null,
    address: body.address || null,
    governorate: body.governorate || null,
    employeeNumber: body.employeeNumber || null,
    jobRole: body.jobRole,
    primaryBranchId: body.primaryBranchId ? Number(body.primaryBranchId) : null,
    managementRole: body.managementRole || "NONE",
    isActive: body.isActive ?? true,
  };

  if (body.password) {
    updateData.passwordHash = await hash(body.password, 10);
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));

  await db.delete(adminBranchScopes).where(eq(adminBranchScopes.userId, userId));
  if (Array.isArray(body.managedBranchIds) && body.managedBranchIds.length > 0) {
    await db.insert(adminBranchScopes).values(
      body.managedBranchIds.map((branchId: number) => ({ userId, branchId }))
    );
  }

  await db.delete(customRoleAssignments).where(eq(customRoleAssignments.userId, userId));
  if (Array.isArray(body.customRoleIds) && body.customRoleIds.length > 0) {
    await db.insert(customRoleAssignments).values(
      body.customRoleIds.map((roleId: number) => ({ userId, roleId }))
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const userId = Number(id);

  if (Number(session.user.id) === userId) {
    return NextResponse.json({ error: "لا يمكنك حذف حسابك الخاص" }, { status: 400 });
  }

  await db.delete(users).where(eq(users.id, userId));
  return NextResponse.json({ success: true });
}
