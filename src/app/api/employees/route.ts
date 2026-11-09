import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { authorizeApi, canAccessBranch, hasApiPermission } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const authorization = await authorizeApi('employees.view');
    if ('response' in authorization) return authorization.response;

    const { searchParams } = new URL(request.url);
    const empId = searchParams.get('id');

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
        COALESCE(NULLIF(TRIM(u.employee_number), ''), LPAD(u.id::text, 3, '0')) as "employeeCode",
        COALESCE(u.monthly_salary, 5000) as "monthlySalary",
        COALESCE(u.working_hours_per_day, 8) as "workingHoursPerDay",
        COALESCE(u.working_days_per_month, 26) as "workingDaysPerMonth",
        COALESCE(u.is_active, true) as "isActive",
        COALESCE(b.id, 1) as "branchId",
        COALESCE(b.name_ar, b.name, 'الفرع الرئيسي') as "branchName",
        b.latitude as "branchLat",
        b.longitude as "branchLng",
        COALESCE(b.geofence_radius, 150) as "branchRadius",
        TO_CHAR(u.created_at, 'YYYY-MM-DD') as "hireDate",
        COALESCE(u.shift_name, 'الشيفت الصباحي') as "shiftName",
        COALESCE(u.shift_start_time, '10:00') as "shiftStartTime",
        COALESCE(u.shift_end_time, '18:00') as "shiftEndTime"
      FROM users u
      LEFT JOIN branches b ON b.id = COALESCE(u.primary_branch_id, u.branch_id, 1)
      WHERE ${empId ? sql`u.id::text = ${empId}` : sql`1=1`}
      ORDER BY COALESCE(NULLIF(regexp_replace(u.employee_number, '\D', '', 'g'), '')::integer, u.id) ASC;
    `);

    const employees = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    const visibleEmployees = employees.filter((employee: any) => {
      const branchId = employee.branchId == null ? null : Number(employee.branchId);
      return canAccessBranch(authorization.principal, branchId);
    }).map((employee: any) => ({
      ...employee,
      monthlySalary: hasApiPermission(authorization.principal, 'payroll.view')
        || hasApiPermission(authorization.principal, 'reports.view')
        ? employee.monthlySalary
        : null,
    }));
    return NextResponse.json(visibleEmployees, { status: 200 });
  } catch (error: any) {
    console.error('Employees GET error:', error);
    return NextResponse.json([], { status: 200 });
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

    if (!fullNameAr || !phone) {
      return NextResponse.json({ message: 'الاسم ورقم الهاتف مطلوبان' }, { status: 400 });
    }

    const requestedBranchId = branchId
      ? Number.parseInt(String(branchId), 10)
      : authorization.principal.primaryBranchId;
    if (requestedBranchId !== null && !Number.isSafeInteger(requestedBranchId)) {
      return NextResponse.json({ message: 'معرف الفرع غير صالح' }, { status: 400 });
    }
    if (!canAccessBranch(authorization.principal, requestedBranchId)) {
      return NextResponse.json({ message: 'ممنوع' }, { status: 403 });
    }

    if (id) {
      const currentRaw = await db.execute(sql`
        SELECT COALESCE(primary_branch_id, branch_id) AS branch_id
        FROM users WHERE id = ${parseInt(id, 10)} LIMIT 1;
      `);
      const currentRows = Array.isArray(currentRaw) ? currentRaw : (currentRaw as any)?.rows || [];
      if (!currentRows.length) {
        return NextResponse.json({ message: 'الموظف غير موجود' }, { status: 404 });
      }
      const currentBranchId = currentRows[0].branch_id == null ? null : Number(currentRows[0].branch_id);
      if (!canAccessBranch(authorization.principal, currentBranchId)) {
        return NextResponse.json({ message: 'ممنوع' }, { status: 403 });
      }

      await db.execute(sql`
        UPDATE users
        SET 
          full_name_ar = ${fullNameAr},
          name = ${fullNameAr},
          phone = ${phone},
          employee_number = COALESCE(NULLIF(TRIM(${employeeCode || ''}), ''), employee_number),
          primary_branch_id = ${branchId ? parseInt(branchId, 10) : 1},
          job_role = ${role || 'موظف'},
          monthly_salary = ${monthlySalary ? parseFloat(monthlySalary) : 5000},
          working_hours_per_day = ${workingHoursPerDay ? parseInt(workingHoursPerDay, 10) : 8},
          is_active = ${isActive !== false},
          shift_start_time = ${shiftStartTime || '10:00'},
          shift_end_time = ${shiftEndTime || '18:00'},
          shift_name = ${shiftName || 'الشيفت الصباحي'},
          updated_at = NOW()
        WHERE id = ${parseInt(id, 10)};
      `);
      return NextResponse.json({ success: true, message: 'تم تحديث بيانات الموظف بنجاح' });
    } else {
      let finalCode = employeeCode ? employeeCode.trim() : '';
      if (!finalCode) {
        const codeQuery = await db.execute(sql`
          SELECT LPAD((COALESCE(MAX(NULLIF(regexp_replace(employee_number, '\D', '', 'g'), '')::integer), 0) + 1)::text, 3, '0') as next_code
          FROM users;
        `);
        const rows = Array.isArray(codeQuery) ? codeQuery : (codeQuery as any)?.rows || [];
        finalCode = rows[0]?.next_code || '001';
      }

      await db.execute(sql`
        INSERT INTO users (
          full_name_ar,
          name,
          phone,
          employee_number,
          password_hash,
          primary_branch_id,
          job_role,
          system_role,
          monthly_salary,
          working_hours_per_day,
          is_active,
          shift_start_time,
          shift_end_time,
          shift_name,
          created_at,
          updated_at
        ) VALUES (
          ${fullNameAr},
          ${fullNameAr},
          ${phone},
          ${finalCode},
          '123456',
          ${branchId ? parseInt(branchId, 10) : 1},
          ${role || 'عضو مطبخ'},
          'EMPLOYEE',
          ${monthlySalary ? parseFloat(monthlySalary) : 5000},
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
  } catch (error: any) {
    console.error('Employees POST error:', error);
    return NextResponse.json({ message: error?.message || 'فشل حفظ الموظف' }, { status: 500 });
  }
}
