import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getSqlRows } from "@/lib/db";
import { hashPassword } from "@/lib/passwords";
import { validateStrongPassword } from "@/lib/password-policy";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { notifyRequestReviewers } from "@/lib/request-notifications";

export const dynamic = "force-dynamic";
export const revalidate = 0;

let registerSchemaReady = false;
async function ensureRegisterSchema() {
  if (registerSchemaReady) return;
  const stmts = [
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name_ar text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name_en text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_number text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_code text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_branch_id text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS job_role text DEFAULT 'موظف'`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS system_role text DEFAULT 'EMPLOYEE'`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_salary numeric DEFAULT 0`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS working_hours_per_day integer DEFAULT 8`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS shift_start_time text DEFAULT '10:00'`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS shift_end_time text DEFAULT '18:00'`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS shift_name text DEFAULT 'الشيفت الصباحي'`,
  ];
  for (const s of stmts) {
    try { await db.execute(s); } catch {}
  }
  registerSchemaReady = true;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit("self-register:" + ip, 10, 15 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json(
      { message: "محاولات تسجيل كثيرة. يرجى الانتظار دقائق والمحاولة مرة أخرى." },
      { status: 429 }
    );
  }

  try {
    await ensureRegisterSchema();
    const body = await request.json();
    const fullName = String(body.fullNameAr || body.fullName || body.name || "").trim();
    const rawPhone = String(body.phone || "").trim();
    // Normalize Arabic-Indic digits if user typed٠١٥...
    const phone = rawPhone.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/\s+/g, "");
    const nationalId = body.nationalId
      ? String(body.nationalId).trim().replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
      : null;
    const password = String(body.password || "");
    let branchId = body.branchId ? String(body.branchId).trim() : null;

    if (!fullName || fullName.length < 3) {
      return NextResponse.json({ message: "يرجى إدخال الاسم رباعياً بشكل صحيح." }, { status: 400 });
    }
    if (!/^01[0125][0-9]{8}$/.test(phone)) {
      return NextResponse.json({ message: "يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقماً." }, { status: 400 });
    }

    const pwCheck = validateStrongPassword(password);
    if (!pwCheck.valid) {
      return NextResponse.json({ message: pwCheck.message }, { status: 400 });
    }

    const existingRows = getSqlRows<{ id: string; is_active: boolean }>(
      await db.execute(sql`SELECT id::text AS id, COALESCE(is_active, true) AS is_active FROM users WHERE BTRIM(phone) = ${phone} LIMIT 1;`)
    );
    if (existingRows.length > 0) {
      const msg = existingRows[0].is_active
        ? "رقم الهاتف مسجل ومفعّل بالفعل. يمكنك تسجيل الدخول مباشرة."
        : "تم تسجيل بيانات هذا الرقم مسبقاً وهو قيد المراجعة والتفعيل من الإدارة.";
      return NextResponse.json({ message: msg }, { status: 409 });
    }

    // Resolve default branch if none was provided so DB foreign-key/not-null never fails
    if (!branchId) {
      try {
        const bRows = getSqlRows<{ id: string }>(
          await db.execute(sql`SELECT id::text AS id FROM branches ORDER BY created_at ASC LIMIT 1;`)
        );
        branchId = bRows[0]?.id || null;
      } catch {}
    }

    // Generate guaranteed unique employee code
    const countRows = getSqlRows<{ total: number }>(
      await db.execute(sql`SELECT COUNT(*)::int AS total FROM users;`)
    );
    const nextNum = (countRows[0]?.total || 0) + 1;
    const empCode = String(nextNum).padStart(3, "0") + "-" + String(Date.now()).slice(-2);

    const hashedPassword = await hashPassword(password);
    const newId = randomUUID();

    await db.execute(sql`
      INSERT INTO users (
        id,
        full_name_ar,
        phone,
        password_hash,
        employee_number,
        employee_code,
        primary_branch_id,
        job_role,
        system_role,
        monthly_salary,
        working_hours_per_day,
        is_active
      ) VALUES (
        ${newId},
        ${fullName},
        ${phone},
        ${hashedPassword},
        ${empCode},
        ${empCode},
        ${branchId},
        'موظف (قيد المراجعة)',
        'EMPLOYEE',
        0,
        8,
        false
      );
    `);

    if (nationalId) {
      try {
        await db.execute(sql`UPDATE users SET national_id = ${nationalId} WHERE id::text = ${newId};`);
      } catch {}
    }

    try {
      await notifyRequestReviewers(
        newId,
        "تسجيل بيانات موظف جديد (بانتظار التفعيل)",
        `قام (${fullName} - ${phone}) بتسجيل بياناته. يرجى مراجعة الحساب وتحديد الفرع والصلاحيات وتفعيله.`,
        "/admin/employees",
        "STAFF_REQUEST",
        branchId
      );
    } catch {}

    return NextResponse.json({
      success: true,
      pendingApproval: true,
      message: "تم تسجيل بياناتك بنجاح! حسابك الآن قيد المراجعة لدى الإدارة لتحديد الصلاحيات وتفعيل الحساب.",
    }, { status: 201 });
  } catch (error) {
    console.error("Self-registration error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "حدث خطأ أثناء تسجيل البيانات." },
      { status: 500 }
    );
  }
}
