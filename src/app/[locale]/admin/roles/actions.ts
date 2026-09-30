"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { adminBranchScopes, auditLogs, customRoles } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/auth-guards";
import { slugify } from "@/lib/utils";

export async function createRoleAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ar");
  const session = await requireSuperAdmin(locale);

  const name = slugify(String(formData.get("name") ?? ""));
  const nameAr = String(formData.get("nameAr") ?? "").trim();
  const permissions = formData.getAll("permissions").map((value) => String(value));

  if (!name || !nameAr || permissions.length === 0) {
    return;
  }

  await db.insert(customRoles).values({
    name,
    nameAr,
    permissions,
    isSystem: false,
  });

  await db.insert(auditLogs).values({
    userId: Number(session.user.id),
    action: "ROLE_CREATED",
    entityType: "custom_roles",
  });

  revalidatePath(`/${locale}/admin/roles`);
}

export async function assignBranchScopeAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ar");
  const session = await requireSuperAdmin(locale);
  const userId = Number(formData.get("userId"));
  const branchId = Number(formData.get("branchId"));

  if (!userId || !branchId) {
    return;
  }

  await db
    .insert(adminBranchScopes)
    .values({ userId, branchId })
    .onConflictDoNothing();

  await db.insert(auditLogs).values({
    userId: Number(session.user.id),
    action: "ADMIN_BRANCH_SCOPE_ASSIGNED",
    entityType: "admin_branch_scopes",
    entityId: branchId,
  });

  revalidatePath(`/${locale}/admin/roles`);
}
