import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { authorizeApi, hasApiPermission } from "@/lib/api-auth";
import { hashPassword } from "@/lib/passwords";
import { validateStrongPassword } from "@/lib/password-policy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function resultRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (typeof result === "object" && result !== null && "rows" in result && Array.isArray(result.rows)) {
    return result.rows as T[];
  }
  return [];
}

function nullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

let empSchemaReady = false;
async function ensureEmployeesSchema() {
  if (empSchemaReady) return;
  const statements = [
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name_ar text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name_en text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_alt text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id_expiry date`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date date`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender text DEFAULT 'MALE'`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS marital_status text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS military_status text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS address text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS social_insurance_no text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS driving_license text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_name text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_relation text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_method text DEFAULT 'INSTAPAY'`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_account text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS education_level text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS education_field text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS graduation_year integer`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS working_days_per_month integer DEFAULT 26`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS hire_date date`,

    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_number text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_code text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS job_role text DEFAULT 'موظف'`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_salary numeric DEFAULT 5000`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS working_hours_per_day integer DEFAULT 8`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS shift_start_time text DEFAULT '10:00'`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS shift_end_time text DEFAULT '18:00'`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS shift_name text DEFAULT 'الشيفت الصباحي'`,
    sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_primary_branch_id_branches_id_fk`,
    sql`ALTER TABLE users ALTER COLUMN primary_branch_id TYPE text USING primary_branch_id::text`,
  ];
  for (const s of statements) {
    try { await db.execute(s); } catch {}
  }
  
    try {
      await db.execute(sql`
        UPDATE users
        SET system_role = 'EMPLOYEE'
        WHERE BTRIM(COALESCE(job_role, '')) <> 'مدير النظام'
          AND BTRIM(phone) <> '01068390982'
          AND system_role::text = 'SUPER_ADMIN';
      `);
    } catch {}
  
  empSchemaReady = true;
}

