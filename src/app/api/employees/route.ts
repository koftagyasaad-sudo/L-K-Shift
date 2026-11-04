import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// 1. استرجاع قائمة الموظفين المتوافقة تماماً مع قاعدة بيانات Neon
export async function GET() {
  try {
    const raw = await db.execute(sql`
      SELECT 
        u.id,
        u.full_name_ar as name,
        u.full_name_ar as "fullName",
        u.phone,
        u.job_role as role,
        u.job_role as "jobRole",
        u.primary_branch_id as "branchId",
        u.is_active as "isActive",
        b.name_ar as "branchName",
        u.created_at as "createdAt"
      FROM users u
      LEFT JOIN branches b ON u.primary_branch_id = b.id
      ORDER BY u.id ASC;
    `);

    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { message: 'فشل استرجاع بيانات الموظفين', error: error?.message },
      { status: 500 }
    );
  }
}

// 2. إضافة موظف جديد بالحقول الحقيقية لقاعدة البيانات
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = body.name || body.fullName || body.fullNameAr;
    const phone = body.phone ? String(body.phone).trim() : null;
    const password = body.password ? String(body.password).trim() : '123456';
    const role = body.role || 'موظف';
    const branchId = body.branchId ? parseInt(String(body.branchId), 10) : null;
    const monthlySalary = parseFloat(body.basicSalary || body.monthlySalary || '0') || 0;
    const annualLeaveDays = parseInt(body.annualLeaveDays || '21', 10) || 21;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    if (!name || !phone) {
      return NextResponse.json(
        { message: 'الاسم ورقم التليفون حقول مطلوبة' },
        { status: 400 }
      );
    }

    // الإدراج في الحقول الحقيقية المعتمدة لجدول users
    const insertResult = await db.execute(sql`
      INSERT INTO users (
        full_name_ar,
        full_name_en,
        phone,
        password_hash,
        system_role,
        job_role,
        primary_branch_id,
        is_active,
        monthly_salary,
        annual_leave_days,
        created_at,
        updated_at
      ) VALUES (
        ${name},
        ${name},
        ${phone},
        ${password},
        'EMPLOYEE',
        ${role},
        ${branchId},
        ${isActive},
        ${monthlySalary},
        ${annualLeaveDays},
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
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    await db.execute(sql`
      UPDATE users
      SET 
        full_name_ar = ${name},
        phone = ${phone},
        job_role = ${role},
        primary_branch_id = ${branchId},
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
