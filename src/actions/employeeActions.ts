'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export type EmployeeData = {
  id: string;
  phone: string;
  password?: string;
  name?: string | null;
  fullNameAr?: string | null;
  fullNameEn?: string | null;
  email?: string | null;
  role?: string;
  systemRole?: string;
  jobTitle?: string | null;
  employeeCode?: string | null;
  hourlyRate?: number | null;
  monthlySalary?: number | null;
  avatarUrl?: string | null;
  gender?: string | null;
  nationalId?: string | null;
  branchId?: string | null;
  primaryBranchId?: string | null;
  roleId?: string | null;
  isActive: boolean;
  notes?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export async function getEmployeesAction(): Promise<EmployeeData[]> {
  try {
    const rawUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    return rawUsers.map((u: any) => ({
      id: String(u.id),
      phone: String(u.phone || ''),
      password: String(u.password || ''),
      name: u.fullNameAr ?? u.name ?? u.phone,
      fullNameAr: u.fullNameAr ?? u.name ?? null,
      fullNameEn: u.fullNameEn ?? null,
      email: u.email ?? null,
      role: u.role ?? 'employee',
      systemRole: u.systemRole ?? u.role ?? 'employee',
      jobTitle: u.jobTitle ?? null,
      employeeCode: u.employeeCode ?? null,
      hourlyRate: u.hourlyRate !== null && u.hourlyRate !== undefined ? Number(u.hourlyRate) : null,
      monthlySalary: u.monthlySalary !== null && u.monthlySalary !== undefined ? Number(u.monthlySalary) : null,
      avatarUrl: u.avatarUrl ?? null,
      gender: u.gender ?? null,
      nationalId: u.nationalId ?? null,
      branchId: u.branchId ? String(u.branchId) : u.primaryBranchId ? String(u.primaryBranchId) : null,
      primaryBranchId: u.primaryBranchId ? String(u.primaryBranchId) : u.branchId ? String(u.branchId) : null,
      roleId: u.roleId ? String(u.roleId) : null,
      isActive: Boolean(u.isActive ?? true),
      notes: u.notes ?? null,
      createdAt: u.createdAt ? new Date(u.createdAt) : null,
      updatedAt: u.updatedAt ? new Date(u.updatedAt) : null,
    }));
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
}

export async function getEmployeeByIdAction(id: string): Promise<EmployeeData | null> {
  try {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!result || result.length === 0) return null;
    const u: any = result[0];
    return {
      id: String(u.id),
      phone: String(u.phone || ''),
      password: String(u.password || ''),
      name: u.fullNameAr ?? u.name ?? u.phone,
      fullNameAr: u.fullNameAr ?? u.name ?? null,
      fullNameEn: u.fullNameEn ?? null,
      email: u.email ?? null,
      role: u.role ?? 'employee',
      systemRole: u.systemRole ?? u.role ?? 'employee',
      jobTitle: u.jobTitle ?? null,
      employeeCode: u.employeeCode ?? null,
      hourlyRate: u.hourlyRate !== null && u.hourlyRate !== undefined ? Number(u.hourlyRate) : null,
      monthlySalary: u.monthlySalary !== null && u.monthlySalary !== undefined ? Number(u.monthlySalary) : null,
      avatarUrl: u.avatarUrl ?? null,
      gender: u.gender ?? null,
      nationalId: u.nationalId ?? null,
      branchId: u.branchId ? String(u.branchId) : u.primaryBranchId ? String(u.primaryBranchId) : null,
      primaryBranchId: u.primaryBranchId ? String(u.primaryBranchId) : u.branchId ? String(u.branchId) : null,
      roleId: u.roleId ? String(u.roleId) : null,
      isActive: Boolean(u.isActive ?? true),
      notes: u.notes ?? null,
      createdAt: u.createdAt ? new Date(u.createdAt) : null,
      updatedAt: u.updatedAt ? new Date(u.updatedAt) : null,
    };
  } catch (error) {
    console.error(`Error fetching employee with ID ${id}:`, error);
    return null;
  }
}

