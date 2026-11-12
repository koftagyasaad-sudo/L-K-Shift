import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { authorizeApi, canAccessBranch, hasApiPermission } from '@/lib/api-auth';
import { hashPassword } from '@/lib/passwords';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function resultRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (typeof result === 'object' && result !== null && 'rows' in result && Array.isArray(result.rows)) {
    return result.rows as T[];
  }
  return [];
}

function nullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

export async function GET(request: NextRequest) {
  try {
    const authorization = await authorizeApi('employees.view');
    if ('response' in authorization) return authorization.response;

    const { searchParams } = new URL(request.url);
    const empId = searchParams.get('id');
    const principal = authorization.principal;
    const branchFilter = principal.systemRole === 'SUPER_ADMIN' || principal.branchScope === 'ALL'
      ? sql`TRUE`
      : principal.branchScope === 'CUSTOM'
        ? principal.allowedBranchIds.length
          ? sql`COALESCE(u.primary_branch_id::text, u.branch_id::text, '') = ANY(${principal.allowedBranchIds}::text[])`
          : sql`FALSE`
        : principal.primaryBranchId
          ? sql`COALESCE(u.primary_branch_id::text, u.branch_id::text, '') = ${principal.primaryBranchId}`
          : sql`FALSE`;

    const raw = await db.execute(sql`
      SELECT 
        u.id,
        COALESCE(u.full_name_ar, u.name, 'موظف') as "fullNameAr",
        COALESCE(u.full_name_ar, u.name, 'موظف') as "name",
        COALESCE(u.full_name_ar, u.name, 'موظف') as "fullName",
        COALESCE(u.full_name_en, '') as "fullNameEn",
        COALESCE(u.phone, '') as "phone",
        COALESCE(u.phone_alt, '') as "phoneAlt",
        COALESCE(u.national_id, '') as "nationalId",
        TO_CHAR(u.national_id_expiry, 'YYYY-MM-DD') as "nationalIdExpiry",
        TO_CHAR(u.birth_date, 'YYYY-MM-DD') as "birthDate",
        COALESCE(u.gender, 'MALE') as "gender",
        COALESCE(u.marital_status, '') as "maritalStatus",
        COALESCE(u.military_status, '') as "militaryStatus",
        COALESCE(u.address, '') as "address",
        COALESCE(u.social_insurance_no, '') as "socialInsuranceNo",
        COALESCE(u.driving_license, '') as "drivingLicense",
        COALESCE(u.emergency_name, '') as "emergencyName",
        COALESCE(u.emergency_relation, '') as "emergencyRelation",
        COALESCE(u.emergency_contact, '') as "emergencyContact",
        COALESCE(u.payout_method, 'INSTAPAY') as "payoutMethod",
        COALESCE(u.payout_account, '') as "payoutAccount",
        COALESCE(u.bank_name, '') as "bankName",
        COALESCE(u.education_level, '') as "educationLevel",
        COALESCE(u.education_field, '') as "educationField",
        u.graduation_year as "graduationYear",
        COALESCE(u.avatar_url, '') as "avatarUrl",
        COALESCE(u.job_role, u.system_role::text, 'موظف') as "role",
        COALESCE(u.system_role::text, 'EMPLOYEE') as "systemRole",
        COALESCE(NULLIF(TRIM(u.employee_number), ''), u.id::text) as "employeeCode",
        COALESCE(u.monthly_salary, 5000) as "monthlySalary",
        COALESCE(u.working_hours_per_day, 8) as "workingHoursPerDay",
        26 as "workingDaysPerMonth",
        COALESCE(u.is_active, true) as "isActive",
        b.id::text as "branchId",
        COALESCE(b.name_ar, b.name, 'الفرع الرئيسي') as "branchName",
        NULLIF(b.latitude::text, '')::double precision as "branchLat",
        NULLIF(b.longitude::text, '')::double precision as "branchLng",
        COALESCE(b.geofence_radius, 100) as "branchRadius",
        TO_CHAR(u.created_at, 'YYYY-MM-DD') as "hireDate",
        COALESCE(u.shift_name, 'الشيفت الصباحي') as "shiftName",
        COALESCE(u.shift_start_time, '10:00') as "shiftStartTime",
        COALESCE(u.shift_end_time, '18:00') as "shiftEndTime"
      FROM users u
      LEFT JOIN branches b ON b.id::text = COALESCE(u.primary_branch_id::text, u.branch_id::text, '')
      WHERE ${empId ? sql`u.id::text = ${empId}` : sql`TRUE`}
        AND ${branchFilter}
      ORDER BY COALESCE(NULLIF(regexp_replace(u.employee_number, '\D', '', 'g'), '')::integer, 999999) ASC, u.id ASC
    `);

    const employees = resultRows<Record<string, unknown>>(raw);
    const visibleEmployees = employees.map((employee) => ({
      ...employee,
      monthlySalary: hasApiPermission(principal, 'payroll.view')
        || hasApiPermission(principal, 'reports.view')
        ? employee.monthlySalary
        : null,
    }));
    return NextResponse.json(visibleEmployees, { status: 200 });
  } catch (error) {
    console.error('Employees GET error:', error);
    return NextResponse.json({ message: 'تعذر تحميل بيانات الموظفين.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorization = await authorizeApi('employees.manage');
    if ('response' in authorization) return authorization.response;

    const body = await request.json();
    const {
      id,
      fullNameAr,
      phone,
      employeeCode,
      branchId,
      role,
      monthlySalary,
      workingHoursPerDay,
      isActive,
      shiftStartTime,
      shiftEndTime,
      shiftName,
    } = body;

    const normalizedFullNameAr = nullableText(fullNameAr)
      || nullableText(body.fullName)
      || nullableText(body.name);
    const normalizedPhone = nullableText(phone);
    const salaryValue = monthlySalary ?? body.basicSalary;
    if (!normalizedFullNameAr || !normalizedPhone) {
      return NextResponse.json({ message: 'الاسم ورقم الهاتف مطلوبان' }, { status: 400 });
    }

    const selectedBranchId = branchId == null ? '' : String(branchId).trim();
    const fallbackBranchId = authorization.principal.primaryBranchId || '';
    const requestedBranchId = selectedBranchId && selectedBranchId !== '0' && selectedBranchId !== 'NaN'
      ? selectedBranchId
      : fallbackBranchId && fallbackBranchId !== '0' && fallbackBranchId !== 'NaN'
        ? fallbackBranchId
        : null;
    if (!canAccessBranch(authorization.principal, requestedBranchId)) {
      return NextResponse.json({ message: 'ممنوع' }, { status: 403 });
    }

    if (id) {
      const currentRaw = await db.execute(sql`
        SELECT primary_branch_id::text AS branch_id FROM users WHERE id::text = ${String(id)} LIMIT 1;
      `);
      const currentRows = resultRows<{ branch_id: string | null }>(currentRaw);
      if (!currentRows.length) {
        return NextResponse.json({ message: 'الموظف غير موجود' }, { status: 404 });
      }
      const currentBranchId = currentRows[0].branch_id;
      if (!canAccessBranch(authorization.principal, currentBranchId)) {
        return NextResponse.json({ message: 'ممنوع' }, { status: 403 });
      }

      await db.execute(sql`
        UPDATE users SET full_name_ar = ${normalizedFullNameAr},
          phone = ${normalizedPhone},
          employee_number = COALESCE(NULLIF(TRIM(${employeeCode && String(employeeCode).length < 15 ? employeeCode : ''}), ''), employee_number), employee_code = COALESCE(NULLIF(TRIM(${employeeCode && String(employeeCode).length < 15 ? employeeCode : ''}), ''), employee_code),
          primary_branch_id = ${requestedBranchId},
          job_role = ${role || 'موظف'},
          monthly_salary = ${salaryValue ? parseFloat(salaryValue) : 5000},
          working_hours_per_day = ${workingHoursPerDay ? parseInt(workingHoursPerDay, 10) : 8},
          is_active = ${isActive !== false},
          shift_start_time = ${shiftStartTime || '10:00'},
          shift_end_time = ${shiftEndTime || '18:00'},
          shift_name = ${shiftName || 'الشيفت الصباحي'},
          updated_at = NOW()
        WHERE id::text = ${String(id)};
      `);
      return NextResponse.json({ success: true, message: 'تم تحديث بيانات الموظف بنجاح' });
    } else {
      let finalCode = employeeCode ? employeeCode.trim() : '';
      if (!finalCode) {
        const codeQuery = await db.execute(sql`
          SELECT LPAD((COALESCE(MAX(NULLIF(regexp_replace(employee_number, '\D', '', 'g'), '')::integer), 0) + 1)::text, 3, '0') as next_code
          FROM users;
        `);
        finalCode = resultRows<{ next_code: string }>(codeQuery)[0]?.next_code || '001';
      }

      await db.execute(sql`
        INSERT INTO users (
          id,
          full_name_ar,
          name,
          phone,
          employee_number,
          password_hash,
          primary_branch_id,
          branch_id,
          job_role,
          system_role,
          national_id,
          email,
          phone_alt,
          social_insurance_no,
          driving_license,
          address,
          birth_date,
          national_id_expiry,
          monthly_salary,
          working_hours_per_day,
          is_active,
          shift_start_time,
          shift_end_time,
          shift_name,
          created_at,
          updated_at
        ) VALUES (
          ${randomUUID()},
          ${normalizedFullNameAr},
          COALESCE(NULLIF(${nullableText(body.name) || ''}, ''), ${normalizedFullNameAr}),
          ${normalizedPhone},
          ${finalCode},
          ${await hashPassword(nullableText(body.password) || '123456')},
          ${requestedBranchId},
          ${requestedBranchId},
          ${role || 'عضو مطبخ'},
          'EMPLOYEE',
          ${nullableText(body.nationalId)},
          ${nullableText(body.email)},
          ${nullableText(body.phoneAlt)},
          ${nullableText(body.socialInsuranceNo)},
          ${nullableText(body.drivingLicense)},
          ${nullableText(body.address)},
          NULLIF(${nullableText(body.birthDate) || ''}, '')::date,
          NULLIF(${nullableText(body.nationalIdExpiry) || ''}, '')::date,
          ${salaryValue ? parseFloat(salaryValue) : 5000},
          ${workingHoursPerDay ? parseInt(workingHoursPerDay, 10) : 8},
          true,
          ${shiftStartTime || '10:00'},
          ${shiftEndTime || '18:00'},
          ${shiftName || 'الشيفت الصباحي'},
          NOW(),
          NOW()
        );
      `);
      return NextResponse.json({ success: true, message: `تمت إضافة الموظف الجديد بالمسلسل (#${finalCode}) بنجاح` });
    }
  } catch (error) {
    console.error('Employees POST error:', error);
    return NextResponse.json({ message: 'فشل حفظ الموظف' }, { status: 500 });
  }
}
