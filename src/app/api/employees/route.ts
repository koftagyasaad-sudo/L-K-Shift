// src/app/api/employees/route.ts
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { auth } from "@/auth";
import { db } from "@/db";
import { adminBranchScopes, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allUsers = await db.select().from(users).orderBy(users.id);
  return NextResponse.json({ users: allUsers });
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  } = body as {
    fullNameAr?: string;
    fullNameEn?: string;
    phone?: string;
    nationalId?: string;
    address?: string;
    governorate?: string;
    employeeNumber?: string;
    jobRole?: string;
    primaryBranchId?: number | string;
    password?: string;
    managementRole?: "NONE" | "BRANCH_MANAGER" | "AREA_MANAGER";
    managedBranchIds?: number[];
  };

  if (!fullNameAr || !phone || !jobRole || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existingPhone = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);

  if (existingPhone.length > 0) {
    return NextResponse.json({ error: "Phone number already exists" }, { status: 409 });
  }

  const passwordHash = await hash(String(password), 10);

  const [created] = await db
    .insert(users)
    .values({
      fullNameAr,
      fullNameEn: fullNameEn || null,
      phone,
      nationalId: nationalId || null,
      address: address || null,
      governorate: governorate || null,
      employeeNumber: employeeNumber || null,
      passwordHash,
      systemRole: "EMPLOYEE",
      jobRole,
      primaryBranchId: primaryBranchId ? Number(primaryBranchId) : null,
      managementRole: managementRole ?? "NONE",
    })
    .returning();

  if (
    managementRole &&
    managementRole !== "NONE" &&
    Array.isArray(managedBranchIds) &&
    managedBranchIds.length > 0
  ) {
    await db.insert(adminBranchScopes).values(
      managedBranchIds.map((branchId) => ({
        userId: created.id,
        branchId: Number(branchId),
      })),
    );
  }

  return NextResponse.json({ user: created }, { status: 201 });
}
