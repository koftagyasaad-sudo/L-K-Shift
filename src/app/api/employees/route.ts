import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// 1. استرجاع قائمة الموظفين أو موظف مفرد
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('id');

    if (employeeId) {
      const parsedId = parseInt(employeeId, 10);
      const singleRaw = await db.execute(sql`
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
        WHERE u.id = ${parsedId}
        LIMIT 1;
      `);

      const rows = Array.isArray(singleRaw) ? singleRaw : (singleRaw as any)?.rows || [];
      if (!rows.length) {
        return NextResponse.json({ message: 'الموظف غير موجود' }, { status: 404 });
      }
      return NextResponse.json(rows[0], { status: 200 });
    }

    const allRaw = await db.execute(sql`
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
        b.name_ar as "branchName",
        u.created_at as "createdAt"
      FROM users u
      LEFT JOIN branches b ON u.primary_branch_id = b.id
      ORDER BY u.id ASC;
    `);

    const allRows = Array.isArray(allRaw) ? allRaw : (allRaw as any)?.rows || [];
    return NextResponse.json(allRows, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { message: 'فشل استرجاع بيانات الموظفين', error: error?.message },
      { status: 500 }
    );
  }
}

// 2. إضافة موظف جديد بالحقول الحقيقية فقط لجدول users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = body.name || body.fullName || body.fullNameAr;
    const phone = body.phone ? String(body.phone).trim() : null;
    const password = body.password ? String(body.password).trim() : '123456';
    const role = body.role || 'موظف';
    const branchId = body.branchId ? parseInt(String(body.branchId), 10) : null;
    const basicSalary = parseFloat(body.basicSalary || body.monthlySalary || '0') || 0;
    const annualLeaveDays = parseInt(body.annualLeaveDays || '21', 10) || 21;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    if (!name || !phone) {
      return NextResponse.json(
        { message: 'الاسم ورقم التليفون حقول مطلوبة' },
        { status: 400 }
      );
    }

    const insertResult = await db.execute(sql`
      INSERT INTO users (
        full_name_ar,
        full_name_en,
        phone,
        password_hash,
        job_role,
        primary_branch_id,
        monthly_salary,
        annual_leave_days,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        ${name},
        ${name},
        ${phone},
        ${password},
        ${role},
        ${branchId},
        ${basicSalary},
        ${annualLeaveDays},
        ${isActive},
        NOW(),
        NOW()
      )
      RETURNING id, full_name_ar as name, phone, job_role as role;
    `);

    const rows = Array.isArray(insertResult) ? insertResult : (insertResult as any)?.rows || [];
    return NextResponse.json(
      { message: 'تم حفظ الموظف بنجاح', employee: rows[0] },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { message: 'فشل حفظ بيانات الموظف', error: error?.message },
      { status: 500 }
    );
  }
}

// 3. تحديث بيانات الموظف
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json();
    const rawId = searchParams.get('id') || body.id;

    if (!rawId) {
      return NextResponse.json({ message: 'معرف الموظف مفقود' }, { status: 400 });
    }

    const employeeId = parseInt(String(rawId), 10);
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
        phone = ${phone},
        job_role = ${role},
        primary_branch_id = ${branchId},
        monthly_salary = ${basicSalary},
        annual_leave_days = ${annualLeaveDays},
        is_active = ${isActive},
        updated_at = NOW()
      WHERE id = ${employeeId};
    `);

    return NextResponse.json({ message: 'تم تحديث بيانات الموظف بنجاح' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { message: 'فشل تحديث بيانات الموظف', error: error?.message },
      { status: 500 }
    );
  }
}

// 4. حذف موظف
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get('id');

    if (!rawId) {
      return NextResponse.json({ message: 'معرف الموظف مفقود' }, { status: 400 });
    }

    const employeeId = parseInt(String(rawId), 10);
    await db.execute(sql`DELETE FROM users WHERE id = ${employeeId};`);
    return NextResponse.json({ message: 'تم حذف الموظف بنجاح' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { message: 'فشل حذف الموظف', error: error?.message },
      { status: 500 }
    );
  }
}
