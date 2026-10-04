// src/app/api/employees/[id]/route.ts
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { auth } from "@/auth";
import { db } from "@/db";
import { adminBranchScopes, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const userId = Number(id);

  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const body = await request.json();
  const {
    fullNameAr,
    fullNameEn,
    phone,
    nationalId,
    address,
    governorate,
    employeeNumber,
    jobRole,
    primaryBranchId,
    password,
    managementRole,
    managedBranchIds,
    isActive,
  } = body as {
    fullNameAr?: string;
    fullNameEn?: string | null;
    phone?: string;
    nationalId?: string | null;
    address?: string | null;
    governorate?: string | null;
    employeeNumber?: string | null;
    jobRole?: string;
    primaryBranchId?: number | string | null;
    password?: string;
    managementRole?: "NONE" | "BRANCH_MANAGER" | "AREA_MANAGER";
    managedBranchIds?: number[];
    isActive?: boolean;
  };

  const updateData: Record<string, unknown> = {};
  if (fullNameAr !== undefined) updateData.fullNameAr = fullNameAr;
  if (fullNameEn !== undefined) updateData.fullNameEn = fullNameEn || null;
  if (phone !== undefined) updateData.phone = phone;
  if (nationalId !== undefined) updateData.nationalId = nationalId || null;
  if (address !== undefined) updateData.address = address || null;
  if (governorate !== undefined) updateData.governorate = governorate || null;
  if (employeeNumber !== undefined) updateData.employeeNumber = employeeNumber || null;
  if (jobRole !== undefined) updateData.jobRole = jobRole;
  if (primaryBranchId !== undefined) {
    updateData.primaryBranchId = primaryBranchId ? Number(primaryBranchId) : null;
  }
  if (managementRole !== undefined) updateData.managementRole = managementRole;
  if (isActive !== undefined) updateData.isActive = Boolean(isActive);
  if (password) updateData.passwordHash = await hash(String(password), 10);

  if (Object.keys(updateData).length > 0) {
    await db.update(users).set(updateData).where(eq(users.id, userId));
  }

  if (managementRole !== undefined) {
    await db.delete(adminBranchScopes).where(eq(adminBranchScopes.userId, userId));

    if (managementRole !== "NONE" && Array.isArray(managedBranchIds) && managedBranchIds.length > 0) {
      await db.insert(adminBranchScopes).values(
        managedBranchIds.map((branchId) => ({
          userId,
          branchId: Number(branchId),
        })),
      );
    }
  }

  const [updated] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return NextResponse.json({ user: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const userId = Number(id);

  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  if (session.user.id && Number(session.user.id) === userId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  // حذف ناعم (تعطيل) بدل الحذف الفعلي، عشان نحافظ على سجلات الحضور التاريخية
  await db.update(users).set({ isActive: false }).where(eq(users.id, userId));

  return NextResponse.json({ success: true });
}
