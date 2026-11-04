import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, branches } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

// 1. استرجاع قائمة الموظفين
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    let query = db
      .select({
        id: users.id,
        name: users.name,
        fullName: users.fullName,
        fullNameAr: users.fullNameAr,
        phone: users.phone,
        role: users.role,
        branchId: users.branchId,
        jobTitle: users.jobTitle,
        employeeCode: users.employeeCode,
        basicSalary: users.basicSalary,
        annualLeaveDays: users.annualLeaveDays,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    const employeeList = await query;
    return NextResponse.json(employeeList, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { message: 'فشل استرجاع بيانات الموظفين', error: error?.message },
      { status: 500 }
    );
  }
}

// 2. إنشاء موظف جديد وتأمين كافة أعمدة البصمة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = body.name || body.fullName || body.fullNameAr;
    const phone = body.phone ? String(body.phone).trim() : null;
    const password = body.password ? String(body.password).trim() : '123456';
    const role = body.role || 'employee';
    const branchId = body.branchId || body.branch_id || null;
    const employeeCode = body.employeeCode || body.code || null;
    const basicSalary = Number(body.basicSalary || body.base_salary || 0);
    const annualLeaveDays = Number(body.annualLeaveDays || 21);
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;
    const canUseAttendanceTerminal = body.canUseAttendanceTerminal !== undefined ? Boolean(body.canUseAttendanceTerminal) : true;

    if (!name || !phone) {
      return NextResponse.json(
        { message: 'الاسم الكامل ورقم التليفون حقول مطلوبة' },
        { status: 400 }
      );
    }

    // إدراج الموظف في جدول users مع مطابقة الأعمدة
    const newEmployee = await db
      .insert(users)
      .values({
        name,
        fullName: name,
        fullNameAr: name,
        phone,
        password,
        passwordHash: password,
        role,
        branchId,
        employeeCode,
        code: employeeCode,
        basicSalary,
        baseSalary: basicSalary,
        annualLeaveDays,
        isActive,
        canUseAttendanceTerminal,
        status: isActive ? 'active' : 'inactive',
      })
      .returning();

    return NextResponse.json(
      { message: 'تم حفظ الموظف بنجاح', employee: newEmployee[0] },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      {
        message: error?.message || 'فشل حفظ بيانات الموظف في قاعدة البيانات',
        error: error?.message,
      },
      { status: 500 }
    );
  }
}
