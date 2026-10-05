import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { customRoles, customRoleAssignments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  await db
    .update(customRoles)
    .set({ nameAr: body.nameAr, permissions: body.permissions })
    .where(eq(customRoles.id, Number(id)));

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const roleId = Number(id);

  const [role] = await db.select().from(customRoles).where(eq(customRoles.id, roleId)).limit(1);
  if (role?.isSystem) {
    return NextResponse.json({ error: "لا يمكن حذف صلاحية نظامية" }, { status: 400 });
  }

  await db.delete(customRoleAssignments).where(eq(customRoleAssignments.roleId, roleId));
  await db.delete(customRoles).where(eq(customRoles.id, roleId));

  return NextResponse.json({ success: true });
}
