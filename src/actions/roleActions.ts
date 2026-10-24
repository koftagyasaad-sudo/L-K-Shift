'use server';

import { db } from "@/db";
import { roles, customRoles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type RoleData = {
  id: string;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  description?: string | null;
  permissions?: string[] | any;
  isActive: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export async function getRolesAction(): Promise<RoleData[]> {
  try {
    const rawRoles = await db.select().from(customRoles).orderBy(desc(customRoles.createdAt));
    return rawRoles.map((r: any) => ({
      id: String(r.id),
      name: r.nameAr || r.name || r.nameEn || '',
      nameAr: r.nameAr || r.name || null,
      nameEn: r.nameEn || null,
      description: r.description || null,
      permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : (r.permissions || []),
      isActive: Boolean(r.isActive ?? true),
      createdAt: r.createdAt ? new Date(r.createdAt) : null,
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : null,
    }));
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
}

export async function getRoleByIdAction(id: string): Promise<RoleData | null> {
  try {
    const result = await db.select().from(customRoles).where(eq(customRoles.id, id)).limit(1);
    if (!result || result.length === 0) return null;
    const r: any = result[0];
    return {
      id: String(r.id),
      name: r.nameAr || r.name || r.nameEn || '',
      nameAr: r.nameAr || r.name || null,
      nameEn: r.nameEn || null,
      description: r.description || null,
      permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : (r.permissions || []),
      isActive: Boolean(r.isActive ?? true),
      createdAt: r.createdAt ? new Date(r.createdAt) : null,
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : null,
    };
  } catch (error) {
    console.error(`Error fetching role with ID ${id}:`, error);
    return null;
  }
}

export async function saveRoleAction(data: Partial<RoleData> & { name: string }) {
  try {
    const { id, name, nameAr, nameEn, description, permissions, isActive } = data;
    const resolvedName = nameAr || name || 'دور جديد';
    const resolvedPermissions = Array.isArray(permissions) ? permissions : (permissions ? [permissions] : []);

    if (id) {
      await db.update(customRoles).set({
        name: resolvedName,
        nameAr: resolvedName,
        nameEn: nameEn || null,
        description: description || null,
        permissions: resolvedPermissions,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      }).where(eq(customRoles.id, id));

      revalidatePath('/admin/roles');
      return { success: true, message: 'تم تحديث الدور بنجاح', id };
    } else {
      const newRoles = await db.insert(customRoles).values({
        name: resolvedName,
        nameAr: resolvedName,
        nameEn: nameEn || null,
        description: description || null,
        permissions: resolvedPermissions,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any).returning({ id: customRoles.id });

      const newId = newRoles[0]?.id ? String(newRoles[0].id) : undefined;
      revalidatePath('/admin/roles');
      return { success: true, message: 'تم إنشاء الدور بنجاح', id: newId };
    }
  } catch (error: any) {
    console.error('Error saving role:', error);
    return { success: false, error: error?.message || 'فشل في حفظ بيانات الدور' };
  }
}

export async function createRoleAction(data: Partial<RoleData> & { name: string }) {
  return saveRoleAction(data);
}

export async function updateRoleAction(id: string, data: Partial<RoleData> & { name: string }) {
  return saveRoleAction({ ...data, id });
}

export async function deleteRoleAction(id: string) {
  try {
    await db.delete(customRoles).where(eq(customRoles.id, id));
    revalidatePath('/admin/roles');
    return { success: true, message: 'تم حذف الدور بنجاح' };
  } catch (error: any) {
    console.error('Error deleting role:', error);
    return { success: false, error: error?.message || 'فشل في حذف الدور' };
  }
}

export async function toggleRoleStatusAction(id: string, currentStatus: boolean) {
  try {
    await db.update(customRoles).set({ isActive: !currentStatus, updatedAt: new Date() }).where(eq(customRoles.id, id));
    revalidatePath('/admin/roles');
    return { success: true, message: 'تم تغيير حالة الدور بنجاح' };
  } catch (error: any) {
    console.error('Error toggling role status:', error);
    return { success: false, error: error?.message || 'فشل في تغيير حالة الدور' };
  }
}
