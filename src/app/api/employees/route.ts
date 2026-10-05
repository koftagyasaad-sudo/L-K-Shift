import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, adminBranchScopes, customRoleAssignments } from "@/db/schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allUsers = await db.select().from(users).orderBy(users.id);
  const allScopes = await db.select().from(adminBranchScopes);
  const allAssignments = await db.select().from(customRoleAssignments);

  const result = allUsers.map((u) => ({
    ...u,
    passwordHash: undefined,
    managedBranchIds: allScopes.filter((s) => s.userId === u.id).map((s) => s.branchId),
    customRoleIds: allAssignments.filter((a) => a.userId === u.id).map((a) => a.roleId),
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  if (!body.fullNameAr || !body.phone || !body.jobRole || !body.password) {
    return NextResponse.json({ error: "البيانات المطلوبة ناقصة" }, { status: 400 });
  }

  const existing = await db.select().from(users).where(eq(users.phone, body.phone)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "رقم الهاتف مستخدم بالفعل" }, { status: 400 });
  }

  const passwordHash = await hash(body.password, 10);

  const [created] = await db
    .insert(users)
    .values({
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
      passwordHash,
      systemRole: "EMPLOYEE",
      isActive: body.isActive ?? true,
    })
    .returning();

  if (Array.isArray(body.managedBranchIds) && body.managedBranchIds.length > 0) {
    await db.insert(adminBranchScopes).values(
      body.managedBranchIds.map((branchId: number) => ({ userId: created.id, branchId }))
    );
  }

  if (Array.isArray(body.customRoleIds) && body.customRoleIds.length > 0) {
    await db.insert(customRoleAssignments).values(
      body.customRoleIds.map((roleId: number) => ({ userId: created.id, roleId }))
    );
  }

  return NextResponse.json({ success: true, id: created.id });
}
