import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empId = searchParams.get('id');

    const raw = await db.execute(sql`
      SELECT 
        u.id,
        COALESCE(u.full_name_ar, u.name, 'موظف') as "fullNameAr",
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
        COALESCE(u.employee_number, LPAD(u.id::text, 3, '0')) as "employeeCode",
        COALESCE(u.monthly_salary, 5000) as "monthlySalary",
        COALESCE(u.working_hours_per_day, 8) as "workingHoursPerDay",
        COALESCE(u.working_days_per_month, 26) as "workingDaysPerMonth",
        COALESCE(u.is_active, true) as "isActive",
        COALESCE(b.id, 1) as "branchId",
        COALESCE(b.name_ar, b.name, 'الفرع الرئيسي') as "branchName",
        b.latitude as "branchLat",
        b.longitude as "branchLng",
        COALESCE(b.geofence_radius, 150) as "branchRadius",
        TO_CHAR(u.created_at, 'YYYY-MM-DD') as "hireDate"
      FROM users u
      LEFT JOIN branches b ON b.id = COALESCE(u.primary_branch_id, u.branch_id, 1)
      WHERE ${empId ? sql`u.id::text = ${empId}` : sql`1=1`}
      ORDER BY u.id ASC;
    `);

    const employees = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    return NextResponse.json(employees, { status: 200 });
  } catch (error: any) {
    console.error('Employees GET error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
