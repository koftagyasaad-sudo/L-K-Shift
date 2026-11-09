import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { customRoles } from "@/db/schema";
import { authorizeApi, canAccessBranch } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ id: string }> };

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function parsePermissions(value: unknown): string[] | null {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value;
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value)
      .filter(([, enabled]) => enabled === true)
      .map(([permission]) => permission);
  }
  return null;
}

function parseBranchIds(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const ids = value.map(Number);
  return ids.every((id) => Number.isSafeInteger(id) && id > 0) ? ids : null;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const authorization = await authorizeApi("roles.view");
  if ("response" in authorization) return authorization.response;

  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ message: "معرف الدور غير صالح." }, { status: 400 });

  try {
    const [role] = await db.select().from(customRoles).where(eq(customRoles.id, id)).limit(1);
    if (!role) return NextResponse.json({ message: "الدور غير موجود." }, { status: 404 });
    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error("Role GET error:", error);
    return NextResponse.json({ message: "تعذر تحميل بيانات الدور." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const authorization = await authorizeApi("roles.manage");
  if ("response" in authorization) return authorization.response;

  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ message: "معرف الدور غير صالح." }, { status: 400 });

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ message: "بيانات الدور غير صالحة." }, { status: 400 });
    }

    const [currentRole] = await db.select().from(customRoles).where(eq(customRoles.id, id)).limit(1);
    if (!currentRole) return NextResponse.json({ message: "الدور غير موجود." }, { status: 404 });
    const isSuperAdmin = authorization.principal.systemRole === "SUPER_ADMIN";
    if (currentRole.isSystem && !isSuperAdmin) {
      return NextResponse.json({ message: "لا يمكن تعديل دور نظامي." }, { status: 403 });
    }

    const values = body as Record<string, unknown>;
    const update: Partial<typeof customRoles.$inferInsert> = {};
    const name = values.name ?? values.nameEn;
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ message: "اسم الدور غير صالح." }, { status: 400 });
      }
      update.name = name.trim();
    }
    if (values.nameAr !== undefined) {
      if (typeof values.nameAr !== "string" || !values.nameAr.trim()) {
        return NextResponse.json({ message: "اسم الدور العربي غير صالح." }, { status: 400 });
      }
      update.nameAr = values.nameAr.trim();
    }
    if (values.permissions !== undefined) {
      const permissions = parsePermissions(values.permissions);
      if (!permissions || permissions.includes("*")) {
        return NextResponse.json({ message: "قائمة الصلاحيات غير صالحة." }, { status: 400 });
      }
      if (!isSuperAdmin && permissions.some((permission) => !authorization.principal.permissions.includes(permission))) {
        return NextResponse.json({ message: "لا يمكن منح صلاحيات غير متاحة لك." }, { status: 403 });
      }
      update.permissions = permissions;
    }

    const branchScope = values.branchScope;
    if (branchScope !== undefined) {
      if (branchScope !== "ALL" && branchScope !== "OWN_BRANCH" && branchScope !== "CUSTOM") {
        return NextResponse.json({ message: "نطاق الفروع غير صالح." }, { status: 400 });
      }
      if (!isSuperAdmin && branchScope === "ALL" && authorization.principal.branchScope !== "ALL") {
        return NextResponse.json({ message: "لا يمكن توسيع نطاق الفروع." }, { status: 403 });
      }
      update.branchScope = branchScope;
    }

    const allowedBranchIds = values.allowedBranchIds;
    if (allowedBranchIds !== undefined) {
      const ids = parseBranchIds(allowedBranchIds);
      if (!ids) return NextResponse.json({ message: "قائمة الفروع غير صالحة." }, { status: 400 });
      if (!isSuperAdmin && ids.some((branchId) => !canAccessBranch(authorization.principal, branchId))) {
        return NextResponse.json({ message: "لا يمكن منح نطاق فروع غير متاح لك." }, { status: 403 });
      }
      update.allowedBranchIds = ids;
    }
    if (!isSuperAdmin) {
      const effectiveScope = update.branchScope ?? currentRole.branchScope;
      const effectiveBranchIds = update.allowedBranchIds ?? currentRole.allowedBranchIds;
      if (effectiveScope === "ALL" && authorization.principal.branchScope !== "ALL") {
        return NextResponse.json({ message: "لا يمكن توسيع نطاق الفروع." }, { status: 403 });
      }
      if (effectiveBranchIds.some((branchId) => !canAccessBranch(authorization.principal, branchId))) {
        return NextResponse.json({ message: "لا يمكن منح نطاق فروع غير متاح لك." }, { status: 403 });
      }
    }
    update.updatedAt = new Date();

    const [updatedRole] = await db
      .update(customRoles)
      .set(update)
      .where(and(eq(customRoles.id, id), isSuperAdmin ? undefined : eq(customRoles.isSystem, false)))
      .returning();

    if (!updatedRole) return NextResponse.json({ message: "الدور غير موجود." }, { status: 404 });
    return NextResponse.json({ success: true, data: updatedRole });
  } catch (error) {
    console.error("Role PUT error:", error);
    return NextResponse.json({ message: "تعذر تحديث الدور." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const authorization = await authorizeApi("roles.manage");
  if ("response" in authorization) return authorization.response;

  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ message: "معرف الدور غير صالح." }, { status: 400 });

  try {
    const isSuperAdmin = authorization.principal.systemRole === "SUPER_ADMIN";
    const [deletedRole] = await db
      .delete(customRoles)
      .where(and(
        eq(customRoles.id, id),
        isSuperAdmin ? undefined : eq(customRoles.isSystem, false)
      ))
      .returning();

    if (!deletedRole) return NextResponse.json({ message: "الدور غير موجود أو لا يمكن حذفه." }, { status: 404 });
    return NextResponse.json({ success: true, data: deletedRole });
  } catch (error) {
    console.error("Role DELETE error:", error);
    return NextResponse.json({ message: "تعذر حذف الدور." }, { status: 500 });
  }
}