export async function GET(request: NextRequest) {
  try {
    const authorization = await authorizeApi("employees.view");
    if ("response" in authorization) return authorization.response;
    await ensureEmployeesSchema();

    const { searchParams } = new URL(request.url);
    const empId = searchParams.get("id");
    const principal = authorization.principal;

    const branchFilter =
      principal.systemRole === "SUPER_ADMIN" || principal.branchScope === "ALL"
        ? sql`TRUE`
        : principal.branchScope === "CUSTOM"
        ? principal.allowedBranchIds.length
          ? sql`COALESCE(u.primary_branch_id::text, '') = ANY(${principal.allowedBranchIds}::text[])`
          : sql`FALSE`
        : principal.primaryBranchId
        ? sql`COALESCE(u.primary_branch_id::text, '') = ${principal.primaryBranchId}`
        : sql`FALSE`;

    const idFilter = empId ? sql`AND u.id::text = ${empId.trim()}` : sql``;

    const raw = await db.execute(sql`
            SELECT 
        u.id::text AS id,
        COALESCE(u.full_name_ar, 'موظف') AS "fullNameAr",
        COALESCE(u.full_name_ar, 'موظف') AS "name",
        COALESCE(u.full_name_ar, 'موظف') AS "fullName",
        COALESCE(u.full_name_en, '') AS "fullNameEn",
        COALESCE(u.phone, '') AS "phone",
        COALESCE(u.phone_alt, '') AS "phoneAlt",
        COALESCE(u.national_id, '') AS "nationalId",
        COALESCE(TO_CHAR(u.national_id_expiry, 'YYYY-MM-DD'), '') AS "nationalIdExpiry",
        COALESCE(TO_CHAR(u.birth_date, 'YYYY-MM-DD'), '') AS "birthDate",
        COALESCE(u.gender, 'MALE') AS "gender",
        COALESCE(u.marital_status, '') AS "maritalStatus",
        COALESCE(u.military_status, '') AS "militaryStatus",
        COALESCE(u.address, '') AS "address",
        COALESCE(u.social_insurance_no, '') AS "socialInsuranceNo",
        COALESCE(u.driving_license, '') AS "drivingLicense",
        COALESCE(u.emergency_name, '') AS "emergencyName",
        COALESCE(u.emergency_relation, '') AS "emergencyRelation",
        COALESCE(u.emergency_contact, '') AS "emergencyContact",
        COALESCE(u.emergency_contact, '') AS "emergencyPhone",
        COALESCE(u.payout_method, 'INSTAPAY') AS "payoutMethod",
        COALESCE(u.payout_account, '') AS "payoutAccount",
        COALESCE(u.bank_name, '') AS "bankName",
        COALESCE(u.education_level, '') AS "educationLevel",
        COALESCE(u.education_field, '') AS "educationField",
        COALESCE(u.graduation_year, 0) AS "graduationYear",
        COALESCE(u.avatar_url, '') AS "avatarUrl",
        COALESCE(
          NULLIF(CASE WHEN LENGTH(u.employee_number) <= 10 THEN u.employee_number ELSE NULL END, ''),
          NULLIF(CASE WHEN LENGTH(u.employee_code) <= 10 THEN u.employee_code ELSE NULL END, ''),
          '001'
        ) AS "employeeCode",
        COALESCE(
          NULLIF(CASE WHEN LENGTH(u.employee_number) <= 10 THEN u.employee_number ELSE NULL END, ''),
          '001'
        ) AS "employeeNumber",
        u.primary_branch_id::text AS "branchId",
        u.primary_branch_id::text AS "primaryBranchId",
        COALESCE(b.name_ar, 'الإدارة') AS "branchName",
        COALESCE(u.job_role, 'موظف') AS "role",
        COALESCE(u.job_role, 'موظف') AS "jobRole",
        COALESCE(u.system_role::text, 'EMPLOYEE') AS "systemRole",
        COALESCE(u.monthly_salary, 5000) AS "monthlySalary",
        COALESCE(u.monthly_salary, 5000) AS "basicSalary",
        COALESCE(u.working_hours_per_day, 8) AS "workingHoursPerDay",
        COALESCE(u.working_days_per_month, 26) AS "workingDaysPerMonth",
        COALESCE(u.is_active, true) AS "isActive",
        COALESCE(u.shift_start_time, '10:00') AS "shiftStartTime",
        COALESCE(u.shift_end_time, '18:00') AS "shiftEndTime",
        COALESCE(u.shift_name, 'الشيفت الصباحي') AS "shiftName",
        COALESCE(TO_CHAR(u.hire_date, 'YYYY-MM-DD'), TO_CHAR(u.created_at, 'YYYY-MM-DD'), '') AS "hireDate",
        u.created_at AS "createdAt"
      FROM users u
      LEFT JOIN branches b ON u.primary_branch_id::text = b.id::text
      WHERE ${branchFilter} ${idFilter}
      ORDER BY u.created_at ASC;
    `);

    const rows = resultRows<Record<string, unknown>>(raw);
    const canSeeSalary =
      principal.systemRole === "SUPER_ADMIN" ||
      hasApiPermission(principal, "payroll.view") ||
      hasApiPermission(principal, "reports.view") ||
      hasApiPermission(principal, "employees.manage");

    const visibleEmployees = rows.map((employee) => ({
      ...employee,
      monthlySalary: canSeeSalary ? employee.monthlySalary : null,
      basicSalary: canSeeSalary ? employee.basicSalary : null,
    }));

    return NextResponse.json(visibleEmployees, { status: 200 });
  } catch (error) {
    console.error("Employees GET error:", error);
    return NextResponse.json({ message: "تعذر تحميل بيانات الموظفين." }, { status: 500 });
  }
}

async function resolveBranchId(inputBranch: unknown, fallbackBranchId: string | null): Promise<string | null> {
  const rawVal = inputBranch == null ? "" : String(inputBranch).trim();
  if (!rawVal || rawVal === "0" || rawVal === "NaN" || rawVal === "null" || rawVal === "undefined") {
    return fallbackBranchId;
  }
  try {
    const found = await db.execute(sql`
      SELECT id::text AS id FROM branches
      WHERE id::text = ${rawVal}
         OR BTRIM(name_ar) = ${rawVal}
         OR BTRIM(name_en) = ${rawVal}
      LIMIT 1;
    `);
    const rows = resultRows<{ id: string }>(found);
    if (rows.length > 0) return rows[0].id;
  } catch {}
  return rawVal;
}

