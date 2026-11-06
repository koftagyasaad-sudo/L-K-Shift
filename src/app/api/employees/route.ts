import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

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
          u.employee_code as "employeeCode",
          COALESCE(u.job_role, u.role, 'موظف') as role,
          COALESCE(u.primary_branch_id, u.branch_id) as "branchId",
          COALESCE(u.monthly_salary, 0) as "basicSalary",
          COALESCE(u.working_hours_per_day, 8) as "workingHoursPerDay",
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
        u.employee_code as "employeeCode",
        COALESCE(u.job_role, u.role, 'موظف') as role,
        COALESCE(u.primary_branch_id, u.branch_id) as "branchId",
        COALESCE(u.monthly_salary, 0) as "basicSalary",
        COALESCE(u.working_hours_per_day, 8) as "workingHoursPerDay",
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
    return NextResponse.json({ message: 'فشل استرجاع بيانات الموظفين', error: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = body.name || body.fullName;
    const phone = body.phone ? String(body.phone).trim() : null;
    const employeeCode = body.employeeCode ? String(body.employeeCode).trim() : null;
    const password = body.password ? String(body.password).trim() : '123456';
    const role = body.role || 'موظف';
    const branchId = body.branchId ? parseInt(String(body.branchId), 10) : null;
    const basicSalary = parseFloat(body.basicSalary || '0') || 0;
    const workingHoursPerDay = parseInt(body.workingHoursPerDay || '8', 10) || 8;
    const annualLeaveDays = parseInt(body.annualLeaveDays || '21', 10) || 21;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    if (!name || !phone || !employeeCode) {
      return NextResponse.json({ message: 'الاسم ورقم الهاتف والرقم الوظيفي حقول إلزامية' }, { status: 400 });
    }

    // فحص الرقم الوظيفي لمنع تكراره
    const codeCheck = await db.execute(sql`
      SELECT id, full_name_ar as name FROM users WHERE employee_code = ${employeeCode} LIMIT 1;
    `);
    const codeRows = Array.isArray(codeCheck) ? codeCheck : (codeCheck as any)?.rows || [];
    if (codeRows.length > 0) {
      return NextResponse.json(
        { message: `الرقم الوظيفي (${employeeCode}) مسجل بالفعل للموظف "${codeRows[0].name}". يرجى اختيار رقم وظيفي مختلف.` },
        { status: 409 }
      );
    }

    // فحص رقم الهاتف
    const phoneCheck = await db.execute(sql`
      SELECT id, full_name_ar as name FROM users WHERE phone = ${phone} LIMIT 1;
    `);
    const phoneRows = Array.isArray(phoneCheck) ? phoneCheck : (phoneCheck as any)?.rows || [];
    if (phoneRows.length > 0) {
      return NextResponse.json(
        { message: `رقم الهاتف (${phone}) مسجل بالفعل للموظف "${phoneRows[0].name}".` },
        { status: 409 }
      );
    }

    const insertResult = await db.execute(sql`
      INSERT INTO users (
        full_name_ar, full_name_en, name, phone, employee_code, password, password_hash,
        job_role, role, system_role, primary_branch_id, branch_id, monthly_salary,
        working_hours_per_day, annual_leave_days, is_active, created_at, updated_at
      ) VALUES (
        ${name}, ${name}, ${name}, ${phone}, ${employeeCode}, ${password}, ${password},
        ${role}, ${role}, 'EMPLOYEE', ${branchId}, ${branchId}, ${basicSalary},
        ${workingHoursPerDay}, ${annualLeaveDays}, ${isActive}, NOW(), NOW()
      )
      RETURNING id, full_name_ar as name, employee_code as "employeeCode";
    `);

    const rows = Array.isArray(insertResult) ? insertResult : (insertResult as any)?.rows || [];
    return NextResponse.json({ message: 'تم حفظ الموظف بنجاح', employee: rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    if (error?.message?.includes('users_employee_code_unique')) {
      return NextResponse.json({ message: 'الرقم الوظيفي مسجل مسبقاً لموظف آخر.' }, { status: 409 });
    }
    return NextResponse.json({ message: error?.message || 'فشل حفظ بيانات الموظف', error: error?.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json();
    const rawId = searchParams.get('id') || body.id;

    if (!rawId) {
      return NextResponse.json({ message: 'معرف الموظف مفقود' }, { status: 400 });
    }

    const employeeId = parseInt(String(rawId), 10);
    const name = body.name || body.fullName;
    const phone = body.phone ? String(body.phone).trim() : null;
    const employeeCode = body.employeeCode ? String(body.employeeCode).trim() : null;
    const role = body.role || 'موظف';
    const branchId = body.branchId ? parseInt(String(body.branchId), 10) : null;
    const basicSalary = parseFloat(body.basicSalary || '0') || 0;
    const workingHoursPerDay = parseInt(body.workingHoursPerDay || '8', 10) || 8;
    const annualLeaveDays = parseInt(body.annualLeaveDays || '21', 10) || 21;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;
    const password = body.password ? String(body.password).trim() : null;

    if (employeeCode) {
      const codeCheck = await db.execute(sql`
        SELECT id, full_name_ar as name FROM users WHERE employee_code = ${employeeCode} AND id != ${employeeId} LIMIT 1;
      `);
      const codeRows = Array.isArray(codeCheck) ? codeCheck : (codeCheck as any)?.rows || [];
      if (codeRows.length > 0) {
        return NextResponse.json(
          { message: `لا يمكن استخدام الرقم الوظيفي (${employeeCode}) لأنه مسجل للموظف "${codeRows[0].name}".` },
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
        employee_code = ${employeeCode},
        job_role = ${role},
        role = ${role},
        primary_branch_id = ${branchId},
        branch_id = ${branchId},
        monthly_salary = ${basicSalary},
        working_hours_per_day = ${workingHoursPerDay},
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
    return NextResponse.json({ message: 'فشل تحديث بيانات الموظف', error: error?.message }, { status: 500 });
  }
}

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
    return NextResponse.json({ message: 'فشل حذف الموظف', error: error?.message }, { status: 500 });
  }
}
