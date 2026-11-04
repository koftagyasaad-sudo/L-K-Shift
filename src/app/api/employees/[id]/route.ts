import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// 1. استرجاع موظف بالمعرف
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ message: 'معرف الموظف مطلوب' }, { status: 400 });
    }

    const employeeId = parseInt(id, 10);
    const raw = await db.execute(sql`
      SELECT 
        u.id,
        u.full_name_ar as name,
        u.full_name_ar as "fullName",
        u.phone,
        u.job_role as role,
        u.primary_branch_id as "branchId",
        u.monthly_salary as "basicSalary",
        u.annual_leave_days as "annualLeaveDays",
        u.is_active as "isActive",
        b.name_ar as "branchName"
      FROM users u
      LEFT JOIN branches b ON u.primary_branch_id = b.id
      WHERE u.id = ${employeeId}
      LIMIT 1;
    `);

    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    if (!rows.length) {
      return NextResponse.json({ message: 'الموظف غير موجود' }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error: any) {
    console.error('Error fetching employee by ID:', error);
    return NextResponse.json(
      { message: 'خطأ أثناء استرجاع بيانات الموظف', error: error?.message },
      { status: 500 }
    );
  }
}

// 2. تحديث موظف بالمعرف
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ message: 'معرف الموظف مفقود' }, { status: 400 });
    }

    const employeeId = parseInt(id, 10);
    const body = await request.json();

    const name = body.name || body.fullName || body.fullNameAr;
    const phone = body.phone ? String(body.phone).trim() : null;
    const role = body.role || 'موظف';
    const branchId = body.branchId ? parseInt(String(body.branchId), 10) : null;
    const basicSalary = parseFloat(body.basicSalary || body.monthlySalary || '0') || 0;
    const annualLeaveDays = parseInt(body.annualLeaveDays || '21', 10) || 21;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    await db.execute(sql`
      UPDATE users
      SET 
        full_name_ar = ${name},
        full_name_en = ${name},
        name = ${name},
        phone = ${phone},
        job_role = ${role},
        role = ${role},
        primary_branch_id = ${branchId},
        branch_id = ${branchId},
        monthly_salary = ${basicSalary},
        annual_leave_days = ${annualLeaveDays},
        is_active = ${isActive},
        updated_at = NOW()
      WHERE id = ${employeeId};
    `);

    return NextResponse.json({ message: 'تم تحديث بيانات الموظف بنجاح' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating employee by ID:', error);
    return NextResponse.json(
      { message: 'فشل تحديث بيانات الموظف', error: error?.message },
      { status: 500 }
    );
  }
}

// 3. حذف موظف
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ message: 'معرف الموظف مفقود' }, { status: 400 });
    }

    const employeeId = parseInt(id, 10);
    await db.execute(sql`DELETE FROM users WHERE id = ${employeeId};`);
    return NextResponse.json({ message: 'تم حذف الموظف بنجاح' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting employee by ID:', error);
    return NextResponse.json(
      { message: 'فشل حذف الموظف', error: error?.message },
      { status: 500 }
    );
  }
}