export async function saveEmployeeAction(data: Partial<EmployeeData> & { phone: string }) {
  try {
    const {
      id,
      phone,
      password,
      fullNameAr,
      fullNameEn,
      name,
      email,
      role,
      systemRole,
      jobTitle,
      employeeCode,
      hourlyRate,
      monthlySalary,
      branchId,
      primaryBranchId,
      roleId,
      isActive,
      notes,
    } = data;

    const resolvedNameAr = fullNameAr || name || 'موظف جديد';
    const resolvedNameEn = fullNameEn || null;
    const resolvedBranchId = branchId || primaryBranchId || null;

    if (id) {
      const updateData: Record<string, any> = {
        phone,
        name: resolvedNameAr,
        fullNameAr: resolvedNameAr,
        fullNameEn: resolvedNameEn,
        email: email || null,
        role: role || 'employee',
        systemRole: systemRole || role || 'employee',
        jobTitle: jobTitle || null,
        employeeCode: employeeCode || null,
        hourlyRate: hourlyRate !== undefined && hourlyRate !== null ? Number(hourlyRate) : null,
        monthlySalary: monthlySalary !== undefined && monthlySalary !== null ? Number(monthlySalary) : null,
        branchId: resolvedBranchId,
        primaryBranchId: resolvedBranchId,
        roleId: roleId || null,
        isActive: isActive !== undefined ? isActive : true,
        notes: notes || null,
        updatedAt: new Date(),
      };

      if (password && password.trim() !== '') {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await db.update(users).set(updateData).where(eq(users.id, id));
      return { success: true, message: 'تم تحديث بيانات الموظف بنجاح', id };
    } else {
      const hashedPassword = await bcrypt.hash(password && password.trim() !== '' ? password : '123456', 10);
      
      const insertData: Record<string, any> = {
        phone,
        password: hashedPassword,
        name: resolvedNameAr,
        fullNameAr: resolvedNameAr,
        fullNameEn: resolvedNameEn,
        email: email || null,
        role: role || 'employee',
        systemRole: systemRole || role || 'employee',
        jobTitle: jobTitle || null,
        employeeCode: employeeCode || null,
        hourlyRate: hourlyRate !== undefined && hourlyRate !== null ? Number(hourlyRate) : null,
        monthlySalary: monthlySalary !== undefined && monthlySalary !== null ? Number(monthlySalary) : null,
        branchId: resolvedBranchId,
        primaryBranchId: resolvedBranchId,
        roleId: roleId || null,
        isActive: isActive !== undefined ? isActive : true,
        notes: notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newUsers = await db.insert(users).values(insertData as any).returning({ id: users.id });
      const newId = newUsers[0]?.id ? String(newUsers[0].id) : undefined;
      return { success: true, message: 'تم إنشاء الموظف بنجاح', id: newId };
    }
  } catch (error: any) {
    console.error('Error saving employee:', error);
    return { success: false, error: error?.message || 'فشل في حفظ بيانات الموظف' };
  }
}

export async function createEmployeeAction(data: Partial<EmployeeData> & { phone: string }) {
  return saveEmployeeAction(data);
}

export async function updateEmployeeAction(id: string, data: Partial<EmployeeData> & { phone: string }) {
  return saveEmployeeAction({ ...data, id });
}

export async function deleteEmployeeAction(id: string) {
  try {
    await db.delete(users).where(eq(users.id, id));
    return { success: true, message: 'تم حذف الموظف بنجاح' };
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return { success: false, error: error?.message || 'فشل في حذف الموظف' };
  }
}

export async function toggleEmployeeStatusAction(id: string, currentStatus: boolean) {
  try {
    await db.update(users).set({ isActive: !currentStatus, updatedAt: new Date() }).where(eq(users.id, id));
    return { success: true, message: 'تم تغيير حالة الموظف بنجاح' };
  } catch (error: any) {
    console.error('Error toggling employee status:', error);
    return { success: false, error: error?.message || 'فشل في تغيير حالة الموظف' };
  }
}
