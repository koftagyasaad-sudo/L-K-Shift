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

let codesSanitized = false;
async function ensureCleanEmployeeCodes() {
  if (codesSanitized) return;
  try {
    await db.execute(sql`
      WITH numbered AS (
        SELECT id, LPAD(ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC)::text, 3, '0') AS seq_code
        FROM users
      )
      UPDATE users u
      SET employee_number = n.seq_code,
          employee_code = n.seq_code
      FROM numbered n
      WHERE u.id = n.id
        AND (
          u.employee_number IS NULL
          OR BTRIM(u.employee_number) = ''
          OR LENGTH(u.employee_number) > 10
          OR u.employee_code IS NULL
          OR BTRIM(u.employee_code) = ''
          OR LENGTH(u.employee_code) > 10
        );
    `);
    codesSanitized = true;
  } catch (e) {
    console.warn("Employee code sanitization skipped:", e);
  }
}

export async function GET(request: NextRequest) {
  try {
    const authorization = await authorizeApi("employees.view");
    if ("response" in authorization) return authorization.response;
    await ensureCleanEmployeeCodes();

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
        u.id,
        COALESCE(u.full_name_ar, 'موظف') AS "fullNameAr",
        COALESCE(u.full_name_ar, 'موظف') AS "name",
        COALESCE(u.full_name_ar, 'موظف') AS "fullName",
        COALESCE(u.full_name_en, '') AS "fullNameEn",
        COALESCE(u.phone, '') AS "phone",
        COALESCE(u.national_id, '') AS "nationalId",
        COALESCE(
          NULLIF(CASE WHEN LENGTH(u.employee_number) <= 10 THEN u.employee_number ELSE NULL END, ''),
          NULLIF(CASE WHEN LENGTH(u.employee_code) <= 10 THEN u.employee_code ELSE NULL END, ''),
          '001'
        ) AS "employeeCode",
        COALESCE(
          NULLIF(CASE WHEN LENGTH(u.employee_number) <= 10 THEN u.employee_number ELSE NULL END, ''),
          '001'
        ) AS "employeeNumber",
        u.primary_branch_id AS "branchId",
        u.primary_branch_id AS "primaryBranchId",
        COALESCE(b.name_ar, 'الإدارة') AS "branchName",
        COALESCE(u.job_role, 'موظف') AS "role",
        COALESCE(u.job_role, 'موظف') AS "jobRole",
        COALESCE(u.system_role::text, 'EMPLOYEE') AS "systemRole",
        COALESCE(u.monthly_salary, 5000) AS "monthlySalary",
        COALESCE(u.monthly_salary, 5000) AS "basicSalary",
        COALESCE(u.working_hours_per_day, 8) AS "workingHoursPerDay",
        COALESCE(u.is_active, true) AS "isActive",
        COALESCE(u.shift_start_time, '10:00') AS "shiftStartTime",
        COALESCE(u.shift_end_time, '18:00') AS "shiftEndTime",
        COALESCE(u.shift_name, 'الشيفت الصباحي') AS "shiftName",
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
  const found = await db.execute(sql`
    SELECT id::text AS id FROM branches
    WHERE id::text = ${rawVal}
       OR name_ar = ${rawVal}
       OR name_en = ${rawVal}
    LIMIT 1;
  `);
  const rows = resultRows<{ id: string }>(found);
  if (rows.length > 0) return rows[0].id;
  return fallbackBranchId;
}

export async function POST(request: NextRequest) {
  try {
    const authorization = await authorizeApi("employees.manage");
    if ("response" in authorization) return authorization.response;
    await ensureCleanEmployeeCodes();

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
    const cleanCode = rawCode && rawCode.length <= 10 && !rawCode.includes("-") ? rawCode : null;

    if (id) {
      await db.execute(sql`
        UPDATE users
        SET 
          full_name_ar = ${normalizedFullNameAr},
          phone = ${normalizedPhone},
          employee_number = COALESCE(${cleanCode}, employee_number),
          employee_code = COALESCE(${cleanCode}, employee_code),
          primary_branch_id = ${requestedBranchId},
          job_role = ${role || "موظف"},
          monthly_salary = ${salaryValue ? parseFloat(String(salaryValue)) : 5000},
          working_hours_per_day = ${workingHoursPerDay ? parseInt(String(workingHoursPerDay), 10) : 8},
          is_active = ${isActive !== false},
          shift_start_time = ${shiftStartTime || "10:00"},
          shift_end_time = ${shiftEndTime || "18:00"},
          shift_name = ${shiftName || "الشيفت الصباحي"},
          updated_at = NOW()
        WHERE id::text = ${String(id).trim()};
      `);

      if (password && String(password).trim() !== "") {
        const pwCheck = validateStrongPassword(String(password));
        if (!pwCheck.valid) {
          return NextResponse.json({ message: pwCheck.message }, { status: 400 });
        }
        const hashed = await hashPassword(String(password));
        await db.execute(sql`UPDATE users SET password_hash = ${hashed} WHERE id::text = ${String(id).trim()};`);
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
          is_active, shift_start_time, shift_end_time, shift_name, created_at, updated_at
        ) VALUES (
          ${newId}, ${normalizedFullNameAr}, ${normalizedPhone}, ${hashedPassword},
          ${finalCode}, ${finalCode}, ${requestedBranchId}, ${role || "موظف"},
          'EMPLOYEE', ${salaryValue ? parseFloat(String(salaryValue)) : 5000},
          ${workingHoursPerDay ? parseInt(String(workingHoursPerDay), 10) : 8},
          true, ${shiftStartTime || "10:00"}, ${shiftEndTime || "18:00"},
          ${shiftName || "الشيفت الصباحي"}, NOW(), NOW()
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