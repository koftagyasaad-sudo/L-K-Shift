import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// 1. استرجاع قائمة الموظفين أو موظف محدد
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('id');

    if (employeeId) {
      const parsedId = parseInt(employeeId, 10);
      const singleRaw = await db.execute(sql`
        SELECT 
          u.id,
          COALESCE(u.full_name_ar, u.name, 'موظف') as name,
          COALESCE(u.full_name_ar, u.name, 'موظف') as "fullName",
          u.phone,
          COALESCE(u.job_role, u.role, 'موظف') as role,
          COALESCE(u.primary_branch_id, u.branch_id) as "branchId",
          COALESCE(u.monthly_salary, 0) as "basicSalary",
          COALESCE(u.annual_leave_days, 21) as "annualLeaveDays",
          u.password,
          u.password_hash,
          u.is_active as "isActive",
          b.name_ar as "branchName"
        FROM users u
        LEFT JOIN branches b ON COALESCE(u.primary_branch_id, u.branch_id) = b.id
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
        COALESCE(u.full_name_ar, u.name, 'موظف') as name,
        COALESCE(u.full_name_ar, u.name, 'موظف') as "fullName",
        u.phone,
        COALESCE(u.job_role, u.role, 'موظف') as role,
        COALESCE(u.primary_branch_id, u.branch_id) as "branchId",
        COALESCE(u.monthly_salary, 0) as "basicSalary",
        COALESCE(u.annual_leave_days, 21) as "annualLeaveDays",
        u.password,
        u.password_hash,
        u.is_active as "isActive",
        b.name_ar as "branchName",
        u.created_at as "createdAt"
      FROM users u
      LEFT JOIN branches b ON COALESCE(u.primary_branch_id, u.branch_id) = b.id
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

// 2. إضافة موظف جديد مع فحص مسبق لمنع تكرار رقم الهاتف
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

    // فحص مسبق في قاعدة البيانات لمنع أخطاء الـ Unique Constraint
    const existingCheck = await db.execute(sql`
      SELECT id, full_name_ar as name FROM users WHERE phone = ${phone} LIMIT 1;
    `);
    const existingRows = Array.isArray(existingCheck) ? existingCheck : (existingCheck as any)?.rows || [];
    if (existingRows.length > 0) {
      return NextResponse.json(
        {
          message: `رقم الهاتف (${phone}) مسجل بالفعل باسم الموظف "${existingRows[0].name}". يرجى استخدام رقم آخر أو تعديل الحساب القائم.`,
        },
        { status: 409 }
      );
    }

    const insertResult = await db.execute(sql`
      INSERT INTO users (
        full_name_ar,
        full_name_en,
        name,
        phone,
        password,
        password_hash,
        job_role,
        role,
        system_role,
        primary_branch_id,
        branch_id,
        monthly_salary,
        annual_leave_days,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        ${name},
        ${name},
        ${name},
        ${phone},
        ${password},
        ${password},
        ${role},
        ${role},
        'EMPLOYEE',
        ${branchId},
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

    // التعامل مع تعارض المفاتيح في حال تم إرسال طلبين في نفس اللحظة
    if (error?.message?.includes('users_phone_unique') || error?.code === '23505') {
      return NextResponse.json(
        { message: 'رقم الهاتف مسجل بالفعل في المنظومة، يرجى كتابة رقم آخر.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: error?.message || 'فشل حفظ بيانات الموظف', error: error?.message },
      { status: 500 }
    );
  }
}

// 3. تحديث بيانات الموظف مع منع تضارب رقم الهاتف مع موظف آخر
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
    const password = body.password ? String(body.password).trim() : null;

    if (phone) {
      const conflictCheck = await db.execute(sql`
        SELECT id, full_name_ar as name FROM users WHERE phone = ${phone} AND id != ${employeeId} LIMIT 1;
      `);
      const conflictRows = Array.isArray(conflictCheck) ? conflictCheck : (conflictCheck as any)?.rows || [];
      if (conflictRows.length > 0) {
        return NextResponse.json(
          { message: `لا يمكن استخدام رقم الهاتف (${phone}) لأنه مسجل لموظف آخر.` },
          { status: 409 }
        );
      }
    }

    let query = sql`
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
    `;

    if (password) {
      query = sql`${query}, password = ${password}, password_hash = ${password}`;
    }

    query = sql`${query} WHERE id = ${employeeId};`;

    await db.execute(query);

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
