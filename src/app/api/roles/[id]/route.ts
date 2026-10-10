// src/app/api/roles/[id]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { customRoles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [role] = await db
    .select()
    .from(customRoles)
    .where(eq(customRoles.id, Number(id)))
    .limit(1);

  if (!role) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(role);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  if (!body.nameAr || !Array.isArray(body.permissions)) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const [updated] = await db
    .update(customRoles)
    .set({
      name: body.name || body.nameAr,
      nameAr: body.nameAr,
      permissions: body.permissions,
    })
    .where(eq(customRoles.id, Number(id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [role] = await db
    .select()
    .from(customRoles)
    .where(eq(customRoles.id, Number(id)))
    .limit(1);

  if (role?.isSystem) {
    return NextResponse.json(
      { error: "لا يمكن حذف دور نظامي أساسي" },
      { status: 400 }
    );
  }

  await db.delete(customRoles).where(eq(customRoles.id, Number(id)));
  return NextResponse.json({ success: true });
}