export async function POST(request: NextRequest) {
  try {
    const authorization = await authorizeApi("employees.manage");
    if ("response" in authorization) return authorization.response;
    await ensureEmployeesSchema();

    const body = await request.json();
    const {
      id, fullNameAr, phone, password, employeeCode, branchId,
      role, monthlySalary, workingHoursPerDay, isActive,
      shiftStartTime, shiftEndTime, shiftName,
    } = body;

    const normalizedFullNameAr =
      nullableText(fullNameAr) || nullableText(body.fullName) || nullableText(body.name);
    const normalizedPhone = nullableText(phone);
    const salaryValue = monthlySalary ?? body.basicSalary;

    if (!normalizedFullNameAr || !normalizedPhone) {
      return NextResponse.json({ message: "الاسم ورقم الهاتف مطلوبان" }, { status: 400 });
    }

    const requestedBranchId = await resolveBranchId(branchId, authorization.principal.primaryBranchId);
    const rawCode = employeeCode ? String(employeeCode).trim() : "";
    const cleanCode = rawCode && rawCode.length <= 10 ? rawCode : null;
    const cleanRole = role && role !== "موظف (قيد المراجعة)" ? String(role).trim() : "موظف";
    const parsedSalary = salaryValue !== undefined && salaryValue !== null && salaryValue !== ""
      ? Number(salaryValue) || 0
      : 5000;
    const parsedHours = workingHoursPerDay ? parseInt(String(workingHoursPerDay), 10) || 8 : 8;
    const activeFlag = isActive !== false;

    if (id) {
      const targetId = String(id).trim();
      // Core update with guaranteed columns
      await db.execute(sql`
        UPDATE users
        SET 
          full_name_ar = ${normalizedFullNameAr},
          phone = ${normalizedPhone},
          job_role = ${cleanRole},
          system_role = ${cleanRole === "مدير النظام" ? "SUPER_ADMIN" : "EMPLOYEE"},
          monthly_salary = ${parsedSalary},
          working_hours_per_day = ${parsedHours},
          is_active = ${activeFlag}
        WHERE id::text = ${targetId};
      `);

      // Update branch & shift columns in isolated blocks so type/constraint differences never fail the save
      try {
        await db.execute(sql`
          UPDATE users
          SET primary_branch_id = ${requestedBranchId}
          WHERE id::text = ${targetId};
        `);
      } catch (branchErr) {
        console.warn("Branch ID update fallback:", branchErr);
      }

      if (cleanCode) {
        try {
          await db.execute(sql`
            UPDATE users
            SET employee_number = ${cleanCode}, employee_code = ${cleanCode}
            WHERE id::text = ${targetId};
          `);
        } catch {}
      }

      try {
        await db.execute(sql`
          UPDATE users
          SET 
            shift_start_time = ${shiftStartTime || "10:00"},
            shift_end_time = ${shiftEndTime || "18:00"},
            shift_name = ${shiftName || "الشيفت الصباحي"}
          WHERE id::text = ${targetId};
        `);
      } catch {}

      if (password && String(password).trim() !== "") {
        const pwCheck = validateStrongPassword(String(password));
        if (!pwCheck.valid) {
          return NextResponse.json({ message: pwCheck.message }, { status: 400 });
        }
        const hashed = await hashPassword(String(password));
        await db.execute(sql`UPDATE users SET password_hash = ${hashed} WHERE id::text = ${targetId};`);
      }

      return NextResponse.json({ success: true, message: "تم تحديث بيانات الموظف بنجاح" });
    } else {
      let finalCode = cleanCode || "";
      if (!finalCode) {
        const countRes = await db.execute(sql`SELECT (COUNT(*)::int + 1) AS next_num FROM users;`);
        const nextNum = resultRows<{ next_num: number }>(countRes)[0]?.next_num || 1;
        finalCode = String(nextNum).padStart(3, "0");
      }

      const rawPassword = password && String(password).trim() ? String(password).trim() : "Lk@123456";
      const pwCheck = validateStrongPassword(rawPassword);
      if (!pwCheck.valid) {
        return NextResponse.json({ message: pwCheck.message }, { status: 400 });
      }
      const hashedPassword = await hashPassword(rawPassword);
      const newId = randomUUID();

      await db.execute(sql`
        INSERT INTO users (
          id, full_name_ar, phone, password_hash, employee_number, employee_code,
          primary_branch_id, job_role, system_role, monthly_salary, working_hours_per_day,
          is_active, shift_start_time, shift_end_time, shift_name
        ) VALUES (
          ${newId}, ${normalizedFullNameAr}, ${normalizedPhone}, ${hashedPassword},
          ${finalCode}, ${finalCode}, ${requestedBranchId}, ${cleanRole},
          'EMPLOYEE', ${parsedSalary}, ${parsedHours},
          true, ${shiftStartTime || "10:00"}, ${shiftEndTime || "18:00"},
          ${shiftName || "الشيفت الصباحي"}
        );
      `);

      return NextResponse.json({
        success: true,
        id: newId,
        employeeCode: finalCode,
        message: "تم إضافة الموظف بنجاح",
      });
    }
  } catch (error) {
    console.error("Employees POST error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "فشل حفظ الموظف" },
      { status: 500 }
    );
  }
}
