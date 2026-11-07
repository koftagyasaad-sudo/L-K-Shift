'use server';

import { db } from '@/db';
import { users, branches } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface EmployeeData {
  id: number;
  name: string;
  fullName?: string;
  fullNameAr?: string;
  fullNameEn?: string | null;
  phone: string;
  role: string;
  jobRole?: string;
  systemRole?: string;
  employeeCode?: string | null;
  employeeNumber?: string | null;
  branchId?: number | null;
  branchName?: string | null;
  basicSalary?: number;
  monthlySalary?: number | string | null;
  workingHoursPerDay?: number;
  annualLeaveDays?: number;
  nationalId?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  verificationMode?: string;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export async function getEmployeesAction(): Promise<EmployeeData[]> {
  try {
    const rows = await db
      .select({
        id: users.id,
        fullNameAr: users.fullNameAr,
        fullNameEn: users.fullNameEn,
        phone: users.phone,
        jobRole: users.jobRole,
        systemRole: users.systemRole,
        employeeCode: users.employeeCode,
        employeeNumber: users.employeeNumber,
        primaryBranchId: users.primaryBranchId,
        monthlySalary: users.monthlySalary,
        workingHoursPerDay: users.workingHoursPerDay,
        nationalId: users.nationalId,
        address: users.address,
        emergencyContact: users.emergencyContact,
        verificationMode: users.verificationMode,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        branchName: branches.nameAr,
      })
      .from(users)
      .leftJoin(branches, eq(users.primaryBranchId, branches.id))
      .orderBy(desc(users.createdAt));

    return rows.map((u) => ({
      id: u.id,
      name: u.fullNameAr,
      fullName: u.fullNameAr,
      fullNameAr: u.fullNameAr,
      fullNameEn: u.fullNameEn,
      phone: u.phone,
      role: u.jobRole || 'موظف',
      jobRole: u.jobRole,
      systemRole: u.systemRole,
      employeeCode: u.employeeCode || u.employeeNumber || String(u.id),
      employeeNumber: u.employeeNumber,
      branchId: u.primaryBranchId,
      branchName: u.branchName || 'الفرع الرئيسي',
      basicSalary: Number(u.monthlySalary) || 0,
      monthlySalary: u.monthlySalary,
      workingHoursPerDay: u.workingHoursPerDay || 8,
      annualLeaveDays: 21,
      nationalId: u.nationalId,
      address: u.address,
      emergencyContact: u.emergencyContact,
      verificationMode: u.verificationMode || 'QR_GPS',
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
}

export async function getEmployeeByIdAction(id: string | number): Promise<EmployeeData | null> {
  try {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    if (isNaN(numericId)) return null;

    const result = await db
      .select({
        id: users.id,
        fullNameAr: users.fullNameAr,
        fullNameEn: users.fullNameEn,
        phone: users.phone,
        jobRole: users.jobRole,
        systemRole: users.systemRole,
        employeeCode: users.employeeCode,
        employeeNumber: users.employeeNumber,
        primaryBranchId: users.primaryBranchId,
        monthlySalary: users.monthlySalary,
        workingHoursPerDay: users.workingHoursPerDay,
        nationalId: users.nationalId,
        address: users.address,
        emergencyContact: users.emergencyContact,
        verificationMode: users.verificationMode,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        branchName: branches.nameAr,
      })
      .from(users)
      .leftJoin(branches, eq(users.primaryBranchId, branches.id))
      .where(eq(users.id, numericId))
      .limit(1);

    if (!result || result.length === 0) return null;
    const u = result[0];

    return {
      id: u.id,
      name: u.fullNameAr,
      fullName: u.fullNameAr,
      fullNameAr: u.fullNameAr,
      fullNameEn: u.fullNameEn,
      phone: u.phone,
      role: u.jobRole || 'موظف',
      jobRole: u.jobRole,
      systemRole: u.systemRole,
      employeeCode: u.employeeCode || u.employeeNumber || String(u.id),
      employeeNumber: u.employeeNumber,
      branchId: u.primaryBranchId,
      branchName: u.branchName || 'الفرع الرئيسي',
      basicSalary: Number(u.monthlySalary) || 0,
      monthlySalary: u.monthlySalary,
      workingHoursPerDay: u.workingHoursPerDay || 8,
      annualLeaveDays: 21,
      nationalId: u.nationalId,
      address: u.address,
      emergencyContact: u.emergencyContact,
      verificationMode: u.verificationMode || 'QR_GPS',
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching employee by id:', error);
    return null;
  }
}

export async function updateEmployeeAction(
  id: string | number,
  data: Partial<EmployeeData>
): Promise<{ success: boolean; message?: string }> {
  try {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    if (isNaN(numericId)) return { success: false, message: 'معرف الموظف غير صالح' };

    await db
      .update(users)
      .set({
        ...(data.fullNameAr && { fullNameAr: data.fullNameAr }),
        ...(data.fullName && { fullNameAr: data.fullName }),
        ...(data.phone && { phone: data.phone }),
        ...(data.jobRole && { jobRole: data.jobRole }),
        ...(data.role && { jobRole: data.role }),
        ...(data.branchId !== undefined && { primaryBranchId: data.branchId }),
        ...(data.basicSalary !== undefined && { monthlySalary: String(data.basicSalary) }),
        ...(data.workingHoursPerDay !== undefined && { workingHoursPerDay: Number(data.workingHoursPerDay) }),
        ...(data.nationalId !== undefined && { nationalId: data.nationalId }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.emergencyContact !== undefined && { emergencyContact: data.emergencyContact }),
        ...(data.employeeCode !== undefined && { employeeCode: data.employeeCode }),
        ...(data.verificationMode !== undefined && { verificationMode: data.verificationMode as any }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, numericId));

    revalidatePath('/[locale]/admin/employees', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return { success: false, message: error?.message || 'فشل تحديث بيانات الموظف' };
  }
}

export async function deleteEmployeeAction(id: string | number): Promise<{ success: boolean; message?: string }> {
  try {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    if (isNaN(numericId)) return { success: false, message: 'معرف الموظف غير صالح' };

    await db.delete(users).where(eq(users.id, numericId));
    revalidatePath('/[locale]/admin/employees', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return { success: false, message: error?.message || 'فشل حذف الموظف' };
  }
}
