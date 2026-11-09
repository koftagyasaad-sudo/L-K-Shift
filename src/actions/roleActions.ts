'use server';

import { db } from '@/db';
import { customRoles } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { hasApiPermission, requireApiPrincipal } from '@/lib/api-auth';
import type { ApiPrincipal } from '@/lib/api-auth';

export interface RoleData {
  id: number;
  name: string;
  nameAr: string;
  nameEn?: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isActive?: boolean;
  createdAt?: string | Date;
}

function parsePermissions(value: unknown): string[] | null {
  if (Array.isArray(value) && value.every((permission) => typeof permission === 'string')) {
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value)
      .filter(([, enabled]) => enabled === true)
      .map(([permission]) => permission);
  }
  return null;
}

function canGrantPermissions(principal: ApiPrincipal, permissions: string[]): boolean {
  return principal.systemRole === 'SUPER_ADMIN'
    || permissions.every((permission) => hasApiPermission(principal, permission));
}

async function assertEditableRole(id: number, principal: ApiPrincipal, allowSystem = true) {
  const [role] = await db
    .select({ isSystem: customRoles.isSystem })
    .from(customRoles)
    .where(eq(customRoles.id, id))
    .limit(1);
  if (!role) throw new Error('الدور غير موجود');
  if (role.isSystem && (!allowSystem || principal.systemRole !== 'SUPER_ADMIN')) {
    throw new Error('لا يمكن تعديل دور نظامي');
  }
}

export async function getRolesAction(): Promise<RoleData[]> {
  await requireApiPrincipal(['roles.view', 'roles.manage']);
  try {
    const rows = await db.select().from(customRoles).orderBy(desc(customRoles.createdAt));
    return rows.map((role) => ({
      ...role,
      nameEn: role.name,
      permissions: parsePermissions(role.permissions) || [],
      isActive: true,
    }));
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw new Error('تعذر تحميل الأدوار');
  }
}

export async function getRoleByIdAction(id: string | number): Promise<RoleData | null> {
  const principal = await requireApiPrincipal(['roles.view', 'roles.manage']);
  const numericId = typeof id === 'string' ? Number(id) : id;
  if (!Number.isSafeInteger(numericId) || numericId < 1) return null;
  try {
    const rows = await db
      .select()
      .from(customRoles)
      .where(eq(customRoles.id, numericId))
      .limit(1);
    const role = rows[0];
    if (!role) return null;
    if (role.isSystem && principal.systemRole !== 'SUPER_ADMIN') {
      throw new Error('لا يمكن الوصول إلى دور نظامي');
    }
    return {
      ...role,
      nameEn: role.name,
      permissions: parsePermissions(role.permissions) || [],
      isActive: true,
    };
  } catch (error) {
    console.error('Error fetching role by id:', error);
    throw new Error('تعذر تحميل الدور');
  }
}

export async function createRoleAction(data: {
  name: string;
  nameAr: string;
  permissions: unknown;
  isSystem?: boolean;
}): Promise<{ success: boolean; message?: string; role?: RoleData }> {
  const principal = await requireApiPrincipal('roles.manage');
  const permissions = parsePermissions(data.permissions);
  if (!permissions || permissions.includes('*') || !canGrantPermissions(principal, permissions)) {
    return { success: false, message: 'قائمة الصلاحيات غير صالحة أو تتجاوز صلاحياتك' };
  }
  if (data.isSystem && principal.systemRole !== 'SUPER_ADMIN') {
    return { success: false, message: 'لا يمكن إنشاء دور نظامي' };
  }
  try {
    const [role] = await db
      .insert(customRoles)
      .values({
        name: data.name.trim(),
        nameAr: data.nameAr.trim(),
        permissions,
        isSystem: Boolean(data.isSystem),
        branchScope: principal.branchScope,
        allowedBranchIds: principal.branchScope === 'CUSTOM' ? principal.allowedBranchIds : [],
      })
      .returning();
    revalidatePath('/[locale]/admin/roles', 'page');
    return { success: true, role: { ...role, nameEn: role.name, permissions, isActive: true } };
  } catch (error) {
    console.error('Error creating role:', error);
    return { success: false, message: 'فشل إضافة الدور' };
  }
}

export async function updateRoleAction(
  id: string | number,
  data: Partial<RoleData>
): Promise<{ success: boolean; message?: string }> {
  const principal = await requireApiPrincipal('roles.manage');
  const numericId = typeof id === 'string' ? Number(id) : id;
  if (!Number.isSafeInteger(numericId) || numericId < 1) {
    return { success: false, message: 'معرف الدور غير صالح' };
  }
  await assertEditableRole(numericId, principal);
  const permissions = data.permissions === undefined ? undefined : parsePermissions(data.permissions);
  if (data.permissions !== undefined
    && (!permissions || permissions.includes('*') || !canGrantPermissions(principal, permissions))) {
    return { success: false, message: 'قائمة الصلاحيات غير صالحة أو تتجاوز صلاحياتك' };
  }
  try {
    await db
      .update(customRoles)
      .set({
        ...(data.name && { name: data.name.trim() }),
        ...(data.nameAr && { nameAr: data.nameAr.trim() }),
        ...(permissions && { permissions }),
        updatedAt: new Date(),
      })
      .where(eq(customRoles.id, numericId));

    revalidatePath('/[locale]/admin/roles', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating role:', error);
    return { success: false, message: 'فشل تحديث الدور' };
  }
}

export async function deleteRoleAction(id: string | number): Promise<{ success: boolean; message?: string }> {
  const principal = await requireApiPrincipal('roles.manage');
  const numericId = typeof id === 'string' ? Number(id) : id;
  if (!Number.isSafeInteger(numericId) || numericId < 1) {
    return { success: false, message: 'معرف الدور غير صالح' };
  }
  await assertEditableRole(numericId, principal, false);
  try {
    await db.delete(customRoles).where(eq(customRoles.id, numericId));
    revalidatePath('/[locale]/admin/roles', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error deleting role:', error);
    return { success: false, message: 'فشل حذف الدور' };
  }
}

export async function saveRoleAction(data: {
  id?: string;
  nameAr: string;
  nameEn: string;
  permissions: string[];
}) {
  const name = data.nameEn.trim() || data.nameAr.trim();
  return data.id
    ? updateRoleAction(data.id, { name, nameAr: data.nameAr, permissions: data.permissions })
    : createRoleAction({ name, nameAr: data.nameAr, permissions: data.permissions });
}
