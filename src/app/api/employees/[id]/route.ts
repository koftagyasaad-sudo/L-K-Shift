import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { authorizeApi, canAccessBranch, hasApiPermission } from '@/lib/api-auth';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// 1. استرجاع موظف بالمعرف
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authorization = await authorizeApi();
    if ('response' in authorization) return authorization.response;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ message: 'معرف الموظف مطلوب' }, { status: 400 });
    }

    const employeeId = Number(id);
    if (!Number.isSafeInteger(employeeId) || employeeId < 1) {
      return NextResponse.json({ message: 'معرف الموظف غير صالح' }, { status: 400 });
    }
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

    const employee = rows[0];
    if (
      employeeId !== authorization.principal.id &&
      !hasApiPermission(authorization.principal, 'employees.view')
    ) {
      return NextResponse.json({ message: 'ممنوع' }, { status: 403 });
    }
    const employeeBranchId = employee.branchId == null ? null : Number(employee.branchId);
    if (
      employeeId !== authorization.principal.id &&
      !canAccessBranch(authorization.principal, employeeBranchId)
    ) {
      return NextResponse.json({ message: 'ممنوع' }, { status: 403 });
    }
    if (
      employeeId !== authorization.principal.id &&
      !hasApiPermission(authorization.principal, 'payroll.view') &&
      !hasApiPermission(authorization.principal, 'reports.view')
    ) {
      employee.basicSalary = 0;
    }

    return NextResponse.json(employee, { status: 200 });
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
    const authorization = await authorizeApi('employees.manage');
    if ('response' in authorization) return authorization.response;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ message: 'معرف الموظف مفقود' }, { status: 400 });
    }

    const employeeId = Number(id);
    if (!Number.isSafeInteger(employeeId) || employeeId < 1) {
      return NextResponse.json({ message: 'معرف الموظف غير صالح' }, { status: 400 });
    }
    const body = await request.json();

    const name = body.name || body.fullName || body.fullNameAr;
    const phone = body.phone ? String(body.phone).trim() : null;
    const role = body.role || 'موظف';
    const branchId = body.branchId ? parseInt(String(body.branchId), 10) : null;
    const basicSalary = parseFloat(body.basicSalary || body.monthlySalary || '0') || 0;
    const annualLeaveDays = parseInt(body.annualLeaveDays || '21', 10) || 21;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    const currentRaw = await db.execute(sql`
      SELECT COALESCE(primary_branch_id, branch_id) AS branch_id
      FROM users WHERE id = ${employeeId} LIMIT 1;
    `);
    const currentRows = Array.isArray(currentRaw) ? currentRaw : (currentRaw as any)?.rows || [];
    if (!currentRows.length) {
      return NextResponse.json({ message: 'الموظف غير موجود' }, { status: 404 });
    }
    const currentBranchId = currentRows[0].branch_id == null ? null : Number(currentRows[0].branch_id);
    if (!canAccessBranch(authorization.principal, currentBranchId)) {
      return NextResponse.json({ message: 'ممنوع' }, { status: 403 });
    }
    if (branchId !== null && !canAccessBranch(authorization.principal, branchId)) {
      return NextResponse.json({ message: 'ممنوع' }, { status: 403 });
    }

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
    const authorization = await authorizeApi('employees.manage');
    if ('response' in authorization) return authorization.response;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ message: 'معرف الموظف مفقود' }, { status: 400 });
    }

    const employeeId = Number(id);
    if (!Number.isSafeInteger(employeeId) || employeeId < 1) {
      return NextResponse.json({ message: 'معرف الموظف غير صالح' }, { status: 400 });
    }
    const currentRaw = await db.execute(sql`
      SELECT COALESCE(primary_branch_id, branch_id) AS branch_id
      FROM users WHERE id = ${employeeId} LIMIT 1;
    `);
    const currentRows = Array.isArray(currentRaw) ? currentRaw : (currentRaw as any)?.rows || [];
    if (!currentRows.length) {
      return NextResponse.json({ message: 'الموظف غير موجود' }, { status: 404 });
    }
    const currentBranchId = currentRows[0].branch_id == null ? null : Number(currentRows[0].branch_id);
    if (!canAccessBranch(authorization.principal, currentBranchId)) {
      return NextResponse.json({ message: 'ممنوع' }, { status: 403 });
    }
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
