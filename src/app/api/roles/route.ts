import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { customRoles } from "@/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roles = await db.select().from(customRoles).orderBy(customRoles.id);
  return NextResponse.json(roles);
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.nameAr || !Array.isArray(body.permissions)) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const [created] = await db
    .insert(customRoles)
    .values({
      name: body.name || body.nameAr,
      nameAr: body.nameAr,
      permissions: body.permissions,
      isSystem: false,
    })
    .returning();

  return NextResponse.json(created);
}
