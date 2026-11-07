'use server';

import { db } from '@/db';
import { customRoles } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface RoleData {
  id: number;
  name: string;
  nameAr: string;
  permissions: any;
  isSystem: boolean;
  createdAt?: string | Date;
}

export async function getRolesAction(): Promise<RoleData[]> {
  try {
    const rows = await db.select().from(customRoles).orderBy(desc(customRoles.createdAt));
    return rows as unknown as RoleData[];
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
}

export async function getRoleByIdAction(id: string | number): Promise<RoleData | null> {
  try {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    if (isNaN(numericId)) return null;

    const rows = await db
      .select()
      .from(customRoles)
      .where(eq(customRoles.id, numericId))
      .limit(1);

    if (!rows || rows.length === 0) return null;
    return rows[0] as unknown as RoleData;
  } catch (error) {
    console.error('Error fetching role by id:', error);
    return null;
  }
}

export async function createRoleAction(data: {
  name: string;
  nameAr: string;
  permissions: any;
  isSystem?: boolean;
}): Promise<{ success: boolean; message?: string; role?: any }> {
  try {
    const inserted = await db
      .insert(customRoles)
      .values({
        name: data.name,
        nameAr: data.nameAr,
        permissions: data.permissions || {},
        isSystem: Boolean(data.isSystem),
      })
      .returning();

    revalidatePath('/[locale]/admin/roles', 'page');
    return { success: true, role: inserted[0] };
  } catch (error: any) {
    console.error('Error creating role:', error);
    return { success: false, message: error?.message || 'فشل إضافة الدور' };
  }
}

export async function updateRoleAction(
  id: string | number,
  data: Partial<RoleData>
): Promise<{ success: boolean; message?: string }> {
  try {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    if (isNaN(numericId)) return { success: false, message: 'معرف الدور غير صالح' };

    await db
      .update(customRoles)
      .set({
        ...(data.name && { name: data.name }),
        ...(data.nameAr && { nameAr: data.nameAr }),
        ...(data.permissions !== undefined && { permissions: data.permissions }),
        ...(data.isSystem !== undefined && { isSystem: Boolean(data.isSystem) }),
      })
      .where(eq(customRoles.id, numericId));

    revalidatePath('/[locale]/admin/roles', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating role:', error);
    return { success: false, message: error?.message || 'فشل تحديث الدور' };
  }
}

export async function deleteRoleAction(id: string | number): Promise<{ success: boolean; message?: string }> {
  try {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    if (isNaN(numericId)) return { success: false, message: 'معرف الدور غير صالح' };

    await db.delete(customRoles).where(eq(customRoles.id, numericId));
    revalidatePath('/[locale]/admin/roles', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting role:', error);
    return { success: false, message: error?.message || 'فشل حذف الدور' };
  }
}
