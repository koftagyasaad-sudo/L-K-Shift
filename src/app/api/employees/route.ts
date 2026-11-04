import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

// 1. استرجاع قائمة الموظفين
export async function GET(request: NextRequest) {
  try {
    const employeeList = await db
      .select({
        id: users.id,
        name: users.name,
        fullName: users.fullName,
        fullNameAr: users.fullNameAr,
        phone: users.phone,
        role: users.role,
        branchId: users.branchId,
        employeeCode: users.employeeCode,
        basicSalary: users.basicSalary,
        annualLeaveDays: users.annualLeaveDays,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return NextResponse.json(employeeList, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { message: 'فشل استرجاع بيانات الموظفين', error: error?.message },
      { status: 500 }
    );
  }
}

// 2. إضافة موظف جديد بالأعمدة الفعلية المعتمدة فقط
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

    if (!name || !phone) {
      return NextResponse.json(
        { message: 'الاسم الكامل ورقم التليفون حقول مطلوبة' },
        { status: 400 }
      );
    }

    // إدراج الموظف في جدول users دون أي حقول غير معرّفة
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

// 3. تحديث بيانات موظف قائم
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json();
    const id = searchParams.get('id') || body.id;

    if (!id) {
      return NextResponse.json({ message: 'معرف الموظف مفقود' }, { status: 400 });
    }

    const name = body.name || body.fullName || body.fullNameAr;
    const phone = body.phone ? String(body.phone).trim() : null;
    const role = body.role || 'employee';
    const branchId = body.branchId || body.branch_id || null;
    const employeeCode = body.employeeCode || body.code || null;
    const basicSalary = Number(body.basicSalary || body.base_salary || 0);
    const annualLeaveDays = Number(body.annualLeaveDays || 21);
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    const updateData: any = {
      name,
      fullName: name,
      fullNameAr: name,
      phone,
      role,
      branchId,
      employeeCode,
      code: employeeCode,
      basicSalary,
      baseSalary: basicSalary,
      annualLeaveDays,
      isActive,
      updatedAt: new Date(),
    };

    if (body.password) {
      updateData.password = body.password;
      updateData.passwordHash = body.password;
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    return NextResponse.json({ message: 'تم تحديث بيانات الموظف بنجاح' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { message: 'فشل تحديث بيانات الموظف', error: error?.message },
      { status: 500 }
    );
  }
}
